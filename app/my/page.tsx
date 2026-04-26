import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// 작업 8: 학습 완료 직후 진도 데이터 즉시 반영 — 페이지 캐시 비활성
export const dynamic = "force-dynamic";
export const revalidate = 0;
import {
  getAccountContext,
  type AccountContext,
} from "@/lib/account-kind";
import SignOutButton from "./components/signout-button";
import PortalButton from "./components/portal-button";
import TodaySection, { type UnitProgress } from "./components/TodaySection";
import AccountMenu from "./_account-menu";
import { ProgressTabs } from "./_progress-tabs";

/* ------------------------------------------------------------------ */
/* TOPIK 1 주제 카탈로그                                                */
/* user_progress.unit_id (예: "topik1_u01") 와 URL slug (/unit/1) 매핑. */
/* 베타에선 1주제만 implemented, 나머지는 잠금 placeholder.              */
/* ------------------------------------------------------------------ */

const TOTAL_UNITS_TOPIK1 = 15;
const SECTIONS_PER_UNIT = 5;

type UnitCatalogEntry = {
  unitId: string;
  slug: string;
  number: number;
  title: string;
  implemented: boolean;
  /** true 면 "준비 중" 회색 잠금. 기획상 13~15 가 해당 (CurriculumSection 의 locked 와 1:1 일관) */
  locked?: boolean;
  theme?: string;
};

const UNIT_CATALOG: UnitCatalogEntry[] = [
  { unitId: "topik1_u01", slug: "1", number: 1, title: "편의점에서 물건 사기", implemented: true, theme: "구매와 결제" },
  { unitId: "topik1_u02", slug: "2", number: 2, title: "지하철 타기", implemented: true, theme: "이동과 교통" },
  { unitId: "topik1_u03", slug: "3", number: 3, title: "카페에서 주문하기", implemented: false, theme: "음식과 주문" },
  { unitId: "topik1_u04", slug: "4", number: 4, title: "식당에서 음식 주문하기", implemented: false, theme: "음식과 주문" },
  { unitId: "topik1_u05", slug: "5", number: 5, title: "길 묻기", implemented: false, theme: "장소와 위치" },
  { unitId: "topik1_u06", slug: "6", number: 6, title: "병원에서 진료받기", implemented: false, theme: "서비스 이용" },
  { unitId: "topik1_u07", slug: "7", number: 7, title: "약국에서 약 사기", implemented: false, theme: "서비스 이용" },
  { unitId: "topik1_u08", slug: "8", number: 8, title: "은행/ATM 이용하기", implemented: false, theme: "서비스 이용" },
  { unitId: "topik1_u09", slug: "9", number: 9, title: "쇼핑몰에서 옷 사기", implemented: false, theme: "구매와 결제" },
  { unitId: "topik1_u10", slug: "10", number: 10, title: "학원에서 질문하기", implemented: false, theme: "관계 형성" },
  { unitId: "topik1_u11", slug: "11", number: 11, title: "집/숙소 관련 표현", implemented: false, theme: "일상 생활" },
  { unitId: "topik1_u12", slug: "12", number: 12, title: "일상 일정 말하기", implemented: false, theme: "시간과 약속" },
  { unitId: "topik1_u13", slug: "13", number: 13, title: "가족/지인 소개", implemented: false, locked: true, theme: "관계 형성" },
  { unitId: "topik1_u14", slug: "14", number: 14, title: "취미/여가 말하기", implemented: false, locked: true, theme: "일상 생활" },
  { unitId: "topik1_u15", slug: "15", number: 15, title: "날씨/계절 표현", implemented: false, locked: true, theme: "일상 생활" },
];

/* ------------------------------------------------------------------ */
/* 타입                                                                 */
/* ------------------------------------------------------------------ */

type ProfileRow = {
  name: string | null;
  email: string | null;
  preferred_language: string | null;
  learning_start_date: string | null;
  streak: number | null;
};

type ProgressRow = {
  unit_id: string;
  section: string;
  completed: boolean;
};

/* ------------------------------------------------------------------ */
/* 헬퍼                                                                 */
/* ------------------------------------------------------------------ */

