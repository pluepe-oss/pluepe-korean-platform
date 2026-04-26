'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Unit = {
  id: string;
  unitNum: number;
  title: string;
  path: string;
  /** unitFileMap 에 등록되어 실제 콘텐츠 진입이 가능 (현재 1, 2번만 true) */
  implemented: boolean;
  /** "준비 중" 회색 잠금 — 기획상 13~15 (CurriculumSection 의 locked 와 일관) */
  locked: boolean;
};

type TabKey = 'topik1' | 'topik2' | 'eps';

type Props = {
  units: Unit[];
  progressMap: Record<string, number>;
  tabAccess: { topik1: boolean; topik2: boolean; eps: boolean };
  isTrial: boolean;
  isExpired: boolean;
};

const EXPIRED_COPY = {
  title: '체험 기간이 종료되었어요',
  desc: '구독하시면 모든 학습을 이어서 할 수 있어요',
};

const TABS: { id: TabKey; label: string; count: number }[] = [
  { id: 'topik1', label: 'TOPIK 1', count: 15 },
  { id: 'topik2', label: 'TOPIK 2', count: 20 },
  { id: 'eps', label: 'EPS-TOPIK', count: 20 },
];

const TOPIK2_PLACEHOLDER: Unit[] = [
  {
    id: 't2_coming',
    unitNum: 1,
    title: 'TOPIK 2 콘텐츠 준비 중',
    path: '#',
    implemented: false,
    locked: false,
  },
];

const EPS_PLACEHOLDER: Unit[] = [
  {
    id: 'eps_coming',
    unitNum: 1,
    title: 'EPS-TOPIK 콘텐츠 준비 중',
    path: '#',
    implemented: false,
    locked: false,
  },
];

const LOCKED_COPY: Record<TabKey, { title: string; desc: string }> = {
  topik1: {
    title: 'TOPIK 1 과정은 구독 후 이용할 수 있습니다',
    desc: '총 15개 주제 · 기초 어휘 · 기본 표현 포함',
  },
  topik2: {
    title: 'TOPIK 2 과정은 구독 후 이용할 수 있습니다',
    desc: '총 20개 주제 · 중,고급 어휘 · 모의시험 3회 포함',
  },
  eps: {
    title: 'EPS-TOPIK 과정은 구독 후 이용할 수 있습니다',
    desc: '총 20개 주제 · 고용허가제 시험 대비 · 업종별 회화',
  },
};

const TRIAL_MAX_UNIT = 2;

function LockClosedIcon({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <path d="M12 2a5 5 0 00-5 5v3H6a1 1 0 00-1 1v9a1 1 0 001 1h12a1 1 0 001-1v-9a1 1 0 00-1-1h-1V7a5 5 0 00-5-5zm3 8V7a3 3 0 10-6 0v3h6z" />
    </svg>
  );
}

function LockOpenIcon({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <path d="M18 8h-1V7a6 6 0 00-11.6-2.2 1 1 0 101.9.7A4 4 0 0115 7v1H6a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V9a1 1 0 00-1-1z" />
    </svg>
  );
}

