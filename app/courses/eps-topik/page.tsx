import Link from 'next/link';
import { UnitAccordion, type Phase, type Unit } from '../_unit-accordion';

function makeLocked(start: number, count: number): Unit[] {
  return Array.from({ length: count }, (_, i) => ({
    number: start + i,
    emoji: '⏳',
    title: '준비 중',
    badge: '',
    expressions: [],
    result: '곧 열립니다',
    locked: true,
  }));
}

const PHASES: Phase[] = [
  {
    number: 1,
    title: '작업장 기초',
    range: '1~5',
    units: [
      {
        number: 1,
        emoji: '⛑️',
        title: '작업장 안전 표현',
        badge: '안전',
        expressions: ['위험해요', '조심하세요', '안전모 쓰세요'],
        result: '작업장 안전 표현을 말할 수 있어요',
      },
      {
        number: 2,
        emoji: '🏭',
        title: '공장 업무 지시',
        badge: '업무 지시',
        expressions: ['이거 해주세요', '다시 해요', '완료했어요'],
        result: '업무 지시를 이해할 수 있어요',
      },
      ...makeLocked(3, 3),
    ],
  },
  {
    number: 2,
    title: '생활과 이동',
    range: '6~10',
    units: makeLocked(6, 5),
  },
  {
    number: 3,
    title: '업무 심화',
    range: '11~15',
    units: makeLocked(11, 5),
  },
  {
    number: 4,
    title: '시험 대비',
    range: '16~20',
    units: makeLocked(16, 5),
  },
];

const CARD_STYLE = {
  background: '#ffffff',
  borderRadius: 22,
  boxShadow: '0 12px 30px rgba(15,23,42,0.08)',
  padding: 24,
} as const;

const LANG_BADGE: React.CSSProperties = {
  display: 'inline-block',
  padding: '7px 14px',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.14)',
  border: '1px solid rgba(255,255,255,0.22)',
  fontSize: 13,
  fontWeight: 600,
  color: '#ffffff',
};

const CTA_ORANGE: React.CSSProperties = {
  display: 'inline-block',
  background: '#ff7d5a',
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: 12,
  fontSize: 15,
  fontWeight: 600,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};

const RESPONSIVE_CSS = `
  .cx-container { max-width: 1280px; margin: 0 auto; padding: 0 80px; }
  @media (max-width: 768px) {
    .cx-container { padding: 0 20px; }
    .cx-steps-grid { grid-template-columns: 1fr !important; }
    .cx-cta-box { flex-direction: column !important; align-items: stretch !important; text-align: center; }
    .cx-hero-title { font-size: 24px !important; }
  }
  .cx-table { width: 100%; border-collapse: collapse; font-size: 15px; }
  .cx-table th, .cx-table td { padding: 14px 16px; border-bottom: 1px solid #e2e8f0; text-align: left; }
  .cx-table thead th { background: #122c4f; color: #ffffff; font-weight: 600; }
  .cx-table tbody tr:last-child td { border-bottom: none; }
`;

function StepCard({
  num,
  title,
  desc,
}: {
  num: string;
  title: string;
  desc: string;
}) {
  return (
    <div style={CARD_STYLE}>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#27d3c3', marginBottom: 8 }}>
        {num}
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 14, color: '#64748b' }}>{desc}</div>
    </div>
  );
}

