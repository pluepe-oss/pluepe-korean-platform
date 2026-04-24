import Image from 'next/image';

type Step = {
  n: number;
  title: string;
  color: string;
  desc1: string;
  desc2: string;
  img: string;
};

const STEPS: Step[] = [
  {
    n: 1,
    title: '세션',
    color: '#27d3c3',
    desc1: '주제별 강의 영상을 단계별로',
    desc2: '시청하며 핵심 표현을 익혀요.',
    img: '/images/steps/placeholder.svg',
  },
  {
    n: 2,
    title: '단어',
    color: '#3b82f6',
    desc1: '영상 속 핵심 단어의 뜻과',
    desc2: '발음을 집중적으로 학습해요.',
    img: '/images/steps/placeholder.svg',
  },
  {
    n: 3,
    title: '패턴',
    color: '#8b5cf6',
    desc1: '단어가 문장 안에서 어떻게',
    desc2: '쓰이는지 패턴으로 익혀요.',
    img: '/images/steps/placeholder.svg',
  },
  {
    n: 4,
    title: '테스트',
    color: '#f59e0b',
    desc1: '배운 단어와 표현을 문제로',
    desc2: '바로 확인해요.',
    img: '/images/steps/placeholder.svg',
  },
  {
    n: 5,
    title: 'AI 확장',
    color: '#ff7d5a',
    desc1: 'AI와 직접 대화하며 배운 표현을',
    desc2: '실전처럼 연습해요.',
    img: '/images/steps/placeholder.svg',
  },
];

export default function StepsSection() {
  return (
    <section style={{ background: '#edf2f7', padding: '36px 0' }}>
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 56px',
        }}
        className="steps-inner"
      >
        <div style={{ marginBottom: 36 }}>
          <h2
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: '#122c4f',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            학습 방식 5단계
          </h2>
        </div>

        <div className="steps-grid">
          {STEPS.map((s) => (
            <article
              key={s.n}
              className="step-card"
              style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: 16,
                padding: '22px 18px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  background: s.color,
                  opacity: 0.08,
                }}
              />
              <header
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 14,
                  position: 'relative',
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: s.color,
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {s.n}
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: '#122c4f',
                  }}
                >
                  {s.title}
                </div>
              </header>

              <div
                style={{
                  marginBottom: 14,
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16 / 11',
                  background: '#ffffff',
                  borderRadius: 10,
                  boxShadow: '0 8px 20px rgba(17,44,79,0.12)',
                  border: `2px solid ${s.color}30`,
                  overflow: 'hidden',
                }}
              >
                <Image
                  src={s.img}
                  alt={`${s.title} 단계 이미지`}
                  fill
                  style={{ objectFit: 'contain' }}
                  sizes="(max-width: 900px) 240px, 200px"
                />
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: '#64748b',
                  lineHeight: 1.55,
                  textAlign: 'center',
                }}
              >
                <p style={{ margin: 0 }}>
                  {s.desc1}
                  <br />
                  {s.desc2}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <style>{`
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 14px;
        }
        @media (max-width: 900px) {
          .steps-inner { padding: 0 20px !important; }
          .steps-grid {
            display: flex;
            overflow-x: auto;
            gap: 12px;
            padding-bottom: 8px;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
          }
          .step-card {
            flex: 0 0 240px;
            scroll-snap-align: start;
          }
        }
      `}</style>
    </section>
  );
}
