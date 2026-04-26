import Link from "next/link";
import type { AccountKind } from "@/lib/account-kind";

// 사용 예시:
//   <UnitCard
//     unitId="topik1_u02"
//     unitTitle="지하철 타기"
//     completedSections={2}
//     isPreviousUnitComplete={true}
//     accountKind={ctx.kind}
//     planType="topik1"
//     isCurrentUserPlan={ctx.planType === "topik1"}
//   />

type PlanCode = "topik1" | "topik2" | "eps";

interface UnitCardProps {
  unitId: string;            // "topik1_u01" / "topik2_u05" / "eps_u03"
  unitTitle: string;
  completedSections: number; // 0~5
  isPreviousUnitComplete: boolean;
  accountKind: AccountKind;
  planType: PlanCode | null; // 이 카드의 코스 플랜
  isCurrentUserPlan: boolean;
  /** true 면 영구 잠금 — "준비 중" (기획상 13~15) */
  isLockedUnit?: boolean;
  /** true 면 콘텐츠 미준비 — unitFileMap 갭. 기본 true (콘텐츠 있음) */
  isContentReady?: boolean;
}

const SECTIONS_PER_UNIT = 5;

type CardState =
  | "done"           // 5/5 완료
  | "in_progress"    // 1~4 진행 중
  | "ready"          // 0, 이전 완료 → 시작 가능
  | "locked"         // 0, 이전 미완료 → 잠금
  | "trial_locked"   // 무료체험 2번째+ 주제
  | "other_plan"     // 다른 코스 플랜 (구독 필요)
  | "coming_soon"    // 기획상 영구 잠금 (13~15)
  | "content_missing"; // 콘텐츠 준비 중 (unitFileMap 갭)

