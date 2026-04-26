import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAccountContext } from "@/lib/account-kind";
import type { UnitData, UnitLanguage } from "./types";
import UnitClient from "./UnitClient";

const unitFileMap: Record<string, { file: string; unitNumber: number }> = {
  "1": { file: "u01_convenience", unitNumber: 1 },
  "2": { file: "u02_subway", unitNumber: 2 },
};

const SUPPORTED_LANGS: UnitLanguage[] = ["vi", "en", "zh", "id"];
const FALLBACK_LANG: UnitLanguage = "vi";

// 현재 /unit/[unitId] 는 TOPIK 1 전용 (PROGRESS.md 참조).
// TOPIK 2 / EPS 는 /unit/topik2/[unitId], /unit/eps/[unitId] 로 분리될 예정.
const THIS_ROUTE_COURSE = "topik1" as const;

function normalizeLanguage(raw: string | null | undefined): UnitLanguage {
  if (!raw) return FALLBACK_LANG;
  const lower = raw.toLowerCase();
  return (SUPPORTED_LANGS as string[]).includes(lower)
    ? (lower as UnitLanguage)
    : FALLBACK_LANG;
}

async function resolvePreferredLanguage(): Promise<UnitLanguage> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return FALLBACK_LANG;
    const { data } = await supabase
      .from("users")
      .select("preferred_language")
      .eq("id", user.id)
      .single();
    return normalizeLanguage(data?.preferred_language);
  } catch {
    return FALLBACK_LANG;
  }
}

/**
 * user_progress 에서 해당 유저 × 해당 주제의 섹션별 완료 상태를 조회한다.
 * 비로그인이거나 오류 시 빈 객체를 반환 (클라이언트는 전부 미완료로 시작).
 */
async function loadUnitProgress(
  unitTableId: string,
): Promise<Record<string, boolean>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return {};
    const { data } = await supabase
      .from("user_progress")
      .select("section, completed")
      .eq("user_id", user.id)
      .eq("unit_id", unitTableId);
    const result: Record<string, boolean> = {};
    for (const row of (data ?? []) as { section: string; completed: boolean }[]) {
      if (row.completed) result[row.section] = true;
    }
    return result;
  } catch {
    return {};
  }
}

async function loadUnitJson(
  baseFile: string,
  lang: UnitLanguage,
): Promise<{ data: unknown; loadedLang: UnitLanguage } | null> {
  // JSON 런타임 import — 지원 언어 파일이 없으면 VI 로 fallback
  try {
    const mod = await import(`@/data/topik1/${baseFile}_${lang}.json`);
    return { data: mod.default, loadedLang: lang };
  } catch {
    if (lang === FALLBACK_LANG) return null;
    try {
      const mod = await import(
        `@/data/topik1/${baseFile}_${FALLBACK_LANG}.json`
      );
      return { data: mod.default, loadedLang: FALLBACK_LANG };
    } catch {
      return null;
    }
  }
}

/**
 * u02 신규 포맷(`session.step1/step2/step3` nested) 을 공통 포맷으로 정규화한다.
 * - `session.step1.quiz` → `session.step1_quiz`
 * - `session.step2.blanks` → `session.step2_blanks`
 * - `session.step3.sentences` → `session.step3_sentences`
 * - 최상위 `bunny_video_ids.stepN` → `session.step_videos[{"1","2","3"}]` 로도 복사 (SessionPlayer 양쪽 체인 모두 대응)
 * - 최상위 `bunny_video_id` 미정의 시 `bunny_video_ids.step1` 을 기본값으로 채운다
 *
 * u01 처럼 이미 공통 포맷인 경우 변환하지 않는다.
 */
function normalizeUnitShape(raw: unknown): UnitData {
  const src = raw as Record<string, unknown>;
  const session = (src.session ?? {}) as Record<string, unknown>;

  const hasNestedSteps =
    session.step1 !== undefined &&
    session.step2 !== undefined &&
    session.step3 !== undefined &&
    (session.step1_quiz === undefined ||
      session.step2_blanks === undefined ||
      session.step3_sentences === undefined);

  if (!hasNestedSteps) {
    return src as unknown as UnitData;
  }

  const step1 = (session.step1 ?? {}) as Record<string, unknown>;
  const step2 = (session.step2 ?? {}) as Record<string, unknown>;
  const step3 = (session.step3 ?? {}) as Record<string, unknown>;

  const topLevelVideos = (src.bunny_video_ids ?? {}) as Record<string, unknown>;
  const stepVideos: Record<string, string> = {};
  const v1 = (topLevelVideos.step1 ?? step1.bunny_video_id) as
    | string
    | undefined;
  const v2 = (topLevelVideos.step2 ?? step2.bunny_video_id) as
    | string
    | undefined;
  const v3 = (topLevelVideos.step3 ?? step3.bunny_video_id) as
    | string
    | undefined;
  if (v1) stepVideos["1"] = v1;
  if (v2) stepVideos["2"] = v2;
  if (v3) stepVideos["3"] = v3;

  const normalizedSession = {
    ...session,
    step_videos:
      (session.step_videos as Record<string, string> | undefined) ??
      stepVideos,
    step1_quiz: step1.quiz,
    step2_blanks: step2.blanks,
    step3_sentences: step3.sentences,
  };
  // nested 버전 키는 제거 — 공통 포맷으로만 노출
  delete (normalizedSession as Record<string, unknown>).step1;
  delete (normalizedSession as Record<string, unknown>).step2;
  delete (normalizedSession as Record<string, unknown>).step3;

  const fallbackTopVideoId =
    (src.bunny_video_id as string | undefined) ?? v1 ?? "";

  return {
    ...(src as unknown as UnitData),
    bunny_video_id: fallbackTopVideoId,
    session: normalizedSession as unknown as UnitData["session"],
  };
}