export function ProgressTabs({
  units,
  progressMap,
  tabAccess,
  isTrial,
  isExpired,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('topik1');

  const activeUnits: Unit[] =
    activeTab === 'topik1'
      ? units
      : activeTab === 'topik2'
        ? TOPIK2_PLACEHOLDER
        : EPS_PLACEHOLDER;

  const activeLocked = !tabAccess[activeTab];
  const activeCopy = isExpired ? EXPIRED_COPY : LOCKED_COPY[activeTab];

  return (
    <div>
      {/* 코스 탭 — expired 는 회색 잠금, trial 은 b2c_active 와 동일 처리 */}
      <div
        style={{
          background: '#f1f5f9',
          borderRadius: 14,
          padding: 5,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 6,
        }}
      >
        {TABS.map((tab) => {
          const locked = !tabAccess[tab.id];
          const isActive = activeTab === tab.id;
          const showInUseBadge = isActive && !locked;
          // expired 는 회색, 그 외 잠금 탭은 orange (구독 유도)
          const lockBadgeBg = isExpired ? '#cbd5e1' : '#ff7d5a';
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: '-0.01em',
                background: isActive ? '#122c4f' : 'transparent',
                color: isActive ? '#ffffff' : '#122c4f',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: 7,
                  background: locked ? lockBadgeBg : '#27d3c3',
                  flexShrink: 0,
                }}
              >
                {locked ? (
                  <LockClosedIcon size={14} color="#ffffff" />
                ) : (
                  <LockOpenIcon size={14} color="#ffffff" />
                )}
              </span>
              <span>{tab.label}</span>
              <span style={{ fontSize: 13, opacity: 0.75 }}>· {tab.count} 주제</span>
              {showInUseBadge && (
                <span
                  style={{
                    background: '#27d3c3',
                    color: '#122c4f',
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: 999,
                  }}
                >
                  이용중
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeLocked ? (
        <LockedBanner
          title={activeCopy.title}
          desc={activeCopy.desc}
          isExpired={isExpired}
          onSubscribe={() => router.push('/pricing')}
        />
      ) : (
        <UnitList
          units={activeUnits}
          progressMap={progressMap}
          isTrial={isTrial}
        />
      )}
    </div>
  );
}

function UnitList({
  units,
  progressMap,
  isTrial,
}: {
  units: Unit[];
  progressMap: Record<string, number>;
  isTrial: boolean;
}) {
  // Trial 첫 잠금 주제(= 가장 작은 trial-blocked 번호, locked=true 13~15 제외) 식별
  // → navy 안내 박스를 1회만 노출
  const firstTrialBlockedNum = isTrial
    ? units.find(
        (u) => !u.locked && u.unitNum > TRIAL_MAX_UNIT,
      )?.unitNum ?? null
    : null;

  return (
    <ul
      style={{
        listStyle: 'none',
        padding: 0,
        margin: '12px 0 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {units.map((unit) => {
        const raw = progressMap[unit.id] ?? 0;
        const progress = Math.min(5, Math.max(0, raw));
        const progressPct = (progress / 5) * 100;
        const isDone = unit.implemented && progress >= 5;
        const isInProgress = unit.implemented && progress > 0 && progress < 5;

        // 이전 주제 5섹션 완료 여부
        const prevUnitDone =
          unit.unitNum === 1
            ? true
            : (progressMap[`topik1_u${String(unit.unitNum - 1).padStart(2, '0')}`] ?? 0) >= 5;

        // 작업 1·7: 기획상 영구 잠금 (13~15) — "준비 중"
        const isComingSoon = unit.locked === true;
        // 작업 7: 콘텐츠 미준비 (3~12: implemented=false 이지만 locked 아님) — "콘텐츠 준비 중"
        const isContentMissing = !unit.locked && !unit.implemented;
        // Trial 한계 잠금 (3~12 만 적용, 13~15 는 isComingSoon 으로 흡수)
        const trialBlocked =
          isTrial && !unit.locked && unit.unitNum > TRIAL_MAX_UNIT;
        // 진도 잠금 (이전 주제 미완료) — implemented 한 코스에만 적용
        const progressLocked =
          unit.implemented && !isInProgress && !isDone && !prevUnitDone;

        // 작업 3 case 2: trial 사용자 + 다음 차례인데 이전 미완료 → 자물쇠 X, 숫자 + 안내 텍스트
        // (진행/완료 X, prev 미완료, trial 한계 미도달, 콘텐츠 준비됨)
        const isTrialNextCue =
          isTrial &&
          unit.implemented &&
          !isInProgress &&
          !isDone &&
          !prevUnitDone &&
          !trialBlocked;

        // 카드의 시각적 잠금 여부 (자물쇠 아이콘 + 회색 톤)
        // - isComingSoon, isContentMissing: 항상 잠금
        // - trial-blocked 두 번째 이후 (3~12 중 trial 못 푸는 4~12): 회색 자물쇠
        // - progress-locked (이전 미완료): 회색 자물쇠 — 단 Trial-NextCue 는 예외 (자물쇠 X)
        const isFirstTrialBlocked =
          trialBlocked && unit.unitNum === firstTrialBlockedNum;
        const isVisuallyLocked =
          isComingSoon ||
          isContentMissing ||
          (trialBlocked && !isFirstTrialBlocked) ||
          (progressLocked && !isTrialNextCue);

        let circleBg = '#f1f5f9';
        let circleColor = '#122c4f';
        if (isComingSoon || isContentMissing) {
          circleBg = '#e2e8f0';
          circleColor = '#94a3b8';
        } else if (isDone) {
          circleBg = '#22c55e';
          circleColor = '#ffffff';
        } else if (isInProgress) {
          circleBg = '#122c4f';
          circleColor = '#ffffff';
        } else if (isVisuallyLocked) {
          circleBg = '#e2e8f0';
          circleColor = '#94a3b8';
        }

        // 버튼 정책 (작업 3 정밀화):
        // - isComingSoon (13~15): 버튼 없음
        // - isContentMissing (3~12 미제작): 버튼 없음
        // - isFirstTrialBlocked: navy [구독하기]
        // - 그 외 trial-blocked / progress-locked: 버튼 없음
        // - isTrialNextCue: 버튼 없음 (숫자 + 안내만)
        // - 정상: 시작/이어하기/다시보기
        let button: {
          label: string;
          bg: string;
          color: string;
          href: string;
        } | null = null;
        if (isComingSoon || isContentMissing) {
          button = null;
        } else if (isFirstTrialBlocked) {
          button = {
            label: '구독하기',
            bg: '#122c4f',
            color: '#ffffff',
            href: '/pricing',
          };
        } else if (isVisuallyLocked || isTrialNextCue) {
          button = null;
        } else if (isDone) {
          button = {
            label: '다시 보기',
            bg: '#f1f5f9',
            color: '#122c4f',
            href: unit.path,
          };
        } else if (isInProgress) {
          button = {
            label: '이어하기',
            bg: '#122c4f',
            color: '#ffffff',
            href: unit.path,
          };
        } else {
          button = {
            label: '시작하기',
            bg: '#f1f5f9',
            color: '#122c4f',
            href: unit.path,
          };
        }

        // 카드 외곽 디자인:
        // - isFirstTrialBlocked: navy 박스 (구독 안내, 화면 강조)
        // - isTrialNextCue: 활성 디자인 유지 (회색 처리 X)
        // - 그 외 잠금: 회색 톤 + opacity 0.55
        const isNavyBlock = isFirstTrialBlocked;
        const opacity =
          isNavyBlock || isTrialNextCue ? 1 : isVisuallyLocked ? 0.55 : 1;

        return (
          <li
            key={unit.id}
            style={{
              background: isNavyBlock ? '#122c4f' : '#ffffff',
              border: isNavyBlock ? '1px solid #122c4f' : '1px solid #e5e7eb',
              borderRadius: 14,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              opacity,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: isNavyBlock ? 'rgba(255,255,255,0.15)' : circleBg,
                color: isNavyBlock ? '#ffffff' : circleColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {isNavyBlock ? (
                <LockClosedIcon size={14} color="#ffffff" />
              ) : isTrialNextCue ? (
                unit.unitNum
              ) : isVisuallyLocked ? (
                <LockClosedIcon size={14} color="#94a3b8" />
              ) : (
                unit.unitNum
              )}
            </div>
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: isNavyBlock
                    ? '#ffffff'
                    : isComingSoon || isContentMissing
                      ? '#94a3b8'
                      : '#0f172a',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                주제 {unit.unitNum}. {unit.title}
              </div>
              {/* 1) Trial 첫 잠금 주제 → navy 안내 박스 본문 */}
              {isFirstTrialBlocked && (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
                  체험은 주제 {TRIAL_MAX_UNIT}까지 가능해요. 구독하고 15개 주제 전체를 학습할 수 있어요.
                </div>
              )}
              {/* 2) Trial 다음 차례 단서 → 자물쇠 X, 안내만 */}
              {isTrialNextCue && (
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  이전 주제를 완료하면 열려요
                </div>
              )}
              {/* 3) 일반 진도 잠금 (Trial 외 또는 trial-blocked 아님) */}
              {!isFirstTrialBlocked &&
                !isTrialNextCue &&
                progressLocked && (
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    이전 주제를 완료하면 열려요
                  </div>
                )}
              {/* 4) 영구 잠금 (13~15) */}
              {isComingSoon && (
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  준비 중 · 곧 오픈 예정입니다
                </div>
              )}
              {/* 5) 콘텐츠 미준비 (3~12 미제작) */}
              {isContentMissing && (
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  콘텐츠 준비 중 · 곧 오픈됩니다
                </div>
              )}
            </div>
            {/* 진도바 — 진행 중 / 완료에서만 표시 */}
            {unit.implemented && (isInProgress || isDone) && (
              <div
                style={{
                  width: 120,
                  height: 4,
                  background: '#f1f5f9',
                  borderRadius: 99,
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: `${progressPct}%`,
                    height: '100%',
                    background: isDone ? '#22c55e' : '#27d3c3',
                    transition: 'width 0.3s',
                  }}
                />
              </div>
            )}
            {button && (
              <Link
                href={button.href}
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  borderRadius: 8,
                  padding: '7px 16px',
                  background: button.bg,
                  color: button.color,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {button.label}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function LockedBanner({
  title,
  desc,
  isExpired,
  onSubscribe,
}: {
  title: string;
  desc: string;
  isExpired: boolean;
  onSubscribe: () => void;
}) {
  // expired 는 회색 톤, 일반 잠금은 navy 톤 (orange CTA 1개 규칙 보호)
  const accent = isExpired ? '#cbd5e1' : '#122c4f';
  const accentSoft = isExpired ? '#f1f5f9' : '#e2e8f0';

  return (
    <div
      style={{
        marginTop: 12,
        position: 'relative',
        overflow: 'hidden',
        background: '#ffffff',
        border: `1.5px dashed ${accent}`,
        borderRadius: 16,
        padding: '36px 40px',
        display: 'flex',
        alignItems: 'center',
        gap: 32,
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: accentSoft,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <LockClosedIcon size={40} color={accent} />
      </div>

      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: '#0f172a',
            marginBottom: 6,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 13, color: '#64748b' }}>{desc}</div>
      </div>

      <div style={{ flexShrink: 0 }}>
        <button
          type="button"
          onClick={onSubscribe}
          style={{
            background: '#122c4f',
            color: '#ffffff',
            padding: '14px 28px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {isExpired ? '구독 연장하기' : '구독하기'}
        </button>
      </div>
    </div>
  );
}