function parseUnitNum(unitId: string): number | null {
  const m = unitId.match(/_u(\d+)$/);
  if (!m) return null;
  const n = Number.parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

function unitUrl(planType: PlanCode | null, unitNum: number): string {
  // TOPIK1 은 /unit/{n}, 추후 추가되는 코스는 별도 경로 (PROGRESS.md 예약)
  if (planType === "topik2") return `/unit/topik2/${unitNum}`;
  if (planType === "eps") return `/unit/eps/${unitNum}`;
  return `/unit/${unitNum}`;
}

function resolveState(props: UnitCardProps, unitNum: number | null): CardState {
  const {
    completedSections,
    isPreviousUnitComplete,
    accountKind,
    isCurrentUserPlan,
    isLockedUnit,
    isContentReady = true,
  } = props;

  // 0a) 기획상 영구 잠금 (13~15) — 모든 분기보다 우선
  if (isLockedUnit) return "coming_soon";
  // 0b) 콘텐츠 미준비 — 영구 잠금이 아닐 때만 검사
  if (!isContentReady) return "content_missing";

  // 1) 다른 플랜 카드 (사용자 구독 플랜 아님)
  if (!isCurrentUserPlan) return "other_plan";

  // 2) 무료체험 2번째 주제 이후 잠금
  if (accountKind === "trialing" && unitNum !== null && unitNum > 1) {
    return "trial_locked";
  }

  // 3) 완료
  if (completedSections >= SECTIONS_PER_UNIT) return "done";

  // 4) 진행 중
  if (completedSections > 0) return "in_progress";

  // 5) 미시작 + 이전 완료 → 시작 가능
  if (isPreviousUnitComplete) return "ready";

  // 6) 이전 미완료 → 잠금
  return "locked";
}

export default function UnitCard(props: UnitCardProps) {
  const { unitId, unitTitle, completedSections, planType } = props;
  const unitNum = parseUnitNum(unitId);
  const state = resolveState(props, unitNum);
  const percent = Math.min(
    100,
    Math.round((completedSections / SECTIONS_PER_UNIT) * 100),
  );
  const unitHref = unitNum !== null ? unitUrl(planType, unitNum) : "#";
  const numberLabel = unitNum !== null ? `주제 ${unitNum}` : "주제";

  // ─────── "준비 중" / "콘텐츠 준비 중" — 회색 자물쇠 + 안내 (CTA 없음) ───────
  if (state === "coming_soon" || state === "content_missing") {
    const note =
      state === "coming_soon"
        ? "곧 오픈 예정입니다"
        : "콘텐츠 준비 중 · 곧 오픈됩니다";
    return (
      <article
        aria-disabled="true"
        className="rounded-[22px] bg-[#f1f5f9] p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#94a3b8]">{numberLabel}</p>
            <h3 className="mt-1 text-lg font-bold text-[#94a3b8]">{unitTitle}</h3>
          </div>
          <span aria-hidden className="text-lg text-[#94a3b8]">🔒</span>
        </div>
        <p className="mt-4 text-xs text-[#94a3b8]">{note}</p>
        <div className="mt-5 flex justify-end">
          <span
            aria-disabled="true"
            className="inline-flex cursor-not-allowed items-center rounded-xl bg-[#e2e8f0] px-5 py-2 text-sm font-bold text-[#94a3b8]"
          >
            준비 중
          </span>
        </div>
      </article>
    );
  }

  // ─────── 오버레이 상태 (trial_locked / other_plan) ───────
  if (state === "trial_locked" || state === "other_plan") {
    const overlayTitle =
      state === "trial_locked"
        ? "구독하고 15개 주제 전체 학습하기"
        : "이 코스는 다른 구독이 필요해요";
    const overlayCta =
      state === "trial_locked" ? "구독하고 시작하기 →" : "구독 보러 가기 →";

    return (
      <article className="relative overflow-hidden rounded-[22px] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
        {/* 내부 콘텐츠 (블러 처리) */}
        <div className="pointer-events-none p-6 blur-[2px]">
          <p className="text-xs font-semibold text-[#64748b]">{numberLabel}</p>
          <h3 className="mt-1 text-lg font-bold text-[#122c4f]">{unitTitle}</h3>
          <div className="mt-4 h-2 rounded-full bg-[#e2e8f0]">
            <div className="h-2 w-0 rounded-full" />
          </div>
        </div>
        {/* 오버레이 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 p-6 text-center">
          <span className="mb-2 text-2xl" aria-hidden>🔒</span>
          <p className="mb-4 text-sm font-semibold text-[#122c4f]">
            {overlayTitle}
          </p>
          <Link
            href="/pricing"
            className="rounded-xl bg-[#122c4f] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#1a3d6e]"
          >
            {overlayCta}
          </Link>
        </div>
      </article>
    );
  }

  // ─────── 일반 상태 (done / in_progress / ready / locked) ───────
  const badge =
    state === "done" ? (
      <span className="inline-flex items-center rounded-[8px] bg-[#dcfce7] px-2 py-0.5 text-xs font-semibold text-[#16a34a]">
        완료 ✅
      </span>
    ) : state === "in_progress" ? (
      <span className="inline-flex items-center rounded-[8px] bg-[#dbeafe] px-2 py-0.5 text-xs font-semibold text-[#1d4ed8]">
        진행 중
      </span>
    ) : null;

  const barFill =
    state === "done" ? "bg-[#22c55e]"
    : state === "in_progress" ? "bg-[#27d3c3]"
    : state === "locked" ? "bg-[#cbd5e1]"
    : "bg-[#e2e8f0]";

  const action =
    state === "done" ? (
      <Link
        href={unitHref}
        className="inline-flex items-center rounded-xl bg-[#122c4f] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#1a3d6e]"
      >
        다시보기
      </Link>
    ) : state === "in_progress" ? (
      <Link
        href={unitHref}
        className="inline-flex items-center rounded-xl bg-[#27d3c3] px-5 py-2 text-sm font-bold text-[#122c4f] transition hover:bg-[#1fb8a8]"
      >
        이어하기
      </Link>
    ) : state === "ready" ? (
      <Link
        href={unitHref}
        className="inline-flex items-center rounded-xl bg-[#122c4f] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#1a3d6e]"
      >
        시작하기
      </Link>
    ) : (
      <span
        aria-disabled="true"
        className="inline-flex cursor-not-allowed items-center rounded-xl bg-[#e2e8f0] px-5 py-2 text-sm font-bold text-[#94a3b8]"
      >
        🔒 시작하기
      </span>
    );

  return (
    <article className="rounded-[22px] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#64748b]">{numberLabel}</p>
          <h3 className="mt-1 text-lg font-bold text-[#122c4f]">{unitTitle}</h3>
        </div>
        {badge}
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-[#64748b]">
          <span>
            {SECTIONS_PER_UNIT}단계 중 {completedSections}단계 완료
          </span>
          <span>{percent}%</span>
        </div>
        <div className="h-2 rounded-full bg-[#e2e8f0]">
          <div
            className={`h-2 rounded-full ${barFill} transition-all`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        {state === "locked" ? (
          <p className="text-xs text-[#94a3b8]">
            이전 주제를 완료하면 열려요
          </p>
        ) : (
          <span />
        )}
        {action}
      </div>
    </article>
  );
}
