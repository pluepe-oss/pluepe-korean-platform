'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Unit = {
  id: string;
  unitNum: number;
  title: string;
  path: string;
  implemented: boolean;
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
  { id: 'topik1', label: 'TOPIK 1', count: 12 },
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
  },
];

const EPS_PLACEHOLDER: Unit[] = [
  {
    id: 'eps_coming',
    unitNum: 1,
    title: 'EPS-TOPIK 콘텐츠 준비 중',
    path: '#',
    implemented: false,
  },
];

const LOCKED_COPY: Record<TabKey, { title: string; desc: string }> = {
  topik1: {
    title: 'TOPIK 1 과정은 구독 후 이용할 수 있습니다',
    desc: '총 12개 주제 · 기초 어휘 · 기본 표현 포함',
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
                  background: locked ? '#ff7d5a' : '#27d3c3',
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
              <span style={{ fontSize: 13, opacity: 0.75 }}>· {tab.count}</span>
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
          showPrice={!isExpired}
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
        const isNotStarted = unit.implemented && progress === 0;

        let circleBg = '#f1f5f9';
        let circleColor = '#122c4f';
        if (!unit.implemented) {
          circleColor = '#94a3b8';
        } else if (isDone) {
          circleBg = '#27d3c3';
          circleColor = '#ffffff';
        } else if (isInProgress) {
          circleBg = '#122c4f';
          circleColor = '#ffffff';
        }

        let button: {
          label: string;
          bg: string;
          color: string;
          href: string;
        } | null = null;
        if (!unit.implemented) {
          button = null;
        } else if (isTrial && unit.unitNum > 1) {
          button = {
            label: '구독하기',
            bg: '#ff7d5a',
            color: '#ffffff',
            href: '/pricing',
          };
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
        } else if (isNotStarted) {
          button = {
            label: '시작하기',
            bg: '#f1f5f9',
            color: '#122c4f',
            href: unit.path,
          };
        }

        return (
          <li
            key={unit.id}
            style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 14,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: circleBg,
                color: circleColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {unit.unitNum}
            </div>
            <div
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 15,
                fontWeight: 700,
                color: unit.implemented ? '#0f172a' : '#94a3b8',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {unit.title}
            </div>
            {unit.implemented && (
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
  showPrice = true,
  onSubscribe,
}: {
  title: string;
  desc: string;
  showPrice?: boolean;
  onSubscribe: () => void;
}) {
  return (
    <div
      style={{
        marginTop: 12,
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #fff2ec 0%, #fff 55%)',
        border: '2px dashed #ff7d5a',
        borderRadius: 16,
        padding: '44px 48px',
        display: 'flex',
        alignItems: 'center',
        gap: 40,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: 200,
          height: 200,
          right: -60,
          top: -60,
          background: '#ff7d5a',
          opacity: 0.08,
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: 160,
          height: 160,
          right: 40,
          bottom: -60,
          background: '#ff7d5a',
          opacity: 0.05,
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: 24,
          background: '#ffffff',
          border: '2px solid rgba(255,125,90,0.25)',
          boxShadow: '0 10px 30px rgba(255,125,90,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <svg
          width={54}
          height={58}
          viewBox="0 0 24 24"
          fill="#ff7d5a"
          aria-hidden="true"
          style={{ display: 'block' }}
        >
          <path d="M12 2a5 5 0 00-5 5v3H6a1 1 0 00-1 1v9a1 1 0 001 1h12a1 1 0 001-1v-9a1 1 0 00-1-1h-1V7a5 5 0 00-5-5zm3 8V7a3 3 0 10-6 0v3h6z" />
        </svg>
      </div>

      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: '#ff7d5a',
            color: '#ffffff',
            fontSize: 11,
            fontWeight: 800,
            padding: '3px 10px',
            borderRadius: 999,
            marginBottom: 10,
          }}
        >
          <LockClosedIcon size={12} color="#ffffff" />
          잠금 상태
        </span>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#0f172a',
            marginBottom: 8,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 13,
            color: '#64748b',
            marginBottom: 14,
          }}
        >
          {desc}
        </div>
        {showPrice && (
          <div>
            <span style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>
              ₩19,900
            </span>
            <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 4 }}>
              {' / 월 · 언제든 해지'}
            </span>
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0, position: 'relative', zIndex: 1 }}>
        <button
          type="button"
          onClick={onSubscribe}
          style={{
            background: '#ff7d5a',
            color: '#ffffff',
            padding: '16px 40px',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 800,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 22px rgba(255,125,90,0.33)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <LockOpenIcon size={16} color="#ffffff" />
          구독하기
        </button>
      </div>
    </div>
  );
}
