import Link from "next/link";
import type { AccountKind } from "@/lib/account-kind";

// 사용 예시 (Navy Hero 내부 4컬럼 그리드 첫 셀):
//   <TodaySection
//     accountKind={ctx.kind}
//     planType={ctx.planType}
//     planTier={ctx.planTier}
//     userProgress={[{ unitId: "topik1_u01", completedSections: 3 }, ...]}
//   />
//
// 카드 자체가 <Link> 클릭 영역. 우측 하단에 명확한 navy [바로가기] 버튼.
// orange CTA 는 expired / trial 한계 도달 시에만 사용 (화면당 1개 규칙).

type PlanCode = "topik1" | "topik2" | "eps";

export interface UnitProgress {
  unitId: string;
  completedSections: number;
}

interface TodaySectionProps {
  accountKind: AccountKind;
  planType: PlanCode | null;
  planTier: "basic" | "premium" | null;
  userProgress: UnitProgress[];
}

const SECTIONS_PER_UNIT = 5;
// 작업 1: TOPIK 1 = 15 주제. 단 13~15 는 "준비 중" 잠금 (TodaySection 다음 주제 추천에서 제외)
const TOPIK1_MAX_UNIT = 15;
const TOPIK1_AVAILABLE_MAX = 12;
const TRIAL_MAX_UNIT = 2;

const TOPIK1_UNITS: Record<number, string> = {
  1: "편의점에서 물건 사기",
  2: "지하철 타기",
  3: "카페에서 주문하기",
  4: "쇼핑몰에서 옷 사기",
  5: "길 묻기",
  6: "병원에서 진료받기",
  7: "약국에서 약 사기",
  8: "은행/ATM 이용하기",
  9: "쇼핑몰에서 옷 사기",
  10: "학원에서 질문하기",
  11: "집/숙소 관련 표현",
  12: "일상 일정 말하기",
  13: "가족/지인 소개",
  14: "취미/여가 말하기",
  15: "날씨/계절 표현",
};

// EPS-TOPIK 가용 주제. 현재는 1번만 implemented.
const EPS_UNITS: Record<number, string> = {
  1: "작업 지시 이해하기",
};

function parseUnitNumber(unitId: string, prefix: string): number | null {
  const head = `${prefix}_u`;
  if (!unitId.startsWith(head)) return null;
  const n = Number.parseInt(unitId.slice(head.length), 10);
  return Number.isFinite(n) ? n : null;
}

function buildProgressMap(progress: UnitProgress[], prefix: string): Map<number, number> {
  const map = new Map<number, number>();
  for (const p of progress) {
    const n = parseUnitNumber(p.unitId, prefix);
    if (n === null) continue;
    map.set(n, Math.max(map.get(n) ?? 0, p.completedSections));
  }
  return map;
}

const CARD_BASE =
  "block rounded-[22px] bg-white p-6 transition shadow-[0_12px_30px_rgba(15,23,42,0.08)] hover:-translate-y-0.5";
const CARD_DISABLED =
  "block rounded-[22px] bg-[#f1f5f9] p-6 cursor-not-allowed shadow-[0_12px_30px_rgba(15,23,42,0.08)]";

const NAVY_BTN =
  "inline-flex items-center justify-center rounded-xl bg-[#122c4f] px-5 py-2 text-sm font-bold text-white";
const ORANGE_BTN =
  "inline-flex items-center justify-center rounded-xl bg-[#ff7d5a] px-5 py-2 text-sm font-bold text-white";
const DISABLED_BTN =
  "inline-flex items-center justify-center rounded-xl bg-[#e2e8f0] px-5 py-2 text-sm font-bold text-[#94a3b8] cursor-default";

interface CardLayoutProps {
  label: string;
  labelTone: "mint" | "orange" | "muted";
  title: string;
  meta?: string;
  buttonLabel: string;
  buttonClass: string;
}

function CardLayout({ label, labelTone, title, meta, buttonLabel, buttonClass }: CardLayoutProps) {
  const labelColor =
    labelTone === "orange"
      ? "text-[#ff7d5a]"
      : labelTone === "muted"
        ? "text-[#94a3b8]"
        : "text-[#27d3c3]";
  return (
    <div className="flex h-full min-h-[150px] flex-col">
      <p className={`text-xs font-semibold ${labelColor}`}>{label}</p>
      <h3 className="mt-2 text-lg font-semibold leading-snug text-[#0f172a]">{title}</h3>
      {meta && <p className="mt-2 text-sm text-[#64748b]">{meta}</p>}
      <div className="mt-auto pt-4 text-right">
        <span className={buttonClass}>{buttonLabel}</span>
      </div>
    </div>
  );
}