const LANGUAGE_LABEL: Record<string, string> = {
  vi: "베트남어",
  en: "영어",
  zh: "중국어",
  id: "인도네시아어",
  th: "태국어",
  ko: "한국어",
};

const COURSE_NAME: Record<NonNullable<AccountContext["planType"]>, string> = {
  topik1: "TOPIK 1 한국어 기초 과정",
  topik2: "TOPIK 2 한국어 기초 과정",
  eps: "EPS-TOPIK 한국어 과정",
};

const COURSE_UNIT_COUNT: Record<NonNullable<AccountContext["planType"]>, number> = {
  topik1: 15,
  topik2: 20,
  eps: 15,
};

function formatDate(value: Date | string | null, fallback = "—"): string {
  if (!value) return fallback;
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// 작업 5: 결제 내역 카드 가격 매핑 — basic ₩7,700, premium ₩11,900 (월 단위, 모든 코스 동일)
function priceLabel(
  planType: AccountContext["planType"],
  planTier: AccountContext["planTier"],
): string {
  if (!planType || !planTier) return "—";
  const won = planTier === "premium" ? "11,900" : "7,700";
  const tier = planTier === "premium" ? "Premium" : "Basic";
  const course =
    planType === "topik1" ? "TOPIK 1" : planType === "topik2" ? "TOPIK 2" : "EPS-TOPIK";
  return `${course} ${tier} · ₩${won}/월`;
}

/* 상태 배지 — Trial 은 orange, b2c_active 는 mint, expired 는 회색, b2b 는 navy+mint border */
function StatusBadge({ ctx }: { ctx: AccountContext }) {
  if (ctx.kind === "trialing") {
    return (
      <span className="inline-flex items-center rounded-full bg-[#ff7d5a] px-3 py-1 text-sm font-bold text-white">
        7일 무료체험 중 D-{ctx.daysRemaining ?? 0}
      </span>
    );
  }
  if (ctx.kind === "expired") {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-200 px-3 py-1 text-sm font-semibold text-gray-700">
        구독 만료
      </span>
    );
  }
  if (ctx.kind === "b2c_active") {
    const tierLabel = ctx.planTier === "premium" ? "Premium" : "Basic";
    return (
      <span className="inline-flex items-center rounded-full bg-[#27d3c3] px-3 py-1 text-sm font-bold text-[#122c4f]">
        {tierLabel} 구독 중
      </span>
    );
  }
  if (ctx.kind === "b2b") {
    return (
      <span className="inline-flex items-center rounded-full border border-[#27d3c3] bg-[#122c4f] px-3 py-1 text-sm font-semibold text-white">
        학원 소속
      </span>
    );
  }
  return null;
}

/* 작업 16: ?reason= 쿼리 안내 (페이지 상단 인라인 알림) */
const REASON_MESSAGES: Record<string, { text: string; cta?: { label: string; href: string } }> = {
  "trial-locked": { text: "체험은 일부 주제만 이용 가능해요" },
  "trial-limit-reached": {
    text: "체험 가능한 주제를 모두 학습했어요.",
    cta: { label: "구독하고 계속하기 →", href: "/pricing" },
  },
  "plan-mismatch": { text: "이 주제는 다른 구독이 필요해요" },
  "previous-unit-required": { text: "이전 주제를 완료해야 다음 주제로 넘어갈 수 있어요" },
};

