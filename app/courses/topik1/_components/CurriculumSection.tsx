'use client';

import { useState } from 'react';

type Unit = {
  n: number;
  emoji: string;
  title: string;
  badge: string;
  expressions: string[];
  result: string;
  locked?: boolean;
};

type Phase = {
  id: number;
  title: string;
  subtitle: string;
  range: string;
  units: Unit[];
};

const PHASES: Phase[] = [
  {
    id: 1,
    title: '처음 한국어',
    subtitle: '가게 · 이동 · 주문 · 길',
    range: '1~5',
    units: [
      {
        n: 1,
        emoji: '🏪',
        title: '편의점에서 물건 사기',
        badge: '계산하기',
        expressions: ['이거 얼마예요?', '카드로 계산할게요', '봉투 필요 없어요'],
        result: '가격을 묻고 계산할 수 있어요.',
      },
      {
        n: 2,
        emoji: '🚇',
        title: '지하철 타기',
        badge: '이동하기',
        expressions: ['어디로 가요?', '몇 번 출구예요?', '여기 맞아요?'],
        result: '방향과 출구를 물을 수 있어요.',
      },
      {
        n: 3,
        emoji: '☕',
        title: '카페에서 주문하기',
        badge: '주문하기',
        expressions: ['아메리카노 주세요', '여기서 마실게요', '테이크아웃이요'],
        result: '원하는 음료를 말할 수 있어요.',
      },
      {
        n: 4,
        emoji: '🍜',
        title: '식당에서 음식 주문하기',
        badge: '음식 주문',
        expressions: ['이거 주세요', '추천해 주세요', '물 주세요'],
        result: '음식과 필요한 것을 말할 수 있어요.',
      },
      {
        n: 5,
        emoji: '🗺️',
        title: '길 묻기',
        badge: '위치 묻기',
        expressions: ['화장실 어디예요?', '어떻게 가요?', '가까워요?'],
        result: '위치와 길을 물을 수 있어요.',
      },
    ],
  },
  {
    id: 2,
    title: '생활 한국어',
    subtitle: '병원 · 약국 · 은행 · 쇼핑',
    range: '6~9',
    units: [
      {
        n: 6,
        emoji: '🏥',
        title: '병원에서 진료받기',
        badge: '증상 말하기',
        expressions: ['어디가 아파요?', '배가 아파요', '진료 받고 싶어요'],
        result: '아픈 곳과 증상을 말할 수 있어요.',
      },
      {
        n: 7,
        emoji: '💊',
        title: '약국에서 약 사기',
        badge: '약 사기',
        expressions: ['감기약 있어요?', '하루 몇 번 먹어요?', '식후에 먹어요?'],
        result: '약과 복용 방법을 물을 수 있어요.',
      },
      {
        n: 8,
        emoji: '🏦',
        title: '은행/ATM 이용하기',
        badge: '은행 업무',
        expressions: ['계좌 만들고 싶어요', '출금할게요', '송금할게요'],
        result: '계좌, 출금, 송금을 말할 수 있어요.',
      },
      {
        n: 9,
        emoji: '👕',
        title: '쇼핑몰에서 옷 사기',
        badge: '옷 사기',
        expressions: ['입어 봐도 돼요?', '다른 사이즈 있어요?', '조금 커요'],
        result: '사이즈와 착용을 말할 수 있어요.',
      },
    ],
  },
  {
    id: 3,
    title: '일상 한국어',
    subtitle: '수업 · 숙소 · 일정',
    range: '10~12',
    units: [
      {
        n: 10,
        emoji: '📚',
        title: '학원에서 질문하기',
        badge: '질문하기',
        expressions: ['질문 있어요', '다시 설명해 주세요', '이해했어요'],
        result: '질문하고 다시 물을 수 있어요.',
      },
      {
        n: 11,
        emoji: '🏠',
        title: '집/숙소 관련 표현',
        badge: '숙소 생활',
        expressions: ['체크인 할게요', '방에 문제가 있어요', '와이파이 돼요?'],
        result: '체크인과 문제를 말할 수 있어요.',
      },
      {
        n: 12,
        emoji: '🗓️',
        title: '일상 일정 말하기',
        badge: '일정 말하기',
        expressions: ['오늘 뭐 해요?', '내일 만나요', '지금 바빠요'],
        result: '오늘과 내일 일정을 말할 수 있어요.',
      },
    ],
  },
  {
    id: 4,
    title: '나에 대해 말하는 한국어',
    subtitle: '가족 · 취미 · 날씨',
    range: '13~15',
    units: [
      {
        n: 13,
        emoji: '👨‍👩‍👧',
        title: '가족/지인 소개',
        badge: '소개하기',
        expressions: ['저는 ___입니다', '우리 가족은 ___입니다', '친구가 많아요'],
        result: '가족과 친구를 소개할 수 있어요.',
        locked: true,
      },
      {
        n: 14,
        emoji: '🎬',
        title: '취미/여가 말하기',
        badge: '취미 말하기',
        expressions: ['영화를 좋아해요', '운동을 해요', '주말에 쉬어요'],
        result: '취미와 주말 활동을 말할 수 있어요.',
        locked: true,
      },
      {
        n: 15,
        emoji: '🌦️',
        title: '날씨/계절 표현',
        badge: '날씨 말하기',
        expressions: ['오늘은 더워요', '비가 와요', '그래서 집에 있어요'],
        result: '날씨와 이유를 말할 수 있어요.',
        locked: true,
      },
    ],
  },
];

