import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/app/learn/me/signout-button";
import PortalButton from "@/app/learn/me/portal-button";
import AccountMenu from "./_account-menu";
import { ProgressTabs } from "./_progress-tabs";

/* ------------------------------------------------------------------ */
/* TOPIK 1 유닛 카탈로그                                                */
/* user_progress.unit_id (예: "topik1_u01") 와 URL slug (/unit/1) 매핑. */
/* 베타에선 1유닛만 implemented, 나머지는 잠금 placeholder.              */
/* ------------------------------------------------------------------ */

const TOTAL_UNITS_TOPIK1 = 12;
const SECTIONS_PER_UNIT = 5;

type UnitCatalogEntry = {
  unitId: string;
  slug: string;
  number: number;
  title: string;
  implemented: boolean;
  theme?: string;
  duration?: string;
};

// TOPIK1 12개 유닛 카탈로그. 주제는 PRD v7 §10 기준.
// u01, u02만 implemented; u03~u12는 준비 중이지만 카드 표시용 title 은 채워둔다.
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
  { unitId: "topik1_u10", slug: "10", number: 10, title: "학교/학원에서 질문하기", implemented: false, theme: "관계 형성" },
  { unitId: "topik1_u11", slug: "11", number: 11, title: "집/숙소 관련 표현", implemented: false, theme: "일상 생활" },
  { unitId: "topik1_u12", slug: "12", number: 12, title: "일상 일정 말하기", implemented: false, theme: "시간과 약속" },
];

/* ------------------------------------------------------------------ */
/* 타입                                                                 */
/* ------------------------------------------------------------------ */

type ProfileRow = {
  name: string | null;
  email: string | null;
  preferred_language: string | null;
  academy_id: string | null;
  learning_start_date: string | null;
  streak: number | null;
};

type ProgressRow = {
  unit_id: string;
  section: string;
  completed: boolean;
};

type Subscription = {
  plan_type: "b2c_monthly" | "b2c_yearly" | "b2b_monthly";
  status: "trialing" | "active" | "past_due" | "canceled" | "incomplete";
  trial_ends_at: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
};

type UnitStatus = "done" | "in_progress" | "not_started" | "locked";
type AccountKind = "b2b" | "trialing" | "expired" | "b2c_active" | "none";

/* ------------------------------------------------------------------ */
/* 헬퍼                                                                 */
/* ------------------------------------------------------------------ */

const LANGUAGE_LABEL: Record<string, string> = {
  vi: "베트남어",
  en: "영어",
  zh: "중국어",
  id: "인도네시아어",
  ko: "한국어",
};

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / 86_400_000);
}

