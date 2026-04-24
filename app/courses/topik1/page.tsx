import Link from 'next/link';
import { UnitAccordion, type Phase } from '../_unit-accordion';

const PHASES: Phase[] = [
  {
    number: 1,
    title: '처음 한국어',
    range: '1~5',
    units: [
      {
        number: 1,
        emoji: '🏪',
        title: '편의점에서 물건 사기',
        badge: '계산하기',
        expressions: ['이거 얼마예요?', '카드로 계산할게요', '봉투 필요 없어요'],
        result: '가격을 묻고 계산할 수 있어요',
      },
      {
        number: 2,
        emoji: '🚇',
        title: '지하철 타기',
        badge: '이동하기',
        expressions: ['어디로 가요?', '몇 번 출구예요?', '여기 맞아요?'],
        result: '방향과 출구를 물을 수 있어요',
      },
      {
        number: 3,
        emoji: '☕',
        title: '카페에서 주문하기',
        badge: '주문하기',
        expressions: ['아메리카노 주세요', '여기서 마실게요', '테이크아웃이요'],
        result: '원하는 음료를 말할 수 있어요',
      },
      {
        number: 4,
        emoji: '🍜',
        title: '식당에서 음식 주문하기',
        badge: '음식 주문',
        expressions: ['이거 주세요', '추천해 주세요', '물 주세요'],
        result: '음식과 필요한 것을 말할 수 있어요',
      },
      {
        number: 5,
        emoji: '🗺️',
        title: '길 묻기',
        badge: '위치 묻기',
        expressions: ['화장실 어디예요?', '어떻게 가요?', '가까워요?'],
        result: '위치와 길을 물을 수 있어요',
      },
    ],
  },
  {
    number: 2,
    title: '생활 한국어',
    range: '6~9',
    units: [
      {
        number: 6,
        emoji: '🏥',
        title: '병원에서 진료받기',
        badge: '증상 말하기',
        expressions: ['어디가 아파요?', '배가 아파요', '진료 받고 싶어요'],
        result: '아픈 곳과 증상을 말할 수 있어요',
      },
      {
        number: 7,
        emoji: '💊',
        title: '약국에서 약 사기',
        badge: '약 사기',
        expressions: ['감기약 있어요?', '하루 몇 번 먹어요?', '식후에 먹어요?'],
        result: '약과 복용 방법을 물을 수 있어요',
      },
      {
        number: 8,
        emoji: '🏦',
        title: '은행/ATM 이용하기',
        badge: '은행 업무',
        expressions: ['계좌 만들고 싶어요', '출금할게요', '송금할게요'],
        result: '계좌, 출금, 송금을 말할 수 있어요',
      },
      {
        number: 9,
        emoji: '👕',
        title: '쇼핑몰에서 옷 사기',
        badge: '옷 사기',
        expressions: ['입어 봐도 돼요?', '다른 사이즈 있어요?', '조금 커요'],
        result: '사이즈와 착용을 말할 수 있어요',
      },
    ],
  },
  {
    number: 3,
    title: '일상 한국어',
    range: '10~12',
    units: [
      {
        number: 10,
        emoji: '📚',
        title: '학원에서 질문하기',
        badge: '질문하기',
        expressions: ['질문 있어요', '다시 설명해 주세요', '이해했어요'],
        result: '질문하고 다시 물을 수 있어요',
      },
      {
        number: 11,
        emoji: '🏠',
        title: '집/숙소 관련 표현',
        badge: '숙소 생활',
        expressions: ['체크인 할게요', '방에 문제가 있어요', '와이파이 돼요?'],
        result: '체크인과 문제를 말할 수 있어요',
      },
      {
        number: 12,
        emoji: '🗓️',
        title: '일상 일정 말하기',
        badge: '일정 말하기',
        expressions: ['오늘 뭐 해요?', '내일 만나요', '지금 바빠요'],
        result: '오늘과 내일 일정을 말할 수 있어요',
      },
    ],
  },
  {
    number: 4,
    title: '나에 대해 말하는 한국어',
    range: '13~15',
    units: [
      {
        number: 13,
        emoji: '👨‍👩‍👧',
        title: '가족/지인 소개',
        badge: '소개하기',
        expressions: ['저는 ___입니다', '우리 가족은 ___입니다', '친구가 많아요'],
        result: '가족과 친구를 소개할 수 있어요',
      },
      {
        number: 14,
        emoji: '🎬',
        title: '취미/여가 말하기',
        badge: '취미 말하기',
        expressions: ['영화를 좋아해요', '운동을 해요', '주말에 쉬어요'],
        result: '취미와 주말 활동을 말할 수 있어요',
      },
      {
        number: 15,
        emoji: '🌦️',
        title: '날씨/계절 표현',
        badge: '날씨 말하기',
        expressions: ['오늘은 더워요', '비가 와요', '그래서 집에 있어요'],
        result: '날씨와 이유를 말할 수 있어요',
      },
    ],
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

export default function Topik1CoursePage() {
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
            TOPIK 1
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
            TOPIK 1 한국어 기초 과정
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
            하루 20분, 매일 반복 훈련으로 한국어 기초부터 탄탄하게.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
            <span style={LANG_BADGE}>🇻🇳 베트남어</span>
            <span style={LANG_BADGE}>🇺🇸 영어</span>
            <span style={LANG_BADGE}>🇨🇳 중국어</span>
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
            총 15개 유닛 · 4개 Phase로 구성
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
                7일 무료체험으로 TOPIK 1 첫 유닛을 경험해보세요
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