function ReasonBanner({ reason }: { reason: string | null }) {
  if (!reason) return null;
  const msg = REASON_MESSAGES[reason];
  if (!msg) return null;
  return (
    <div className="px-4 pt-4 md:px-10 md:pt-6">
      <div
        role="status"
        className="mx-auto max-w-[1200px] rounded-2xl border border-[#fcd6c7] bg-[#fff8f5] p-4"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[#0f172a]">{msg.text}</p>
          {msg.cta && (
            <Link
              href={msg.cta.href}
              className="rounded-lg bg-[#122c4f] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#1a3d6e]"
            >
              {msg.cta.label}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 페이지 (서버 컴포넌트)                                                */
/* ------------------------------------------------------------------ */

export default async function MyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // 1. 계정 상태 (academy/subscription 분기 일괄 처리)
  const ctx = await getAccountContext(user.id);
  if (ctx.kind === "none") redirect("/pricing");

  // ?reason= 쿼리 (Task 16)
  const sp = await searchParams;
  const rawReason = sp.reason;
  const reason = typeof rawReason === "string" ? rawReason : null;

  // 2. 프로필 (표시용)
  const { data: profileData } = await supabase
    .from("users")
    .select("name, email, preferred_language, learning_start_date, streak")
    .eq("id", user.id)
    .maybeSingle();
  const profile = (profileData ?? {}) as ProfileRow;

  // 3. user_progress 전체 (주제별 완료 섹션 수 집계)
  const { data: progressData } = await supabase
    .from("user_progress")
    .select("unit_id, section, completed")
    .eq("user_id", user.id);
  const progressList = (progressData ?? []) as ProgressRow[];

  const progressMap: Record<string, number> = {};
  for (const row of progressList) {
    if (row.completed) {
      progressMap[row.unit_id] = (progressMap[row.unit_id] ?? 0) + 1;
    }
  }

  // TodaySection 용 — 배열 변환
  const todayUnitProgress: UnitProgress[] = Object.entries(progressMap).map(
    ([unitId, completedSections]) => ({ unitId, completedSections }),
  );

  // 3-1. 오답 복습 카드용 최근 test 섹션
  const { data: lastTestData } = await supabase
    .from("user_progress")
    .select("unit_id, score, total, completed_at")
    .eq("user_id", user.id)
    .eq("section", "test")
    .eq("completed", true)
    .order("completed_at", { ascending: false })
    .limit(1);
  const lastTest = (lastTestData?.[0] ?? null) as {
    unit_id: string;
    score: number | null;
    total: number | null;
  } | null;

  // 3-2. 모의시험 응시 집계
  const { data: examResultsData } = await supabase
    .from("exam_results")
    .select("score, total_questions, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const examResults = (examResultsData ?? []) as {
    score: number;
    total_questions: number;
  }[];
  const examCount = examResults.length;
  const latestExamScore = examResults[0]?.score ?? null;

  /* ---------------- 진도 집계 ---------------- */

  const sectionsByUnit = new Map<string, Set<string>>();
  for (const row of progressList) {
    if (!row.completed) continue;
    const set = sectionsByUnit.get(row.unit_id) ?? new Set<string>();
    set.add(row.section);
    sectionsByUnit.set(row.unit_id, set);
  }

  const completedUnits = UNIT_CATALOG.filter((u) => {
    if (!u.implemented) return false;
    return (sectionsByUnit.get(u.unitId)?.size ?? 0) >= SECTIONS_PER_UNIT;
  }).length;
  const totalUnits = TOTAL_UNITS_TOPIK1;
  const completedSections = progressList.filter((r) => r.completed).length;

  const emailLocalPart = (profile.email ?? user.email ?? "").split("@")[0] ?? "";
  const baseName = profile.name?.trim() || emailLocalPart;
  const displayName =
    baseName.length > 15 ? `${baseName.slice(0, 15)}…` : baseName;
  // 작업 10: 헤더 mint 원에 사용자 이름 첫 글자 표시
  const initial = (baseName[0] ?? "P").toUpperCase();

  /* ---------------- 코스명 · 탭 접근권 ---------------- */

  const courseName = ctx.planType ? COURSE_NAME[ctx.planType] : "한국어 학습";
  const courseUnitCount = ctx.planType ? COURSE_UNIT_COUNT[ctx.planType] : 15;
  const langLabel =
    LANGUAGE_LABEL[profile.preferred_language ?? "vi"] ?? "베트남어";
  const streak = profile.streak ?? 0;

  // 작업 5: Trial 은 b2c_active 와 동일 처리
  const isPremium = ctx.planTier === "premium";
  const planType = ctx.planType;
  const tabAccess =
    ctx.kind === "expired"
      ? { topik1: false, topik2: false, eps: false }
      : ctx.kind === "trialing" ||
          ctx.kind === "b2c_active" ||
          ctx.kind === "b2b"
        ? {
            topik1: isPremium || planType === "topik1",
            topik2: isPremium || planType === "topik2",
            eps: isPremium || planType === "eps",
          }
        : { topik1: false, topik2: false, eps: false };

  const unitsForTabs = UNIT_CATALOG.map((u) => ({
    id: u.unitId,
    unitNum: u.number,
    title: u.title,
    path: `/unit/${u.slug}`,
    implemented: u.implemented,
    // 작업 1·7: locked=true(13~15) 는 "준비 중", implemented=false 이면서 locked=undefined 는 "콘텐츠 준비 중"
    locked: u.locked === true,
  }));

  /* ---------------- 체험/결제 지표 ---------------- */

  const trialDaysLeft =
    ctx.kind === "trialing" ? (ctx.daysRemaining ?? 0) : 0;
  const trialProgress =
    ctx.kind === "trialing"
      ? Math.min(100, Math.max(0, Math.round(((7 - trialDaysLeft) / 7) * 100)))
      : 0;

  const tierLabel = isPremium ? "Premium" : "Basic";

  const reviewUnit = lastTest
    ? UNIT_CATALOG.find((u) => u.unitId === lastTest.unit_id)
    : undefined;
  const reviewSlug = reviewUnit?.slug ?? null;

  const isExpired = ctx.kind === "expired";

  /* ------------------------- 렌더 ------------------------- */

  return (
    <div className="min-h-screen bg-[#f5f6f8] font-sans">
      {/* ?reason= 쿼리 안내 (Task 16) */}
      <ReasonBanner reason={reason} />

      {/* ① 헤더 navy hero — Today 카드 + 통계 3종 4컬럼 그리드 (원본 디자인 복원) */}
      <section className="bg-[#122c4f] px-4 py-8 md:px-10">
        <div className="mx-auto max-w-[1200px]">
          {/* 상단: 인사말 좌측 / 배지 우측 */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4 text-left">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#27d3c3] text-base font-semibold text-white">
                {initial}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#27d3c3]">반갑습니다</p>
                <h1 className="text-3xl font-bold text-white md:text-4xl">
                  {displayName} 님, 안녕하세요
                </h1>
                <p className="mt-1 text-sm text-white/60">
                  {courseName} · {courseUnitCount} 주제 · {langLabel} 지원
                </p>
                {ctx.kind === "b2b" && ctx.academyName && (
                  <p className="mt-1 text-sm text-white/50">
                    {ctx.academyName} 소속
                  </p>
                )}
              </div>
            </div>
            <div className="md:text-right">
              <p className="mb-2 text-xs text-white/40">이용 중</p>
              <StatusBadge ctx={ctx} />
            </div>
          </div>

          {/* 하단 그리드: Today (2fr) + 학습 진도 / 연속학습 / 연습 횟수 (각 1fr) */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr]">
            <div className="sm:col-span-2 md:col-span-1">
              <TodaySection
                accountKind={ctx.kind}
                planType={ctx.planType}
                planTier={ctx.planTier}
                userProgress={todayUnitProgress}
              />
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="mb-1 text-sm text-white/50">학습 진도</p>
              <p className="whitespace-nowrap text-2xl font-bold text-white md:text-3xl">
                {completedUnits}
                <span className="ml-1 text-base md:text-xl">완료</span>
              </p>
              <p className="mt-1 text-xs text-white/40">개 주제</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="mb-1 text-sm text-white/50">연속학습</p>
              <p className="whitespace-nowrap text-2xl font-bold text-white md:text-3xl">
                {streak}
                <span className="ml-1 text-base md:text-xl">일</span>
              </p>
              <p className="mt-1 text-xs text-white/40">연속</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="mb-1 text-sm text-white/50">연습 횟수</p>
              <p className="whitespace-nowrap text-2xl font-bold text-white md:text-3xl">
                {completedSections}
                <span className="ml-1 text-base md:text-xl">회</span>
              </p>
              <p className="mt-1 text-xs text-white/40">완료한 단계</p>
            </div>
          </div>
        </div>
      </section>

      {/* ③ 학습 목록 */}
      <section className="px-4 py-6 md:px-10 md:py-8">
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>
          학습 목록
        </h2>
        <ProgressTabs
          units={unitsForTabs}
          progressMap={progressMap}
          tabAccess={tabAccess}
          isTrial={ctx.kind === "trialing"}
          isExpired={isExpired}
        />
      </section>

      {/* ④ 03 복습과 시험 — Task 6: trial=b2c_active 동일 활성, expired blur */}
      <section className="px-4 pb-6 md:px-10 md:pb-8" data-section="review">
        <div className="mb-6 flex items-center gap-3">
          <span className="text-2xl font-bold text-[#27d3c3]">03</span>
          <h2 className="text-2xl font-bold text-[#122c4f]">복습과 시험</h2>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* 좌: 오답 복습 */}
          <div
            className={`relative overflow-hidden rounded-2xl border border-[#d1f5f0] bg-[#e6fbf8] p-6 ${
              isExpired ? "" : ""
            }`}
          >
            <div className={isExpired ? "pointer-events-none blur-[2px]" : ""}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#122c4f]">
                    다시 복습해 보세요
                  </h3>
                  {completedUnits > 0 && (
                    <p className="text-sm text-[#64748b]">
                      학습한 {completedUnits}개 주제 복습 가능
                    </p>
                  )}
                </div>
                <Link
                  href={`/unit/${reviewSlug ?? "1"}?section=test`}
                  className="rounded-xl bg-[#122c4f] px-4 py-2 text-base font-semibold text-white"
                >
                  전체 복습
                </Link>
              </div>
              <div className="flex items-center justify-center py-6">
                <svg
                  width="280"
                  height="170"
                  viewBox="0 0 280 170"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  role="img"
                  aria-label="가나다 카드 일러스트"
                >
                  <g transform="translate(16, 58) rotate(-7)">
                    <rect x="0" y="0" width="76" height="76" rx="12" fill="#27d3c3" />
                    <text x="38" y="56" fill="#ffffff" fontSize="46" fontWeight="800" fontFamily="Pretendard" textAnchor="middle">가</text>
                    <circle cx="66" cy="12" r="10" fill="#ffffff" />
                    <path d="M61 12.5 L65 16.5 L71 9" stroke="#27d3c3" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                  <g transform="translate(96, 26) rotate(3)">
                    <rect x="0" y="0" width="92" height="92" rx="14" fill="#122c4f" />
                    <text x="46" y="68" fill="#27d3c3" fontSize="58" fontWeight="800" fontFamily="Pretendard" textAnchor="middle">나</text>
                  </g>
                  <g transform="translate(198, 56) rotate(-4)">
                    <rect x="0" y="0" width="78" height="78" rx="12" fill="#ff7d5a" />
                    <text x="39" y="57" fill="#ffffff" fontSize="46" fontWeight="800" fontFamily="Pretendard" textAnchor="middle">다</text>
                    <circle cx="68" cy="12" r="10" fill="#ffffff" />
                    <line x1="63" y1="7" x2="73" y2="17" stroke="#ff7d5a" strokeWidth="2.8" strokeLinecap="round" />
                    <line x1="73" y1="7" x2="63" y2="17" stroke="#ff7d5a" strokeWidth="2.8" strokeLinecap="round" />
                  </g>
                </svg>
              </div>
            </div>
            {isExpired && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 p-6 text-center">
                <span className="mb-2 text-2xl" aria-hidden>🔒</span>
                <p className="mb-3 text-sm font-semibold text-[#122c4f]">
                  구독하시면 복습 기능을 이용할 수 있어요
                </p>
                <Link
                  href="/pricing"
                  className="rounded-lg bg-[#122c4f] px-4 py-2 text-sm font-bold text-white"
                >
                  구독 연장하기
                </Link>
              </div>
            )}
          </div>

          {/* 우: 모의시험 */}
          <div className="relative overflow-hidden rounded-2xl border border-orange-100 bg-[#fff8f5] p-6">
            <div className={isExpired ? "pointer-events-none blur-[2px]" : ""}>
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="mb-1 text-xs font-bold text-[#ff7d5a]">모의시험</p>
                  <h3 className="text-xl font-bold text-[#122c4f]">
                    TOPIK 1 모의시험
                  </h3>
                  <p className="mt-1 text-sm text-[#64748b]">
                    도전하여 응시할 때마다 횟수가 올라가요.
                  </p>
                </div>
                <span className="rounded-lg bg-[#27d3c3] px-2 py-1 text-xs font-bold text-[#122c4f]">
                  40문
                </span>
              </div>
              <div className="mb-6 flex gap-8">
                <div>
                  <p className="text-xs text-[#64748b]">도전 응시 횟수</p>
                  <p className="text-2xl font-bold text-[#122c4f]">
                    {examCount} <span className="text-sm">회</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#64748b]">최근 점수</p>
                  <p className="text-2xl font-bold text-[#122c4f]">
                    {latestExamScore ?? "—"}{" "}
                    <span className="text-sm text-[#64748b]"> / 200</span>
                  </p>
                </div>
              </div>
              {/* 모의시험은 모든 주제 완료 시만 활성. 외부 페이지(/learn/exam)는 삭제됐으므로 임시 /my 링크 */}
              {completedUnits >= totalUnits ? (
                <Link
                  href="/my"
                  className="block w-full rounded-xl bg-[#122c4f] py-3 text-center font-bold text-white transition hover:bg-[#1a3d6e]"
                >
                  시험 시작하기 →
                </Link>
              ) : (
                <>
                  <span
                    className="block w-full cursor-not-allowed rounded-xl bg-gray-200 py-3 text-center font-bold text-gray-400"
                    aria-disabled="true"
                  >
                    시험 시작하기
                  </span>
                  <p className="mt-2 text-center text-sm text-[#64748b]">
                    모든 주제를 완료하면 시험을 볼 수 있어요
                  </p>
                </>
              )}
            </div>
            {isExpired && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 p-6 text-center">
                <span className="mb-2 text-2xl" aria-hidden>🔒</span>
                <p className="mb-3 text-sm font-semibold text-[#122c4f]">
                  구독하시면 모의시험을 응시할 수 있어요
                </p>
                <Link
                  href="/pricing"
                  className="rounded-lg bg-[#122c4f] px-4 py-2 text-sm font-bold text-white"
                >
                  구독 연장하기
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ⑤ 04 이용 정보 — Task 7/8: 사용자 유형별 표시 + 결제 내역 카드 정리 */}
      <section className="px-4 pb-16 md:px-10 md:pb-16">
        <div className="mb-6 flex items-center gap-3">
          <span className="text-2xl font-bold text-[#27d3c3]">04</span>
          <h2 className="text-2xl font-bold text-[#122c4f]">이용 정보</h2>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* 현재 이용 카드 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <p className="mb-1 text-xs text-[#64748b]">현재 이용</p>

            {/* trialing — Task 7 trial: "무료 체험 중 D-N + 자동 결제 안내" */}
            {ctx.kind === "trialing" && (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[#122c4f]">무료 체험 중</h3>
                  <span className="font-bold text-[#ff7d5a]">D-{trialDaysLeft}</span>
                </div>
                <div className="mb-1 text-xs text-[#64748b]">
                  체험 종료일: {formatDate(ctx.trialEnd)}
                </div>
                <div className="mb-3 h-1.5 rounded-full bg-gray-100">
                  <div
                    className="h-1.5 rounded-full bg-[#ff7d5a]"
                    style={{ width: `${trialProgress}%` }}
                  />
                </div>
                <p className="mb-1 text-sm text-[#0f172a]">
                  체험 종료 시 <strong>{tierLabel}</strong> 자동 결제됩니다.
                </p>
                <p className="mb-4 text-xs text-[#64748b]">
                  체험 중 언제든 취소 가능합니다.
                </p>
                <PortalButton />
              </>
            )}

            {/* b2c_active — 기존 동작 유지 */}
            {ctx.kind === "b2c_active" && (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[#122c4f]">개인 · {tierLabel}</h3>
                  {ctx.currentPeriodEnd && (
                    <span className="rounded-md bg-[#e2e8f0] px-2 py-0.5 text-xs font-semibold text-[#475569]">
                      {ctx.planTier === "premium" ? "월간" : "월간"}
                    </span>
                  )}
                </div>
                <div className="mb-1 text-xs text-[#64748b]">
                  사용 시작일:{" "}
                  {formatDate(profile.learning_start_date, "첫 학습 시 자동 기록")}
                </div>
                {ctx.currentPeriodEnd && (
                  <p className="mb-4 text-sm text-[#0f172a]">
                    다음 결제: <strong>{formatDate(ctx.currentPeriodEnd)}</strong>
                  </p>
                )}
                <PortalButton />
              </>
            )}

            {/* b2b */}
            {ctx.kind === "b2b" && (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[#122c4f]">학원 소속</h3>
                </div>
                <div className="mb-1 text-xs text-[#64748b]">
                  사용 시작일:{" "}
                  {formatDate(profile.learning_start_date, "첫 학습 시 자동 기록")}
                </div>
                <p className="mt-3 text-sm text-[#64748b]">
                  언어 변경 · 구독 관리는 학원 원장님께 요청해주세요.
                </p>
              </>
            )}

            {/* expired — Task 7: navy 버튼 */}
            {isExpired && (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[#122c4f]">구독 만료</h3>
                </div>
                <div className="mb-1 text-xs text-[#64748b]">
                  사용 시작일:{" "}
                  {formatDate(profile.learning_start_date, "첫 학습 시 자동 기록")}
                </div>
                <p className="mb-4 mt-3 text-sm text-[#64748b]">
                  체험 기간이 종료되었어요.
                </p>
                <Link
                  href="/pricing"
                  className="block w-full rounded-xl bg-[#122c4f] py-3 text-center font-bold text-white transition hover:bg-[#1a3d6e]"
                >
                  구독 연장하기 →
                </Link>
              </>
            )}
          </div>

          {/* 결제 내역 — 작업 5: 구독 상태별 4분기 메시지 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <p className="mb-3 text-xs text-[#64748b]">결제 내역</p>
            <h3 className="mb-4 text-xl font-bold text-[#122c4f]">결제 내역</h3>

            {ctx.kind === "b2c_active" && (
              <div className="flex h-32 flex-col justify-center">
                <p className="text-base font-bold text-[#122c4f]">다음 결제 예정</p>
                <p className="mt-1 text-sm text-[#0f172a]">
                  {formatDate(ctx.currentPeriodEnd)} 일자
                </p>
                <p className="mt-1 text-xs text-[#64748b]">
                  {priceLabel(ctx.planType, ctx.planTier)}
                </p>
                <Link
                  href="/my"
                  className="mt-3 inline-flex items-center text-sm font-bold text-[#122c4f] hover:underline"
                >
                  결제 내역 보기 →
                </Link>
              </div>
            )}

            {ctx.kind === "trialing" && (
              <div className="flex h-32 flex-col justify-center">
                <p className="text-base font-bold text-[#122c4f]">첫 결제 예정</p>
                <p className="mt-1 text-sm text-[#0f172a]">
                  {formatDate(ctx.trialEnd)} 일자
                </p>
                <p className="mt-1 text-xs text-[#64748b]">
                  {priceLabel(ctx.planType, ctx.planTier)}
                </p>
                <p className="mt-2 text-xs text-[#94a3b8]">
                  체험 종료 후 자동 결제됩니다
                </p>
              </div>
            )}

            {isExpired && (
              <div className="flex h-32 flex-col justify-center">
                <p className="text-base font-semibold text-[#0f172a]">
                  구독이 만료되었습니다
                </p>
                <p className="mt-2 text-xs text-[#64748b]">
                  이전 결제 이력을 확인하려면 구독 연장 후 가능합니다
                </p>
              </div>
            )}

            {ctx.kind === "b2b" && (
              <div className="flex h-32 flex-col justify-center">
                <p className="text-base font-semibold text-[#0f172a]">학원에서 관리</p>
                <p className="mt-2 text-xs text-[#64748b]">
                  자세한 내역은 소속 학원에 문의해주세요
                </p>
              </div>
            )}
          </div>

          {/* 계정 설정 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <p className="mb-3 text-xs text-[#64748b]">계정</p>
            <h3 className="mb-4 text-xl font-bold text-[#122c4f]">계정 설정</h3>
            <AccountMenu />
            <div className="mt-4">
              <SignOutButton />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