function UnitCard({ unit }: { unit: Unit }) {
  const locked = !!unit.locked;
  return (
    <article
      style={{
        background: '#ffffff',
        border: '1px solid #e6ebf3',
        borderRadius: 22,
        padding: 22,
        boxShadow: '0 12px 28px rgba(20,37,63,0.055)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 상단: 이모지 + 번호 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 14,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 44,
            height: 44,
            borderRadius: 15,
            background: '#e6fbf8',
            display: 'grid',
            placeItems: 'center',
            fontSize: 23,
          }}
        >
          {unit.emoji}
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: '#94a3b8',
            paddingTop: 4,
          }}
        >
          {String(unit.n).padStart(2, '0')}
        </div>
      </div>

      {/* 제목 + 뱃지 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <h4
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#0f172a',
            letterSpacing: '-0.3px',
            margin: 0,
            minWidth: 0,
          }}
        >
          {unit.title}
        </h4>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#0b8178',
            background: '#e6fbf8',
            padding: '6px 10px',
            borderRadius: 999,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {locked ? '준비 중' : unit.badge}
        </span>
      </div>

      {/* 표현 리스트 */}
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: '0 0 14px',
          display: 'grid',
          gap: 6,
        }}
      >
        {unit.expressions.map((e, i) => (
          <li
            key={i}
            style={{
              fontSize: 14,
              color: '#334155',
              position: 'relative',
              paddingLeft: 18,
              lineHeight: 1.55,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 0,
                color: '#27d3c3',
                fontWeight: 800,
              }}
            >
              ✓
            </span>
            {e}
          </li>
        ))}
      </ul>

      {/* 결과 */}
      <div
        style={{
          marginTop: 'auto',
          fontSize: 14,
          color: '#526079',
          fontWeight: 600,
          lineHeight: 1.55,
        }}
      >
        {unit.result}
      </div>
    </article>
  );
}

export default function CurriculumSection() {
  // 초기: Phase 1 만 열림. 여러 개 동시 열림 허용.
  const [openPhases, setOpenPhases] = useState<Set<number>>(new Set([1]));

  // 규칙:
  // - 닫혀있는 Phase 클릭 → 해당 Phase 열림 (나머지 상태 유지)
  // - 열린 Phase 클릭 → 해당 Phase 닫힘 (나머지 상태 유지)
  // - 단, 마지막 1개 열린 Phase 는 닫히지 않음 (전부 닫힘 방지)
  const toggle = (id: number) => {
    const next = new Set(openPhases);
    if (next.has(id)) {
      if (next.size === 1) return;
      next.delete(id);
    } else {
      next.add(id);
    }
    setOpenPhases(next);
  };

  return (
    <section style={{ background: '#edf2f7', padding: '36px 0' }}>
      <div
        style={{ maxWidth: 1200, margin: '0 auto', padding: '0 56px' }}
        className="cur-inner"
      >
        <header style={{ marginBottom: 28 }}>
          <h2
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: '#122c4f',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            학습 목록
          </h2>
        </header>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
          }}
        >
          {PHASES.map((phase) => {
            const isOpen = openPhases.has(phase.id);
            return (
              <div key={phase.id}>
                <button
                  type="button"
                  onClick={() => toggle(phase.id)}
                  aria-expanded={isOpen}
                  className="cur-phase-head"
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 16,
                    background: '#122c4f',
                    border: 'none',
                    borderRadius: 22,
                    padding: '20px 22px',
                    boxShadow: '0 12px 28px rgba(20,37,63,0.15)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    marginBottom: 14,
                    color: '#ffffff',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <h3
                      style={{
                        fontSize: 22,
                        fontWeight: 700,
                        color: '#ffffff',
                        letterSpacing: '-0.5px',
                        margin: 0,
                      }}
                    >
                      {phase.title}
                    </h3>
                    <p
                      style={{
                        fontSize: 14,
                        color: 'rgba(255,255,255,0.7)',
                        margin: '4px 0 0',
                      }}
                    >
                      {phase.subtitle}
                    </p>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: '#122c4f',
                        background: '#27d3c3',
                        padding: '8px 13px',
                        borderRadius: 999,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {phase.range}
                    </span>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.12)',
                        color: '#ffffff',
                        fontSize: 14,
                        fontWeight: 900,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      ▾
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div
                    className="cur-grid"
                    role="region"
                    aria-label={`${phase.title} 유닛 목록`}
                  >
                    {phase.units.map((unit) => (
                      <UnitCard key={unit.n} unit={unit} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .cur-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 1024px) {
          .cur-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .cur-inner { padding: 0 20px !important; }
          .cur-grid { grid-template-columns: 1fr; }
          .cur-phase-head {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
        }
      `}</style>
    </section>
  );
}