export default function EpsTopikCoursePage() {
  return (
    <div
      style={{
        background: '#edf2f7',
        minHeight: '100vh',
        fontFamily: 'Arial, "Noto Sans KR", sans-serif',
        color: '#0f172a',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: RESPONSIVE_CSS }} />

      <section style={{ background: '#122c4f', color: '#ffffff', padding: '72px 0' }}>
        <div className="cx-container">
          <span
            style={{
              display: 'inline-block',
              padding: '6px 14px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.15)',
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 18,
              letterSpacing: '0.4px',
            }}
          >
            EPS-TOPIK
          </span>
          <h1
            className="cx-hero-title"
            style={{
              fontSize: 28,
              fontWeight: 700,
              margin: 0,
              marginBottom: 12,
              letterSpacing: '-0.4px',
            }}
          >
            EPS-TOPIK 고용허가제 시험 대비 과정
          </h1>
          <p
            style={{
              fontSize: 17,
              opacity: 0.83,
              margin: 0,
              marginBottom: 24,
              maxWidth: 680,
              lineHeight: 1.6,
            }}
          >
            작업장과 생활에서 쓰이는 실전 한국어, 업종별 회화까지 한 번에.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
            <span style={LANG_BADGE}>🇻🇳 베트남어</span>
            <span style={LANG_BADGE}>🇺🇸 영어</span>
            <span style={LANG_BADGE}>🇮🇩 인도네시아어</span>
          </div>
          <Link href="/pricing" style={CTA_ORANGE}>
            구독하기 →
          </Link>
        </div>
      </section>

      <section style={{ padding: '64px 0 32px' }}>
        <div className="cx-container">
          <h2
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: '#0f172a',
              margin: 0,
              marginBottom: 24,
            }}
          >
            학습 방식 5단계
          </h2>
          <div
            className="cx-steps-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 16,
            }}
          >
            <StepCard num="①" title="세션" desc="영상으로 상황 학습" />
            <StepCard num="②" title="단어" desc="핵심 단어 암기" />
            <StepCard num="③" title="패턴" desc="문장 패턴 훈련" />
            <StepCard num="④" title="테스트" desc="실력 확인" />
            <StepCard num="⑤" title="AI 확장" desc="AI와 회화 연습" />
          </div>
        </div>
      </section>

      <section style={{ padding: '32px 0' }}>
        <div className="cx-container">
          <h2
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: '#0f172a',
              margin: 0,
              marginBottom: 8,
            }}
          >
            학습 목록
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0, marginBottom: 24 }}>
            총 20개 유닛 · 4개 Phase로 구성
          </p>
          <UnitAccordion phases={PHASES} />
        </div>
      </section>

      <section style={{ padding: '32px 0' }}>
        <div className="cx-container">
          <h2
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: '#0f172a',
              margin: 0,
              marginBottom: 24,
            }}
          >
            Basic vs Premium
          </h2>
          <div style={{ ...CARD_STYLE, padding: 0, overflow: 'hidden' }}>
            <table className="cx-table">
              <thead>
                <tr>
                  <th>혜택</th>
                  <th>Basic</th>
                  <th>Premium</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>유닛 접근</td>
                  <td>순차 학습</td>
                  <td>자유 선택</td>
                </tr>
                <tr>
                  <td>AI 연습</td>
                  <td>유닛당 3회</td>
                  <td>유닛당 5회 + 학습 로그</td>
                </tr>
                <tr>
                  <td>모의고사</td>
                  <td>1회 (완료 후)</td>
                  <td>3회 (진도 중 2회 + 최종)</td>
                </tr>
                <tr>
                  <td>학습 리포트</td>
                  <td>기본 통계</td>
                  <td>오답 노트 + PDF</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section style={{ padding: '32px 0 80px' }}>
        <div className="cx-container">
          <div
            className="cx-cta-box"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 20,
              background: '#122c4f',
              color: '#ffffff',
              borderRadius: 22,
              padding: '40px 48px',
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  margin: 0,
                  marginBottom: 6,
                  letterSpacing: '-0.3px',
                }}
              >
                지금 바로 시작하세요
              </h2>
              <p
                style={{
                  color: 'rgba(255,255,255,0.74)',
                  fontSize: 15,
                  margin: 0,
                }}
              >
                7일 무료체험으로 EPS-TOPIK 첫 유닛을 경험해보세요
              </p>
            </div>
            <Link href="/pricing" style={CTA_ORANGE}>
              구독하기 →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