export default function TodaySection({
  accountKind,
  planType,
  planTier: _planTier,
  userProgress,
}: TodaySectionProps) {
  // ─── 분기: expired ── orange [구독 연장하기 →] (화면 유일 orange) ───
  if (accountKind === "expired") {
    return (
      <Link href="/pricing" className={CARD_BASE} aria-label="구독 연장하기">
        <CardLayout
          label="오늘 학습"
          labelTone="orange"
          title="학습이 종료되었어요"
          meta="구독하시면 모든 학습을 이어서 할 수 있어요"
          buttonLabel="구독 연장하기 →"
          buttonClass={ORANGE_BTN}
        />
      </Link>
    );
  }

  // ─── 분기: topik2 — 콘텐츠 미준비 → 비활성 ───
  if (planType === "topik2") {
    return (
      <div className={CARD_DISABLED} aria-disabled="true">
        <CardLayout
          label="오늘 학습"
          labelTone="muted"
          title={`🔒 TOPIK 2 콘텐츠 준비 중`}
          meta="곧 오픈 예정이에요"
          buttonLabel="준비 중"
          buttonClass={DISABLED_BTN}
        />
      </div>
    );
  }

  // ─── 분기: EPS-TOPIK — 가용 유닛 1개 (작업 지시 이해하기) ───
  // 현재 카탈로그가 1유닛만 implemented 라 "다음 주제" 추천은 생략하고,
  // 진도(eps_u01) 에 따라 fresh / in_progress / done 표시.
  if (planType === "eps") {
    const epsMap = buildProgressMap(userProgress, "eps");
    const done = epsMap.get(1) ?? 0;
    const isInProgress = done > 0 && done < SECTIONS_PER_UNIT;
    const isAllDone = done >= SECTIONS_PER_UNIT;
    const percent = Math.round((done / SECTIONS_PER_UNIT) * 100);

    const titleText = `주제 1. ${EPS_UNITS[1]}`;
    const metaText = isAllDone
      ? "완료한 주제예요. 다시 학습할 수 있어요."
      : isInProgress
        ? `${SECTIONS_PER_UNIT}단계 중 ${done}단계 · ${percent}%`
        : `주제 1 · ${SECTIONS_PER_UNIT}단계 학습`;
    const buttonLabel = isAllDone
      ? "다시 학습 →"
      : isInProgress
        ? "이어하기 →"
        : "학습 시작 →";

    return (
      <Link href="/unit/eps/1" className={CARD_BASE}>
        <CardLayout
          label="오늘 학습"
          labelTone="mint"
          title={titleText}
          meta={metaText}
          buttonLabel={buttonLabel}
          buttonClass={NAVY_BTN}
        />
      </Link>
    );
  }

  // ─── topik1 / trialing 분기 결정 ───
  const map = buildProgressMap(userProgress, "topik1");
  const isTrial = accountKind === "trialing";

  let targetUnit = 0;
  let targetCompleted = 0;
  let targetMode: "fresh" | "in_progress" | "next" | "all_done" = "fresh";

  // 13~15 는 잠금 — 다음 주제 추천에서 제외하고 1~12 만 탐색
  for (let n = 1; n <= TOPIK1_AVAILABLE_MAX; n++) {
    const done = map.get(n) ?? 0;
    if (done > 0 && done < SECTIONS_PER_UNIT) {
      targetUnit = n;
      targetCompleted = done;
      targetMode = "in_progress";
      break;
    }
  }

  if (targetUnit === 0) {
    let lastCompleted = 0;
    for (let n = 1; n <= TOPIK1_AVAILABLE_MAX; n++) {
      if ((map.get(n) ?? 0) >= SECTIONS_PER_UNIT) lastCompleted = n;
      else break;
    }
    if (lastCompleted === 0) {
      targetUnit = 1;
      targetCompleted = 0;
      targetMode = "fresh";
    } else if (lastCompleted >= TOPIK1_AVAILABLE_MAX) {
      targetUnit = 1;
      targetCompleted = SECTIONS_PER_UNIT;
      targetMode = "all_done";
    } else {
      targetUnit = lastCompleted + 1;
      targetCompleted = 0;
      targetMode = "next";
    }
  }

  // ─── 분기: trialing + 주제 2 완료 → orange [구독하기 →] (화면 유일 orange) ───
  if (isTrial && targetMode === "next" && targetUnit > TRIAL_MAX_UNIT) {
    return (
      <Link href="/pricing" className={CARD_BASE} aria-label="구독하고 주제 3부터 계속하기">
        <CardLayout
          label="오늘 학습"
          labelTone="orange"
          title="체험 가능한 주제를 모두 학습했어요"
          meta="구독하고 주제 3부터 계속 학습해 보세요"
          buttonLabel="구독하기 →"
          buttonClass={ORANGE_BTN}
        />
      </Link>
    );
  }

  const unitTitle = TOPIK1_UNITS[targetUnit] ?? `주제 ${targetUnit}`;
  const percent = Math.round((targetCompleted / SECTIONS_PER_UNIT) * 100);

  // ─── 분기: all_done → navy [다시 학습 →] ───
  if (targetMode === "all_done") {
    return (
      <Link href="/unit/1" className={CARD_BASE}>
        <CardLayout
          label="오늘 학습"
          labelTone="mint"
          title="처음부터 다시 학습하기"
          meta="모든 주제를 완료했어요. 모의시험으로 실력을 점검해 보세요."
          buttonLabel="다시 학습 →"
          buttonClass={NAVY_BTN}
        />
      </Link>
    );
  }

  // ─── 분기 1/2/3/4/6: 일반 학습 카드 (navy [바로가기]) ───
  const titleText = `주제 ${targetUnit}. ${unitTitle}`;
  const metaText =
    targetMode === "in_progress"
      ? `${SECTIONS_PER_UNIT}단계 중 ${targetCompleted}단계 · ${percent}%`
      : targetMode === "next"
        ? `다음 주제 · ${SECTIONS_PER_UNIT}단계 학습`
        : `주제 ${targetUnit} · ${SECTIONS_PER_UNIT}단계 학습`;

  const buttonLabel =
    targetMode === "in_progress"
      ? "이어하기 →"
      : targetMode === "next"
        ? "다음 주제 시작 →"
        : "학습 시작 →";

  return (
    <Link href={`/unit/${targetUnit}`} className={CARD_BASE}>
      <CardLayout
        label="오늘 학습"
        labelTone="mint"
        title={titleText}
        meta={metaText}
        buttonLabel={buttonLabel}
        buttonClass={NAVY_BTN}
      />
    </Link>
  );
}
