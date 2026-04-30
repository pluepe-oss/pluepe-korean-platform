'use client'
import { useTranslation } from '@/lib/useTranslation'

export default function TicketSection() {
  const { t } = useTranslation()

  return (
    <section className="tickets" id="pricing">
      <div className="tickets-container">
        <span className="tickets-eyebrow">{t('tickets.eyebrow')}</span>
        <h2 className="tickets-title">지금 바로 시작할 수 있습니다</h2>
        <p className="tickets-desc">
          목표로 선택한 과정을 우선 7일 동안 무료 체험하고, 가볍게 월간으로 시작하세요.
        </p>

        <div className="tickets-grid">
          <div className="ticket-card">
            <div className="ticket-head">
              <h3 className="ticket-name">7일 무료체험</h3>
              <div className="ticket-price">$0 <small>/ 7일</small></div>
            </div>
            <ul className="ticket-features">
              <li>오늘의 학습 주제 1 무료 체험</li>
              <li>학습 방식 체험 확인</li>
              <li style={{ color: '#ff7d5a', fontWeight: 700 }}>카드 등록 없이 바로 시작</li>
              <li style={{ color: '#ff7d5a', fontWeight: 700 }}>실제 학습 체험 후 결제</li>
            </ul>
            <a href="/free-trial" className="ticket-btn ticket-btn-outline">7일 무료 체험하기</a>
          </div>

          <div className="ticket-card ticket-card-primary">
            <span className="ticket-badge">추천</span>
            <div className="ticket-head">
              <h3 className="ticket-name">TOPIK 1 Standard</h3>
              <div className="ticket-price">$12.90 <small>/ 월</small></div>
            </div>
            <ul className="ticket-features">
              <li>TOPIK 1 전체 15주제 제공</li>
              <li>오늘의 학습 (5단계 학습)</li>
              <li>반복학습 프로그램</li>
              <li>AI 확장 : 주제당 3회</li>
            </ul>
            <a href="/free-trial?plan=standard" className="ticket-btn ticket-btn-primary">7일 무료 체험하기</a>
          </div>

          <div className="ticket-card">
            <div className="ticket-head">
              <h3 className="ticket-name">TOPIK 1 Premium</h3>
              <div className="ticket-price">$19.90 <small>/ 월</small></div>
            </div>
            <ul className="ticket-features">
              <li>Standard 혜택 전체 제공</li>
              <li>반복 학습 프로그램</li>
              <li>AI 확장 : 주제당 5회</li>
              <li>모의고사 1회 + 약점 분석</li>
            </ul>
            <a href="/free-trial?plan=premium" className="ticket-btn ticket-btn-outline">Premium 시작하기</a>
          </div>
        </div>

        <div className="lang-box">
          <p className="lang-box-title">과정을 고른 후, 원하는 언어를 선택합니다.</p>
          <div className="lang-groups">
            <div className="lang-group">
              <span className="lang-group-label">TOPIK 1 · TOPIK 2</span>
              <div className="lang-chips">
                <span className="lang-chip">VN 베트남어</span>
                <span className="lang-chip">EN 영어</span>
                <span className="lang-chip">CN 중국어</span>
              </div>
            </div>
            <div className="lang-group">
              <span className="lang-group-label">EPS-TOPIK</span>
              <div className="lang-chips">
                <span className="lang-chip">VN 베트남어</span>
                <span className="lang-chip">ID 인도네시아어</span>
                <span className="lang-chip">TH 태국어</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .tickets {
          background: #edf2f7;
          margin: 0;
        }
        .tickets-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 80px 80px;
          box-sizing: border-box;
        }
        .tickets-eyebrow {
          display: block;
          color: #27d3c3;
          font-weight: 900;
          font-size: 13px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        .tickets-title {
          font-size: 42px;
          font-weight: 700;
          letter-spacing: -0.04em;
          margin: 0;
          color: #0f172a;
          line-height: 1.15;
          font-family: Arial, "Noto Sans KR", sans-serif;
        }
        .tickets-desc {
          margin: 12px 0 36px;
          color: #64748b;
          font-size: 16px;
        }
        .tickets-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
          align-items: stretch;
        }
        .ticket-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 22px;
          padding: 32px 28px;
          position: relative;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
          display: flex;
          flex-direction: column;
        }
        .ticket-card-primary {
          border: 2px solid #27d3c3;
        }
        .ticket-badge {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          background: #27d3c3;
          color: #122c4f;
          font-size: 12px;
          font-weight: 900;
          padding: 5px 16px;
          border-radius: 999px;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }
        .ticket-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          gap: 10px;
        }
        .ticket-name {
          margin: 0;
          font-size: 20px;
          font-weight: 900;
          letter-spacing: -0.03em;
          color: #0f172a;
        }
        .ticket-price {
          font-size: 22px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.04em;
          white-space: nowrap;
        }
        .ticket-price small {
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
        }
        .ticket-features {
          list-style: none;
          padding: 0;
          margin: 0 0 8px;
          display: grid;
          gap: 10px;
        }
        .ticket-features li {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #64748b;
          font-size: 14px;
        }
        .ticket-features li::before {
          content: '';
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #27d3c3;
          flex: 0 0 auto;
        }
        .ticket-btn {
          display: block;
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 800;
          text-align: center;
          text-decoration: none;
          cursor: pointer;
          margin-top: 20px;
          transition: transform 0.15s;
          box-sizing: border-box;
        }
        .ticket-btn:hover {
          transform: translateY(-2px);
        }
        .ticket-btn-primary {
          background: #122c4f;
          color: #ffffff;
        }
        .ticket-btn-outline {
          background: #ffffff;
          color: #122c4f;
          border: 1.5px solid #122c4f;
        }

        .lang-box {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 22px;
          padding: 28px 32px;
          margin-top: 24px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
        }
        .lang-box-title {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 20px;
        }
        .lang-groups {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .lang-group {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 14px 18px;
        }
        .lang-group-label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 10px;
        }
        .lang-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .lang-chip {
          background: rgba(39, 211, 195, 0.12);
          color: #0e8b76;
          border: 1px solid rgba(39, 211, 195, 0.2);
          border-radius: 999px;
          padding: 5px 12px;
          font-size: 13px;
          font-weight: 700;
        }

        @media (max-width: 768px) {
          .tickets-container {
            padding: 48px 20px;
          }
          .tickets-grid {
            grid-template-columns: 1fr;
          }
          .lang-groups {
            grid-template-columns: 1fr;
          }
          .lang-box {
            padding: 20px;
          }
        }
      `}</style>
    </section>
  )
}
