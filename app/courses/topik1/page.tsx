import Link from 'next/link';
import Hero from './_components/Hero';
import StepsSection from './_components/StepsSection';
import CurriculumSection from './_components/CurriculumSection';
import PlansSection from './_components/PlansSection';

export default function Topik1CoursePage() {
  return (
    <main
      style={{
        fontFamily: 'Arial, "Noto Sans KR", sans-serif',
        color: '#0f172a',
        background: '#edf2f7',
      }}
    >
      <Hero />
      <StepsSection />
      <CurriculumSection />
      <PlansSection />

      {/* 하단 navy CTA 배너 */}
      <section
        style={{
          background: '#122c4f',
          color: '#ffffff',
          padding: '28px 0',
        }}
      >
        <div
          className="topik1-bottom-cta"
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '0 56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: '#ffffff',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              지금 바로 시작하세요
            </h2>
            <p
              style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.72)',
                margin: '8px 0 0',
                lineHeight: 1.6,
              }}
            >
              7일 무료체험으로 TOPIK 1 첫 주제를 경험해보세요
            </p>
          </div>
          <Link
            href="/pricing?product=topik1"
            style={{
              background: '#ff7d5a',
              color: '#ffffff',
              padding: '16px 32px',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 800,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              boxShadow: '0 10px 24px rgba(255,125,90,0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              flexShrink: 0,
            }}
          >
            구독하기 <span style={{ fontSize: 18 }}>→</span>
          </Link>
        </div>
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 640px) {
              .topik1-bottom-cta {
                flex-direction: column !important;
                align-items: stretch !important;
                text-align: center;
                padding: 0 20px !important;
              }
            }
          `,
        }}
      />
    </main>
  );
}
