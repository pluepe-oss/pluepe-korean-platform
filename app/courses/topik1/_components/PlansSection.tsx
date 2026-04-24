import Link from 'next/link';

type Feature = { before: string; highlight: string; after: string };

const BASIC_FEATURES: Feature[] = [
  { before: '전체 15유닛 ', highlight: '순차 학습', after: '' },
  { before: 'AI 회화 연습 유닛당 ', highlight: '3회', after: '' },
  { before: '완료 후 ', highlight: '모의고사', after: ' 1회' },
  { before: '', highlight: '기본 난이도', after: ' 문제' },
  { before: '', highlight: '학습 진도', after: ' 통계' },
];

const PREMIUM_FEATURES: Feature[] = [
  { before: '전체 ', highlight: '15유닛 순차 학습', after: '' },
  { before: 'AI 회화 연습 유닛당 ', highlight: '5회', after: '' },
  { before: '', highlight: '모의고사 3회', after: ' (진도 중 2회 + 최종)' },
  { before: '기본 + ', highlight: '심화 난이도 문제', after: '' },
  { before: '', highlight: '학습 진도 통계', after: '' },
];

function PriceBlock({
  monthly,
  yearly,
  accent,
}: {
  monthly: string;
  yearly: string;
  accent: 'mint' | 'orange';
}) {
  const pillBg = accent === 'mint' ? '#e6fbf8' : '#fff2ec';
  const pillText = accent === 'mint' ? '#1fb8aa' : '#e85a35';
  return (
    <div style={{ marginBottom: 22 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 6,
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 34, fontWeight: 900, color: '#122c4f' }}>
          ${monthly}
        </span>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>/월</span>
        <span style={{ fontSize: 11, color: '#64748b', marginLeft: 4 }}>
          월간구독
        </span>
      </div>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: pillBg,
          padding: '6px 12px',
          borderRadius: 8,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: pillText,
            letterSpacing: '0.05em',
          }}
        >
          연간구독
        </span>
        <span style={{ fontSize: 14, fontWeight: 800, color: '#122c4f' }}>
          ${yearly}
          <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>
            /월
          </span>
        </span>
      </div>
    </div>
  );
}

export default function PlansSection() {
  return (
    <section style={{ background: '#edf2f7', padding: '40px 0' }}>
      <div
        style={{ maxWidth: 1100, margin: '0 auto', padding: '0 56px' }}
        className="plans-inner"
      >
        <header style={{ textAlign: 'center', marginBottom: 36 }}>
          <h2
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: '#122c4f',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Basic vs Premium
          </h2>
        </header>

        <div className="plans-grid">
          {/* Basic */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 20,
              padding: '36px 32px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: '#27d3c3',
              }}
            />
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: -30,
                right: -30,
                width: 160,
                height: 160,
                borderRadius: '50%',
                background: '#e6fbf8',
                opacity: 0.6,
              }}
            />
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: '#e6fbf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 15,
                  }}
                >
                  🌿
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: '#1fb8aa',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                  }}
                >
                  BASIC
                </div>
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: '#122c4f',
                  marginBottom: 4,
                }}
              >
                차근차근 합격 루트
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: '#64748b',
                  marginBottom: 24,
                  lineHeight: 1.5,
                }}
              >
                부담 없이 시작하고 싶다면 Basic
              </div>

              <PriceBlock monthly="12.90" yearly="7.70" accent="mint" />

              <Link
                href="/pricing?product=topik1"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  background: '#ffffff',
                  color: '#1fb8aa',
                  border: '1.5px solid #27d3c3',
                  borderRadius: 12,
                  padding: '14px',
                  fontSize: 14,
                  fontWeight: 800,
                  marginBottom: 26,
                  textDecoration: 'none',
                  fontFamily: 'inherit',
                }}
              >
                Basic 시작하기
              </Link>

              <ul
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 13,
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                }}
              >
                {BASIC_FEATURES.map((f) => (
                  <li
                    key={f.highlight}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontSize: 13,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        color: '#27d3c3',
                        fontSize: 15,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </span>
                    <span style={{ color: '#122c4f', fontWeight: 500 }}>
                      {f.before}
                      <strong style={{ fontWeight: 800 }}>{f.highlight}</strong>
                      {f.after}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Premium */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 20,
              padding: '36px 32px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: '#ff7d5a',
              }}
            />
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: -30,
                right: -30,
                width: 160,
                height: 160,
                borderRadius: '50%',
                background: '#fff2ec',
                opacity: 0.7,
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 18,
                right: 18,
                background: '#ff7d5a',
                color: '#ffffff',
                padding: '5px 12px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.05em',
              }}
            >
              ⭐ 추천
            </div>

            <div style={{ position: 'relative' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: '#fff2ec',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 15,
                  }}
                >
                  🔥
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: '#e85a35',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                  }}
                >
                  PREMIUM
                </div>
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: '#122c4f',
                  marginBottom: 4,
                }}
              >
                빠르게, 확실하게
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: '#64748b',
                  marginBottom: 24,
                  lineHeight: 1.5,
                }}
              >
                시험 전 실전 감각을 미리 잡고 싶다면 Premium
              </div>

              <PriceBlock monthly="19.90" yearly="11.90" accent="orange" />

              {/* Basic 시작하기 버튼과 동일 구조, 컬러만 orange (추천 뱃지 톤) */}
              <Link
                href="/pricing?product=topik1"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  background: '#ffffff',
                  color: '#ff7d5a',
                  border: '1.5px solid #ff7d5a',
                  borderRadius: 12,
                  padding: '14px',
                  fontSize: 14,
                  fontWeight: 800,
                  marginBottom: 26,
                  textDecoration: 'none',
                  fontFamily: 'inherit',
                }}
              >
                Premium 구독하기 →
              </Link>

              <ul
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 13,
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                }}
              >
                {PREMIUM_FEATURES.map((f) => (
                  <li
                    key={f.highlight}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontSize: 13,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        color: '#ff7d5a',
                        fontSize: 15,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </span>
                    <span style={{ color: '#122c4f', fontWeight: 500 }}>
                      {f.before}
                      <strong style={{ fontWeight: 800 }}>{f.highlight}</strong>
                      {f.after}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .plans-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        @media (max-width: 900px) {
          .plans-inner { padding: 0 20px !important; }
          .plans-grid {
            grid-template-columns: 1fr;
            gap: 18px;
          }
        }
      `}</style>
    </section>
  );
}
