import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAccountContext } from "@/lib/account-kind";
import type { UnitData, UnitLanguage } from "../../[unitId]/types";
import UnitClient from "../../[unitId]/UnitClient";

const unitFileMap: Record<string, { file: string; unitNumber: number }> = {
  "1": { file: "u01_work_instruction", unitNumber: 1 },
};

const SUPPORTED_LANGS: UnitLanguage[] = ["vi", "th", "id"];
const FALLBACK_LANG: UnitLanguage = "vi";

// 이 라우트는 EPS-TOPIK 전용. TOPIK 1 은 /unit/[unitId], TOPIK 2 는 /unit/topik2/[unitId].
// account-kind.ts 의 planType 은 "eps" (NOT "eps-topik") 이므로 그 값과 비교한다.
const THIS_ROUTE_COURSE = "eps" as const;

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
  try {
    const mod = await import(`@/data/eps_topik/${baseFile}_${lang}.json`);
    return { data: mod.default, loadedLang: lang };
  } catch {
    if (lang === FALLBACK_LANG) return null;
    try {
      const mod = await import(
        `@/data/eps_topik/${baseFile}_${FALLBACK_LANG}.json`
      );
      return { data: mod.default, loadedLang: FALLBACK_LANG };
    } catch {
      return null;
    }
  }
}

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

  // 이전 주제(N-1) 5섹션 완료 여부 헬퍼 — EPS prefix 사용
  async function isPrevUnitDone(num: number): Promise<boolean> {
    if (num <= 1) return true;
    const prevUnitTableId = `eps_u${String(num - 1).padStart(2, "0")}`;
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
    if (!isValidUnitNum) {
      redirect("/my?reason=trial-locked");
    }
    if (unitNum >= 3) {
      redirect("/my?reason=trial-limit-reached");
    }
    if (unitNum === 2 && !(await isPrevUnitDone(2))) {
      redirect("/my?reason=previous-unit-required");
    }
  } else if (ctx.kind === "b2c_active" || ctx.kind === "b2b") {
    if (ctx.planType !== THIS_ROUTE_COURSE) {
      redirect("/my?reason=plan-mismatch");
    }
    if (isValidUnitNum && unitNum > 1 && !(await isPrevUnitDone(unitNum))) {
      redirect("/my?reason=previous-unit-required");
    }
  }

  return { planTier: ctx.planTier, accountKind: ctx.kind };
}

export default async function EpsUnitPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;

  const { planTier, accountKind } = await enforceUnitAccess(unitId);

  const unit = await loadUnit(unitId);
  if (!unit) notFound();

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