async function loadUnit(unitId: string): Promise<UnitData | null> {
  const entry = unitFileMap[unitId];
  if (!entry) return null;
  const lang = await resolvePreferredLanguage();
  const loaded = await loadUnitJson(entry.file, lang);
  if (!loaded) return null;
  const unit = normalizeUnitShape(loaded.data);

  // PLACEHOLDER 로 표시된 주제는 실제 Bunny 라이브러리 환경변수 주입을 건너뛴다
  const isPlaceholder = unit.bunny_video_id?.startsWith("PLACEHOLDER");
  const bunnyLibraryId = isPlaceholder
    ? unit.bunny_library_id
    : (process.env.BUNNY_LIBRARY_ID ?? "");

  return {
    ...unit,
    unit_number: entry.unitNumber,
    bunny_library_id: bunnyLibraryId,
  };
}

/**
 * 접근 제어: 로그인 / 구독 상태 / 플랜 타입 / 이전 주제 완료 여부를 검증.
 * 부적합 시 적절한 경로로 redirect 하며, 통과 시 planTier 를 UnitClient 에 전달한다.
 */
async function enforceUnitAccess(unitId: string): Promise<{
  planTier: "basic" | "premium" | null;
  accountKind: "b2b" | "b2c_active" | "trialing" | "expired" | "none";
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const ctx = await getAccountContext(user.id);

  if (ctx.kind === "none") redirect("/pricing");
  if (ctx.kind === "expired") redirect("/my");

  const unitNum = Number.parseInt(unitId, 10);
  const isValidUnitNum = Number.isFinite(unitNum) && unitNum >= 1;

  // 이전 주제(N-1) 5섹션 완료 여부 헬퍼
  async function isPrevUnitDone(num: number): Promise<boolean> {
    if (num <= 1) return true;
    const prevUnitTableId = `topik1_u${String(num - 1).padStart(2, "0")}`;
    const { data: prevRows } = await supabase
      .from("user_progress")
      .select("section")
      .eq("user_id", user!.id)
      .eq("unit_id", prevUnitTableId)
      .eq("completed", true);
    const doneSections = new Set((prevRows ?? []).map((r) => r.section));
    return doneSections.size >= 5;
  }

  if (ctx.kind === "trialing") {
    // Trial 정책: 주제 1, 2 만 진입 가능. 주제 3 이상 → trial-limit-reached
    if (!isValidUnitNum) {
      redirect("/my?reason=trial-locked");
    }
    if (unitNum >= 3) {
      redirect("/my?reason=trial-limit-reached");
    }
    // 주제 2 진입 시 주제 1 5섹션 완료 검증
    if (unitNum === 2 && !(await isPrevUnitDone(2))) {
      redirect("/my?reason=previous-unit-required");
    }
  } else if (ctx.kind === "b2c_active" || ctx.kind === "b2b") {
    // 이 라우트(/unit/[unitId]) 는 TOPIK 1 전용 — 플랜이 다르면 차단
    if (ctx.planType !== THIS_ROUTE_COURSE) {
      redirect("/my?reason=plan-mismatch");
    }
    // 이전 주제(N-1) 5섹션 완료 여부 확인
    if (isValidUnitNum && unitNum > 1 && !(await isPrevUnitDone(unitNum))) {
      redirect("/my?reason=previous-unit-required");
    }
  }

  return { planTier: ctx.planTier, accountKind: ctx.kind };
}

export default async function UnitPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;

  // 1) 접근 제어 (비로그인/구독/플랜/이전 주제 검증)
  const { planTier, accountKind } = await enforceUnitAccess(unitId);

  // 2) 주제 콘텐츠 로드
  const unit = await loadUnit(unitId);
  if (!unit) notFound();

  // 3) 사용자 진도 복원
  const initialCompleted = await loadUnitProgress(unit.unit_id);

  return (
    <UnitClient
      unit={unit}
      initialCompleted={initialCompleted}
      planTier={planTier}
      accountKind={accountKind}
    />
  );
}
