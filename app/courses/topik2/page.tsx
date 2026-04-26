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

// PRD v7 §3 — TOPIK 2 총 20 주제 · 4 Phase 구성.
// 실제 콘텐츠는 Phase 1 에 2개 샘플만 공개, 나머지는 "준비 중" placeholder.
const PHASES: Phase[] = [
  {
    number: 1,
    title: '읽기와 이해',
    range: '1~5',
    units: [
      {
        number: 1,
        emoji: '📰',
        title: '사회 현상 읽기',
        badge: '독해',
        expressions: ['신문을 읽어요', '내용을 이해해요', '요약할 수 있어요'],
        result: '사회 주제 지문을 읽을 수 있어요',
      },
      {
        number: 2,
        emoji: '✏️',
        title: '문장 확장 쓰기',
        badge: '작문',
        expressions: ['문장을 연결해요', '이유를 설명해요', '의견을 써요'],
        result: '문장을 길게 쓸 수 있어요',
      },
      ...makeLocked(3, 3),
    ],
  },
  {
    number: 2,
    title: '표현과 문법',
    range: '6~10',
    units: makeLocked(6, 5),
  },
  {
    number: 3,
    title: '듣기와 말하기',
    range: '11~15',
    units: makeLocked(11, 5),
  },
  {
    number: 4,
    title: '쓰기와 실전',
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

// 하단 전용 orange CTA — 화면당 1개만 사용.
const CTA_ORANGE: React.CSSProperties = {
  display: 'inline-block',
  background: '#ff7d5a',
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: 12,
  fontSize: 15,
  fontWeight: 700,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};

// Hero 용 secondary 버튼 — mint outline (orange 1개 규칙 보호).
const CTA_SECONDARY: React.CSSProperties = {
  display: 'inline-block',
  background: 'transparent',
  color: '#27d3c3',
  border: '1.5px solid #27d3c3',
  padding: '12px 28px',
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 700,
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
  .cx-table tbody td:nth-child(3) { color: #1fb8aa; font-weight: 600; }
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

function ContentPendingBanner() {
  return (
    <section style={{ padding: '32px 0 0' }}>
      <div className="cx-container">
        <div
          role="status"
          style={{
            background: 'rgba(39,211,195,0.1)',
            border: '1px solid rgba(39,211,195,0.35)',
            borderRadius: 22,
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
          }}
        >
          <span aria-hidden style={{ fontSize: 22 }}>🏗️</span>
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: '#0b8178',
                marginBottom: 4,
              }}
            >
              콘텐츠 준비 중
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: '#334155',
                lineHeight: 1.6,
              }}
            >
              TOPIK 2 주제는 순차적으로 공개됩니다. 핵심 차별점인 AI 쓰기 첨삭 기능을
              먼저 경험하고 싶다면 아래에서 구독을 시작해 주세요.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Topik2CoursePage() {
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

      {/* Hero */}
      <section style={{ background: '#122c4f', color: '#ffffff', padding: '72px 0' }}>
        <div className="cx-container">
          <span
            style={{
              display: 'inline-block',
              padding: '6px 14px',
              borderRadius: 999,
              background: 'rgba(39,211,195,0.18)',
              color: '#27d3c3',
              fontSize: 13,
              fontWeight: 800,
              marginBottom: 18,
              letterSpacing: '0.4px',
              border: '1px solid rgba(39,211,195,0.3)',
            }}
          >
            TOPIK 2
          </span>
          <h1
            className="cx-hero-title"
            style={{
              fontSize: 36,
              fontWeight: 800,
              margin: 0,
              marginBottom: 12,
              letterSpacing: '-0.4px',
            }}
          >
            TOPIK 2 한국어 기초 과정
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
            중·고급 어휘와 실전 표현, 그리고 AI 쓰기 첨삭으로 TOPIK 2 합격을 준비하세요.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
            <span style={LANG_BADGE}>🇻🇳 베트남어</span>
            <span style={LANG_BADGE}>🇺🇸 영어</span>
            <span style={LANG_BADGE}>🇨🇳 중국어</span>
          </div>
          <Link href="/pricing?product=topik2" style={CTA_SECONDARY}>
            자세히 보기
          </Link>
        </div>
      </section>

      {/* 콘텐츠 준비 중 배너 */}
      <ContentPendingBanner />

      {/* 학습 방식 5단계 */}
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
            <StepCard num="⑤" title="AI 쓰기 첨삭" desc="TOPIK 2 서술형 대비" />
          </div>
        </div>
      </section>

      {/* 학습 목록 (4 Phase 아코디언) */}
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
            총 20개 주제 · 4개 Phase로 구성
          </p>
          <UnitAccordion phases={PHASES} />
        </div>
      </section>

      {/* Basic vs Premium (AI 쓰기 첨삭 강조) */}
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
                  <td>주제 접근</td>
                  <td>순차 학습</td>
                  <td>자유 선택</td>
                </tr>
                <tr>
                  <td>AI 쓰기 첨삭</td>
                  <td>주제당 3회</td>
                  <td>주제당 5회 + 학습 로그</td>
                </tr>
                <tr>
                  <td>모의고사</td>
                  <td>1회 (완료 후)</td>
                  <td>3회 (진도 중 2회 + 최종)</td>
                </tr>
                <tr>
                  <td>쓰기 연습</td>
                  <td>주관식 기본형</td>
                  <td>주관식 + 서술형 + 첨삭</td>
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

      {/* 하단 CTA (화면당 유일한 orange CTA) */}
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
                7일 무료체험으로 TOPIK 2 첫 주제과 AI 쓰기 첨삭을 경험해보세요
              </p>
            </div>
            <Link href="/pricing?product=topik2" style={CTA_ORANGE}>
              7일 무료로 시작하기 →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