function formatDate(iso: string | null, fallback = "—"): string {
  if (!iso) return fallback;
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/* 페이지 (서버 컴포넌트)                                                */
/* ------------------------------------------------------------------ */

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // 1. users 프로필
  const { data: profileData } = await supabase
    .from("users")
    .select(
      "name, email, preferred_language, academy_id, learning_start_date, streak",
    )
    .eq("id", user.id)
    .maybeSingle();
  const profile = (profileData ?? {}) as ProfileRow;

  // 2. user_progress 전체
  const { data: progressData } = await supabase
    .from("user_progress")
    .select("unit_id, section, completed")
    .eq("user_id", user.id);
  const progressList = (progressData ?? []) as ProgressRow[];

  // unit_id별 완료 섹션 수 집계
  const progressMap: Record<string, number> = {};
  for (const row of progressList) {
    if (row.completed) {
      progressMap[row.unit_id] = (progressMap[row.unit_id] ?? 0) + 1;
    }
  }

  // 2-1. 가장 최근 완료된 test 섹션 (오답 복습 카드용)
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

  // 2-2. 모의시험 응시 집계 (exam_results)
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

  // 3. subscriptions (self + academy)
  let subQuery = supabase
    .from("subscriptions")
    .select(
      "plan_type, status, trial_ends_at, current_period_end, stripe_customer_id",
    )
    .in("status", ["trialing", "active", "past_due", "canceled"])
    .order("created_at", { ascending: false })
    .limit(1);
  subQuery = profile.academy_id
    ? subQuery.or(
        `user_id.eq.${user.id},academy_id.eq.${profile.academy_id}`,
      )
    : subQuery.eq("user_id", user.id);
  const { data: subs } = await subQuery;
  const sub = (subs?.[0] ?? null) as Subscription | null;

  /* ---------------- 진도 집계 ---------------- */

  const sectionsByUnit = new Map<string, Set<string>>();
  for (const row of progressList) {
    if (!row.completed) continue;
    const set = sectionsByUnit.get(row.unit_id) ?? new Set<string>();
    set.add(row.section);
    sectionsByUnit.set(row.unit_id, set);
  }

  const unitStats = UNIT_CATALOG.map((entry) => {
    const done = sectionsByUnit.get(entry.unitId)?.size ?? 0;
    const percent = Math.min(100, Math.round((done / SECTIONS_PER_UNIT) * 100));
    let status: UnitStatus;
    if (!entry.implemented) status = "locked";
    else if (done >= SECTIONS_PER_UNIT) status = "done";
    else if (done > 0) status = "in_progress";
    else status = "not_started";
    return { ...entry, done, percent, status };
  });

  const totalUnits = TOTAL_UNITS_TOPIK1;
  const completedUnits = unitStats.filter((u) => u.status === "done").length;
  // 연습(=섹션) 완료 총 건수 — 히어로 통계 "연습 횟수" 카드에 사용.
  const completedSections = progressList.filter((r) => r.completed).length;

  // 표시용 이름: profile.name 우선. 없으면 이메일의 @ 앞부분만 사용.
  // 15자 초과 시 말줄임.
  const emailLocalPart = (profile.email ?? user.email ?? "").split("@")[0] ?? "";
  const baseName = profile.name?.trim() || emailLocalPart;
  const displayName =
    baseName.length > 15 ? `${baseName.slice(0, 15)}…` : baseName;
  // 이어하기 우선순위: 진행 중 → 미시작
  const currentUnit =
    unitStats.find((u) => u.status === "in_progress") ??
    unitStats.find((u) => u.status === "not_started");

  /* ---------------- 계정 분기 ---------------- */

  // 만료 판단: status가 'canceled' 이거나
  // trialing 인데 trial_ends_at 이 현재 시각보다 과거인 경우
  const now = new Date();
  const trialEnd = sub?.trial_ends_at ? new Date(sub.trial_ends_at) : null;
  const isExpired =
    sub?.status === "canceled" ||
    (sub?.status === "trialing" && trialEnd !== null && trialEnd < now);

  const accountKind: AccountKind = profile.academy_id
    ? "b2b"
    : isExpired
      ? "expired"
      : sub?.status === "trialing"
        ? "trialing"
        : sub?.status === "active"
          ? "b2c_active"
          : "none";

  if (accountKind === "none") redirect("/pricing");

  const planType = String(sub?.plan_type ?? "");
  const tabAccess =
    accountKind === "expired"
      ? { topik1: false, topik2: false, eps: false }
      : accountKind === "trialing"
        ? { topik1: true, topik2: true, eps: true }
        : accountKind === "b2c_active" || accountKind === "b2b"
          ? {
              topik1: true,
              topik2:
                planType.includes("topik2") || planType.includes("premium"),
              eps: planType.includes("eps") || planType.includes("premium"),
            }
          : { topik1: false, topik2: false, eps: false };

  const unitsForTabs = UNIT_CATALOG.map((u) => ({
    id: u.unitId,
    unitNum: u.number,
    title: u.title,
    path: `/unit/${u.slug}`,
    implemented: u.implemented,
  }));
  const isTrialing = accountKind === "trialing";
  const trialRemaining = isTrialing ? daysUntil(sub?.trial_ends_at ?? null) : null;
  const trialDaysLeft = trialRemaining ?? 0;
  const trialEndDate = sub?.trial_ends_at ?? null;
  // 무료 체험 진행률 (0~100). 7일 기준. trialing 아닐 땐 0.
  const trialProgress = isTrialing
    ? Math.min(100, Math.max(0, Math.round(((7 - trialDaysLeft) / 7) * 100)))
    : 0;

  const membershipHeadline =
    accountKind === "trialing"
      ? "무료 체험"
      : accountKind === "b2c_active"
        ? sub?.plan_type === "b2c_yearly"
          ? "개인 · 연간"
          : "개인 · 월간"
        : accountKind === "b2b"
          ? "학원 소속"
          : "구독 없음";
  const membershipBadge =
    accountKind === "trialing"
      ? `무료 체험 · D-${trialDaysLeft}`
      : membershipHeadline;

  const langLabel =
    LANGUAGE_LABEL[profile.preferred_language ?? "vi"] ?? "베트남어";
  const streak = profile.streak ?? 0;

  // 오답 복습 카드 데이터 — 최근 test 섹션 기준
  const reviewUnit = lastTest
    ? UNIT_CATALOG.find((u) => u.unitId === lastTest.unit_id)
    : undefined;
  const reviewWrongCount =
    lastTest && lastTest.total != null && lastTest.score != null
      ? Math.max(0, lastTest.total - lastTest.score)
      : null;
  const reviewSlug = reviewUnit?.slug ?? null;

  /* ------------------------- 렌더 ------------------------- */

  return (
    <div className="min-h-screen bg-[#f5f6f8] font-sans">
      {/* ① 히어로 — 네이비 배경 */}
      <section className="bg-[#122c4f] px-4 py-6 md:px-10 md:py-8">
        {/* 상단 바 */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-[#27d3c3]" />
            <div>
              <p className="text-sm font-semibold text-[#27d3c3]">반갑습니다</p>
              <h1 className="text-4xl font-bold text-white">
                {displayName} 님, 안녕하세요
              </h1>
              <p className="text-base text-white/60">
                TOPIK 1 한국어 기초 과정 · {langLabel} 지원
              </p>
            </div>
          </div>
          <div className="md:text-right">
            <p className="text-sm text-white/40">이용 중</p>
            <p className="text-base font-semibold text-white">{membershipBadge}</p>
          </div>
        </div>

        {/* 히어로 본문 — 좌우 분할 */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* 좌: 오늘의 학습 카드 — 3분기(진행 중 / 준비 중 / 완료) */}
          <div className="rounded-2xl bg-white/10 p-6">
            <p className="mb-2 text-sm font-semibold text-[#27d3c3]">
              오늘 학습
            </p>
            {currentUnit ? (
              <>
                <h2 className="mb-1 text-xl font-bold text-white">
                  {currentUnit.title}
                </h2>
                <p className="mb-4 text-base text-white/60">
                  {SECTIONS_PER_UNIT}단계 중 {currentUnit.done}단계 완료
                </p>
                <div className="mb-4 h-2 rounded-full bg-white/20">
                  <div
                    className="h-2 rounded-full bg-[#27d3c3]"
                    style={{ width: `${currentUnit.percent}%` }}
                  />
                </div>
                <Link
                  href={`/unit/${currentUnit.slug}`}
                  className="inline-block rounded-xl bg-[#27d3c3] px-6 py-2 text-base font-bold text-[#122c4f] transition hover:bg-[#1fb8a8]"
                >
                  이어서 학습하기 →
                </Link>
              </>
            ) : completedUnits >= totalUnits ? (
              <>
                <h2 className="mb-1 text-xl font-bold text-white">
                  모든 학습을 완료했어요
                </h2>
                <p className="mb-4 text-base text-white/60">
                  시험 연습을 시작해보세요
                </p>
                <Link
                  href="/learn/exam"
                  className="inline-block rounded-xl bg-[#27d3c3] px-6 py-2 text-base font-bold text-[#122c4f] transition hover:bg-[#1fb8a8]"
                >
                  시험 보러 가기 →
                </Link>
              </>
            ) : (
              <>
                <h2 className="mb-1 text-xl font-bold text-white">
                  다음 학습을 준비 중이에요
                </h2>
                <p className="text-base text-white/60">
                  {completedUnits}개 완료 · 새 유닛이 곧 열려요
                </p>
              </>
            )}
          </div>

          {/* 우: 통계 3종 (학습 진도 / 연속학습 / 연습 횟수) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="mb-1 text-sm text-white/50">학습 진도</p>
              <p className="whitespace-nowrap text-3xl font-bold text-white">
                {completedUnits}
                <span className="text-xl">개 주제 완료</span>
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="mb-1 text-sm text-white/50">연속학습</p>
              <p className="whitespace-nowrap text-3xl font-bold text-white">
                {streak}
                <span className="text-xl">일</span>
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="mb-1 text-sm text-white/50">연습 횟수</p>
              <p className="whitespace-nowrap text-3xl font-bold text-white">
                {completedSections}
                <span className="text-xl">개 완료</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ② 학습 목록 */}
      <section className="px-4 py-6 md:px-10 md:py-8">
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>
          학습 목록
        </h2>
        <ProgressTabs
          units={unitsForTabs}
          progressMap={progressMap}
          tabAccess={tabAccess}
          isTrial={accountKind === "trialing"}
          isExpired={accountKind === "expired"}
        />
      </section>

      {/* ③ 복습과 시험 */}
      <section className="px-4 pb-6 md:px-10 md:pb-8" data-section="review">
        <div className="mb-6 flex items-center gap-3">
          <span className="text-2xl font-bold text-[#27d3c3]">03</span>
          <h2 className="text-2xl font-bold text-[#122c4f]">복습과 시험</h2>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* 좌: 오답 복습 */}
          <div className="rounded-2xl border border-[#d1f5f0] bg-[#e6fbf8] p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#122c4f]">
                  다시 연습해 보세요
                </h3>
                <p className="text-base text-[#64748b]">
                  {reviewWrongCount !== null
                    ? `지난 테스트에서 틀린 문제 총 ${reviewWrongCount}개`
                    : "아직 테스트 기록이 없어요"}
                </p>
              </div>
              <Link
                href={`/unit/${reviewSlug ?? "1"}?section=test`}
                className="rounded-xl bg-[#122c4f] px-4 py-2 text-base font-semibold text-white"
              >
                전체 복습
              </Link>
            </div>
            {/* 가·나·다 카드 일러스트 (정답 ✓ · 중앙 강조 · 오답 ✕) */}
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
                  <text
                    x="38"
                    y="56"
                    fill="#ffffff"
                    fontSize="46"
                    fontWeight="800"
                    fontFamily="Pretendard"
                    textAnchor="middle"
                  >
                    가
                  </text>
                  <circle cx="66" cy="12" r="10" fill="#ffffff" />
                  <path
                    d="M61 12.5 L65 16.5 L71 9"
                    stroke="#27d3c3"
                    strokeWidth="2.8"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
                <g transform="translate(96, 26) rotate(3)">
                  <rect x="0" y="0" width="92" height="92" rx="14" fill="#122c4f" />
                  <text
                    x="46"
                    y="68"
                    fill="#27d3c3"
                    fontSize="58"
                    fontWeight="800"
                    fontFamily="Pretendard"
                    textAnchor="middle"
                  >
                    나
                  </text>
                </g>
                <g transform="translate(198, 56) rotate(-4)">
                  <rect x="0" y="0" width="78" height="78" rx="12" fill="#ff7d5a" />
                  <text
                    x="39"
                    y="57"
                    fill="#ffffff"
                    fontSize="46"
                    fontWeight="800"
                    fontFamily="Pretendard"
                    textAnchor="middle"
                  >
                    다
                  </text>
                  <circle cx="68" cy="12" r="10" fill="#ffffff" />
                  <line
                    x1="63"
                    y1="7"
                    x2="73"
                    y2="17"
                    stroke="#ff7d5a"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                  <line
                    x1="73"
                    y1="7"
                    x2="63"
                    y2="17"
                    stroke="#ff7d5a"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                </g>
              </svg>
            </div>
          </div>

          {/* 우: 모의시험 */}
          <div className="rounded-2xl border border-orange-100 bg-[#fff8f5] p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="mb-1 text-xs font-bold text-[#ff7d5a]">
                  모의시험
                </p>
                <h3 className="text-xl font-bold text-[#122c4f]">
                  TOPIK 1 모의시험
                </h3>
                <p className="mt-1 text-sm text-[#64748b]">
                  도전하여 응시할 때마다 횟수가 올라가요.
                </p>
              </div>
              <span className="rounded-lg bg-[#ff7d5a] px-2 py-1 text-xs font-bold text-white">
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
            {completedUnits >= totalUnits ? (
              <Link
                href="/learn/exam"
                className="block w-full rounded-xl bg-[#ff7d5a] py-3 text-center font-bold text-white transition hover:bg-[#e86945]"
              >
                시험 시작하기 →
              </Link>
            ) : (
              <>
                <span
                  className="block w-full cursor-not-allowed rounded-xl bg-gray-200 py-3 text-center font-bold text-gray-400"
                  aria-disabled="true"
                >
                  🔒 시험 시작하기
                </span>
                <p className="mt-2 text-center text-sm text-[#64748b]">
                  모든 단원을 완료하면 시험을 볼 수 있어요
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ④ 이용 정보 */}
      <section className="px-4 pb-16 md:px-10 md:pb-16">
        <div className="mb-6 flex items-center gap-3">
          <span className="text-2xl font-bold text-[#27d3c3]">04</span>
          <h2 className="text-2xl font-bold text-[#122c4f]">이용 정보</h2>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* 멤버십 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <p className="mb-1 text-xs text-[#64748b]">현재 이용</p>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#122c4f]">
                {membershipHeadline}
              </h3>
              {accountKind === "trialing" && (
                <span className="font-bold text-[#ff7d5a]">
                  D-{trialDaysLeft}
                </span>
              )}
            </div>

            {accountKind === "trialing" && (
              <>
                <div className="mb-1 flex justify-between text-xs text-[#64748b]">
                  <span>사용 시작일: {formatDate(profile.learning_start_date, "첫 학습 시 자동 기록")}</span>
                  <span>체험 종료일: {formatDate(trialEndDate)}</span>
                </div>
                <div className="mb-4 h-1.5 rounded-full bg-gray-100">
                  <div
                    className="h-1.5 rounded-full bg-[#ff7d5a]"
                    style={{ width: `${trialProgress}%` }}
                  />
                </div>
                <Link
                  href="/pricing"
                  className="mb-2 block w-full rounded-xl bg-[#ff7d5a] py-3 text-center font-bold text-white transition hover:bg-[#e86945]"
                >
                  구독하기
                </Link>
                <Link
                  href="/pricing"
                  className="block w-full py-2 text-center text-base text-[#64748b]"
                >
                  이용권 안내
                </Link>
              </>
            )}

            {accountKind === "b2c_active" && sub && (
              <>
                <div className="mb-1 flex justify-between text-xs text-[#64748b]">
                  <span>사용 시작일: {formatDate(profile.learning_start_date, "첫 학습 시 자동 기록")}</span>
                  {sub.current_period_end && (
                    <span>다음 결제: {formatDate(sub.current_period_end)}</span>
                  )}
                </div>
                <p className="mb-4 mt-3 text-base text-[#64748b]">
                  결제 정보 관리는 아래 버튼을 이용해주세요.
                </p>
                {sub.stripe_customer_id && <PortalButton />}
              </>
            )}

            {accountKind === "b2b" && (
              <>
                <div className="mb-1 text-xs text-[#64748b]">
                  사용 시작일: {formatDate(profile.learning_start_date, "첫 학습 시 자동 기록")}
                </div>
                <p className="mt-3 text-base text-[#64748b]">
                  언어 변경 · 구독 관리는 학원 원장님께 요청해주세요.
                </p>
              </>
            )}

            {accountKind === "expired" && (
              <>
                <div className="mb-1 text-xs text-[#64748b]">
                  사용 시작일: {formatDate(profile.learning_start_date, "첫 학습 시 자동 기록")}
                </div>
                <p className="mb-4 mt-3 text-base text-[#64748b]">
                  체험 기간이 종료되었어요. 구독하시면 모든 학습을 이어서 할 수 있어요.
                </p>
                <Link
                  href="/pricing"
                  className="block w-full rounded-xl bg-[#ff7d5a] py-3 text-center font-bold text-white transition hover:bg-[#e86945]"
                >
                  구독하기 →
                </Link>
              </>
            )}
          </div>

          {/* 결제 내역 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <p className="mb-3 text-xs text-[#64748b]">결제 내역</p>
            <h3 className="mb-4 text-xl font-bold text-[#122c4f]">결제 내역</h3>
            <div className="flex h-32 flex-col items-center justify-center text-base text-[#64748b]">
              <p className="mb-4">아직 결제 내역이 없습니다.</p>
              {accountKind === "b2c_active" && sub?.stripe_customer_id ? (
                <PortalButton />
              ) : (
                <span className="rounded-xl border border-gray-200 px-4 py-2 text-base text-[#64748b]">
                  결제 후 확인 가능
                </span>
              )}
            </div>
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
