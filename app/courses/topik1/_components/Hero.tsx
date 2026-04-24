import Link from 'next/link';

export default function Hero() {
  return (
    <section
      style={{
        position: 'relative',
        background: '#122c4f',
        color: '#ffffff',
        padding: '32px 0',
        overflow: 'hidden',
      }}
    >
      {/* 배경 그리드 */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1200 340"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.07,
          pointerEvents: 'none',
        }}
      >
        <defs>
          <pattern id="heroGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0 L0 0 0 40" stroke="#fff" strokeWidth="0.5" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#heroGrid)" />
      </svg>

      {/* 컬러 블롭 */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: -60,
          top: -60,
          width: 420,
          height: 420,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(39,211,195,0.28) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: 320,
          bottom: -150,
          width: 340,
          height: 340,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(255,125,90,0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: -40,
          bottom: -80,
          width: 260,
          height: 260,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(251,191,36,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div className="hero-inner">
        {/* 좌측 텍스트 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(39,211,195,0.18)',
              color: '#27d3c3',
              padding: '6px 14px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.1em',
              marginBottom: 20,
              border: '1px solid rgba(39,211,195,0.3)',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#27d3c3',
              }}
            />
            TOPIK 1
          </div>
          {/* TODO: 상품명으로 교체 예정 */}
          <h1
            className="hero-title"
            style={{
              fontSize: 42,
              fontWeight: 900,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              margin: '0 0 14px',
            }}
          >
            TOPIK 1 한국어 기초 과정
          </h1>
          <p
            style={{
              fontSize: 15,
              color: 'rgba(255,255,255,0.72)',
              margin: '0 0 26px',
              lineHeight: 1.6,
              maxWidth: 520,
            }}
          >
            하루 20분, 매일 반복 훈련으로 한국어 기초부터 탄탄하게.
          </p>

          {/* 언어 지원 배지 */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 30,
              flexWrap: 'wrap',
            }}
          >
            {[
              { code: 'VN', label: '베트남어' },
              { code: 'US', label: '영어' },
              { code: 'CN', label: '중국어' },
            ].map((b) => (
              <div
                key={b.code}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  padding: '7px 12px 7px 7px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.85)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <span
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.7)',
                    padding: '3px 8px',
                    borderRadius: 999,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  {b.code}
                </span>
                {b.label}
              </div>
            ))}
          </div>

          <Link
            href="/pricing?product=topik1"
            style={{
              background: '#ff7d5a',
              color: '#ffffff',
              border: 0,
              borderRadius: 12,
              padding: '16px 32px',
              fontSize: 15,
              fontWeight: 800,
              boxShadow: '0 10px 24px rgba(255,125,90,0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              textDecoration: 'none',
              fontFamily: 'inherit',
            }}
          >
            구독하기 <span style={{ fontSize: 18 }}>→</span>
          </Link>
        </div>

        {/* 우측 가·나·다 카드 스택 */}
        <div
          aria-hidden="true"
          className="hero-stack"
          style={{
            flexShrink: 0,
            width: 380,
            height: 320,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 40,
              left: 40,
              width: 280,
              height: 240,
              background:
                'radial-gradient(ellipse, rgba(39,211,195,0.18) 0%, transparent 70%)',
            }}
          />
          {/* 가 */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 60,
              width: 165,
              height: 190,
              background: 'linear-gradient(145deg, #27d3c3 0%, #1fb8aa 100%)',
              borderRadius: 28,
              boxShadow: '0 20px 48px rgba(39,211,195,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: 'rotate(-6deg)',
              border: '2px solid rgba(255,255,255,0.15)',
            }}
          >
            <span
              style={{
                fontSize: 120,
                fontWeight: 900,
                color: '#ffffff',
                lineHeight: 1,
                letterSpacing: '-0.04em',
              }}
            >
              가
            </span>
          </div>
          {/* 나 */}
          <div
            style={{
              position: 'absolute',
              left: 130,
              top: 20,
              width: 140,
              height: 170,
              background: 'linear-gradient(145deg, #ff7d5a 0%, #e85a35 100%)',
              borderRadius: 24,
              boxShadow: '0 16px 40px rgba(255,125,90,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: 'rotate(4deg)',
              border: '2px solid rgba(255,255,255,0.15)',
            }}
          >
            <span
              style={{
                fontSize: 100,
                fontWeight: 900,
                color: '#ffffff',
                lineHeight: 1,
                letterSpacing: '-0.04em',
              }}
            >
              나
            </span>
          </div>
          {/* 다 */}
          <div
            style={{
              position: 'absolute',
              left: 250,
              top: 120,
              width: 120,
              height: 140,
              background: 'linear-gradient(145deg, #fbbf24 0%, #f59e0b 100%)',
              borderRadius: 22,
              boxShadow: '0 14px 32px rgba(251,191,36,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: 'rotate(-3deg)',
              border: '2px solid rgba(255,255,255,0.2)',
            }}
          >
            <span
              style={{
                fontSize: 80,
                fontWeight: 900,
                color: '#122c4f',
                lineHeight: 1,
                letterSpacing: '-0.04em',
              }}
            >
              다
            </span>
          </div>
          {/* 점 장식 */}
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 50,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#27d3c3',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              left: 60,
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#ff7d5a',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 100,
              right: 10,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#fbbf24',
            }}
          />
        </div>
      </div>

      <style>{`
        .hero-inner {
          position: relative;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 56px;
          display: flex;
          align-items: center;
          gap: 48px;
        }
        @media (max-width: 900px) {
          .hero-inner {
            flex-direction: column;
            align-items: flex-start;
            gap: 32px;
            padding: 0 20px;
          }
          .hero-title { font-size: 30px !important; }
          .hero-stack { display: none !important; }
        }
      `}</style>
    </section>
  );
}
