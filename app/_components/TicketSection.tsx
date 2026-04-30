'use client'
import { useState } from 'react'
import { useTranslation } from '@/lib/useTranslation'

export default function TicketSection() {
  useTranslation()
  const [activeTab, setActiveTab] = useState<'topik1' | 'topik2' | 'eps'>('topik1')

  return (
    <section className="tickets" id="pricing">
      <div className="tickets-container">

        <span className="tickets-eyebrow">수강권안내</span>
        <h2 className="tickets-title">지금 바로 시작할 수 있습니다</h2>
        <p className="tickets-desc">목표로 선택한 과정을 우선 7일 동안 무료 체험하고, 가볍게 월간으로 시작하세요.</p>

        <div className="free-banner">
          <div className="free-banner-left">
            <span className="free-banner-badge">무료체험</span>
            <strong className="free-banner-title">7일 무료체험 — 카드 등록 없이 시작</strong>
            <p className="free-banner-desc">
              모든 과정 유닛 1을 무료로 체험할 수 있습니다.
              <span className="free-banner-highlight"> 카드 등록 없이 바로 시작</span>하고,
              <span className="free-banner-highlight"> 실제 학습 체험 후 결제</span>하세요.
            </p>
          </div>
          <a href="/auth/signup" className="free-banner-btn">7일 무료 체험하기 →</a>
        </div>

        <div className="ticket-tabs">
          <button
            className={`ticket-tab ${activeTab === 'topik1' ? 'active' : ''}`}
            onClick={() => setActiveTab('topik1')}
            style={
              activeTab === 'topik1'
                ? { background: '#27d3c3', color: '#ffffff' }
                : { background: '#ffffff', color: '#64748b' }
            }
          >
            TOPIK 1
          </button>
          <button
            className={`ticket-tab ${activeTab === 'topik2' ? 'active' : ''}`}
            onClick={() => setActiveTab('topik2')}
            style={
              activeTab === 'topik2'
                ? { background: '#122c4f', color: '#ffffff' }
                : { background: '#ffffff', color: '#64748b' }
            }
          >
            TOPIK 2
          </button>
          <button
            className={`ticket-tab ${activeTab === 'eps' ? 'active' : ''}`}
            onClick={() => setActiveTab('eps')}
            style={
              activeTab === 'eps'
                ? { background: '#ff7d5a', color: '#ffffff' }
                : { background: '#ffffff', color: '#64748b' }
            }
          >
            EPS-TOPIK
          </button>
        </div>

        {activeTab === 'topik1' && (
          <div className="tickets-grid">
            <div className="ticket-card ticket-card-primary" style={{ borderTop: '4px solid #27d3c3', borderColor: '#27d3c3' }}>
              <span className="ticket-badge" style={{ background: '#27d3c3' }}>추천</span>
              <div className="ticket-head">
                <h3 className="ticket-name">TOPIK 1 Standard</h3>
                <div className="ticket-price">$12.90 <small>/ 월</small></div>
              </div>
              <ul className="ticket-features">
                <li><span style={{ color: '#27d3c3', fontWeight: 900, flexShrink: 0 }}>✓</span>TOPIK 1 전체 15주제 제공</li>
                <li><span style={{ color: '#27d3c3', fontWeight: 900, flexShrink: 0 }}>✓</span>오늘의 학습 (5단계 학습)</li>
                <li><span style={{ color: '#27d3c3', fontWeight: 900, flexShrink: 0 }}>✓</span>반복학습 프로그램</li>
                <li><span style={{ color: '#27d3c3', fontWeight: 900, flexShrink: 0 }}>✓</span>AI 확장 : 주제당 3회</li>
              </ul>
              <a href="/auth/signup?plan=topik1-standard" className="ticket-btn ticket-btn-navy" style={{ border: '1.5px solid #27d3c3', color: '#27d3c3' }}>Standard 시작하기 →</a>
            </div>
            <div className="ticket-card" style={{ borderTop: '4px solid #27d3c3' }}>
              <div className="ticket-head">
                <h3 className="ticket-name">TOPIK 1 Premium</h3>
                <div className="ticket-price">$19.90 <small>/ 월</small></div>
              </div>
              <ul className="ticket-features">
                <li><span style={{ color: '#27d3c3', fontWeight: 900, flexShrink: 0 }}>✓</span>Standard 혜택 전체 제공</li>
                <li><span style={{ color: '#27d3c3', fontWeight: 900, flexShrink: 0 }}>✓</span>반복 학습 프로그램</li>
                <li><span style={{ color: '#27d3c3', fontWeight: 900, flexShrink: 0 }}>✓</span>AI 확장 : 주제당 5회</li>
                <li><span style={{ color: '#27d3c3', fontWeight: 900, flexShrink: 0 }}>✓</span>모의고사 1회 + 약점 분석</li>
              </ul>
              <a href="/auth/signup?plan=topik1-premium" className="ticket-btn ticket-btn-navy" style={{ border: '1.5px solid #27d3c3', color: '#27d3c3' }}>Premium으로 시작하기 →</a>
            </div>
          </div>
        )}

        {activeTab === 'topik2' && (
          <div className="tickets-grid">
            <div className="ticket-card ticket-card-primary" style={{ borderTop: '4px solid #122c4f', borderColor: '#122c4f' }}>
              <span className="ticket-badge" style={{ background: '#122c4f' }}>추천</span>
              <div className="ticket-head">
                <h3 className="ticket-name">TOPIK 2 Standard</h3>
                <div className="ticket-price">$14.90 <small>/ 월</small></div>
              </div>
              <ul className="ticket-features">
                <li><span style={{ color: '#122c4f', fontWeight: 900, flexShrink: 0 }}>✓</span>TOPIK 2 전체 20주제 제공</li>
                <li><span style={{ color: '#122c4f', fontWeight: 900, flexShrink: 0 }}>✓</span>오늘의 학습 (5단계 학습)</li>
                <li><span style={{ color: '#122c4f', fontWeight: 900, flexShrink: 0 }}>✓</span>반복학습 프로그램</li>
                <li><span style={{ color: '#122c4f', fontWeight: 900, flexShrink: 0 }}>✓</span>AI 확장 : 주제당 3회</li>
              </ul>
              <a href="/auth/signup?plan=topik2-standard" className="ticket-btn ticket-btn-navy" style={{ border: '1.5px solid #122c4f', color: '#122c4f' }}>Standard 시작하기 →</a>
            </div>
            <div className="ticket-card" style={{ borderTop: '4px solid #122c4f' }}>
              <div className="ticket-head">
                <h3 className="ticket-name">TOPIK 2 Premium</h3>
                <div className="ticket-price">$21.90 <small>/ 월</small></div>
              </div>
              <ul className="ticket-features">
                <li><span style={{ color: '#122c4f', fontWeight: 900, flexShrink: 0 }}>✓</span>Standard 혜택 전체 제공</li>
                <li><span style={{ color: '#122c4f', fontWeight: 900, flexShrink: 0 }}>✓</span>반복 학습 프로그램</li>
                <li><span style={{ color: '#122c4f', fontWeight: 900, flexShrink: 0 }}>✓</span>AI 확장 : 주제당 5회</li>
                <li><span style={{ color: '#122c4f', fontWeight: 900, flexShrink: 0 }}>✓</span>모의고사 1회 + 약점 분석</li>
              </ul>
              <a href="/auth/signup?plan=topik2-premium" className="ticket-btn ticket-btn-navy" style={{ border: '1.5px solid #122c4f', color: '#122c4f' }}>Premium으로 시작하기 →</a>
            </div>
          </div>
        )}

        {activeTab === 'eps' && (
          <div className="tickets-grid">
            <div className="ticket-card ticket-card-primary" style={{ borderTop: '4px solid #ff7d5a', borderColor: '#ff7d5a' }}>
              <span className="ticket-badge" style={{ background: '#ff7d5a' }}>추천</span>
              <div className="ticket-head">
                <h3 className="ticket-name">EPS-TOPIK Standard</h3>
                <div className="ticket-price">$13.90 <small>/ 월</small></div>
              </div>
              <ul className="ticket-features">
                <li><span style={{ color: '#ff7d5a', fontWeight: 900, flexShrink: 0 }}>✓</span>EPS-TOPIK 전체 20주제 제공</li>
                <li><span style={{ color: '#ff7d5a', fontWeight: 900, flexShrink: 0 }}>✓</span>오늘의 학습 (5단계 학습)</li>
                <li><span style={{ color: '#ff7d5a', fontWeight: 900, flexShrink: 0 }}>✓</span>반복학습 프로그램</li>
                <li><span style={{ color: '#ff7d5a', fontWeight: 900, flexShrink: 0 }}>✓</span>AI 확장 : 주제당 3회</li>
              </ul>
              <a href="/auth/signup?plan=eps-standard" className="ticket-btn ticket-btn-navy" style={{ border: '1.5px solid #ff7d5a', color: '#ff7d5a' }}>Standard 시작하기 →</a>
            </div>
            <div className="ticket-card" style={{ borderTop: '4px solid #ff7d5a' }}>
              <div className="ticket-head">
                <h3 className="ticket-name">EPS-TOPIK Premium</h3>
                <div className="ticket-price">$20.90 <small>/ 월</small></div>
              </div>
              <ul className="ticket-features">
                <li><span style={{ color: '#ff7d5a', fontWeight: 900, flexShrink: 0 }}>✓</span>Standard 혜택 전체 제공</li>
                <li><span style={{ color: '#ff7d5a', fontWeight: 900, flexShrink: 0 }}>✓</span>반복 학습 프로그램</li>
                <li><span style={{ color: '#ff7d5a', fontWeight: 900, flexShrink: 0 }}>✓</span>AI 확장 : 주제당 5회</li>
                <li><span style={{ color: '#ff7d5a', fontWeight: 900, flexShrink: 0 }}>✓</span>모의고사 1회 + 약점 분석</li>
              </ul>
              <a href="/auth/signup?plan=eps-premium" className="ticket-btn ticket-btn-navy" style={{ border: '1.5px solid #ff7d5a', color: '#ff7d5a' }}>Premium으로 시작하기 →</a>
            </div>
          </div>
        )}

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
          position: relative;
          z-index: 1;
        }
        .tickets-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 80px 80px;
        }
        .tickets-eyebrow {
          display: block;
          color: #27d3c3;
          font-weight: 900;
          font-size: 13px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .tickets-title {
          font-size: 42px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.04em;
          margin: 0 0 12px;
        }
        .tickets-desc {
          font-size: 16px;
          color: #64748b;
          margin: 0 0 32px;
        }

        .free-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          background: #122c4f;
          border-radius: 22px;
          padding: 28px 36px;
          margin-bottom: 32px;
        }
        .free-banner-left {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .free-banner-badge {
          display: inline-flex;
          background: #27d3c3;
          color: #122c4f;
          font-size: 12px;
          font-weight: 900;
          padding: 4px 12px;
          border-radius: 999px;
          width: fit-content;
        }
        .free-banner-title {
          font-size: 20px;
          font-weight: 900;
          color: #ffffff;
        }
        .free-banner-desc {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          line-height: 1.6;
        }
        .free-banner-highlight {
          color: #27d3c3;
          font-weight: 700;
        }
        .free-banner-btn {
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
          padding: 14px 28px;
          border-radius: 999px;
          background: #ff7d5a;
          color: #ffffff;
          font-size: 15px;
          font-weight: 800;
          text-decoration: none;
          transition: opacity 0.15s;
          flex-shrink: 0;
        }
        .free-banner-btn:hover {
          opacity: 0.85;
        }

        .ticket-tabs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 28px;
          background: #ffffff;
        }
        .ticket-tab {
          padding: 14px 0;
          text-align: center;
          background: #ffffff;
          color: #64748b;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          border-right: 1px solid #e2e8f0;
          transition: all 0.15s;
          width: 100%;
        }
        .ticket-tab:last-child {
          border-right: none;
        }
        .ticket-tab:hover {
          color: #122c4f;
          background: #f8fafc;
        }

        .tickets-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }
        .ticket-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 22px;
          padding: 32px 28px;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
          position: relative;
          box-sizing: border-box;
        }
        .ticket-card-primary {
          border-width: 2px;
        }
        .ticket-badge {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          color: #ffffff;
          font-size: 12px;
          font-weight: 900;
          padding: 5px 16px;
          border-radius: 999px;
          white-space: nowrap;
        }
        .ticket-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }
        .ticket-name {
          font-size: 18px;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
        }
        .ticket-price {
          font-size: 20px;
          font-weight: 900;
          color: #0f172a;
          white-space: nowrap;
        }
        .ticket-price small {
          font-size: 13px;
          color: #64748b;
          font-weight: 600;
        }
        .ticket-features {
          list-style: none;
          margin: 0 0 24px;
          padding: 0;
          display: grid;
          gap: 10px;
        }
        .ticket-features li {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #475467;
          font-size: 14px;
          font-weight: 600;
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
          transition: transform 0.15s, opacity 0.15s;
          box-sizing: border-box;
        }
        .ticket-btn:hover {
          transform: translateY(-2px);
          opacity: 0.9;
        }
        .ticket-btn-primary {
          background: #122c4f;
          color: #ffffff;
        }
        .ticket-btn-mint {
          background: #ffffff;
          border: 1.5px solid #27d3c3;
          color: #27d3c3;
        }
        .ticket-btn-navy {
          background: #ffffff;
          border: 1.5px solid #122c4f;
          color: #122c4f;
        }
        .ticket-btn-orange {
          background: #ffffff;
          border: 1.5px solid #ff7d5a;
          color: #ff7d5a;
        }

        .lang-box {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 22px;
          padding: 28px 32px;
          margin-top: 8px;
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
          .tickets-title {
            font-size: 28px;
          }
          .free-banner {
            flex-direction: column;
            align-items: flex-start;
            padding: 24px 20px;
          }
          .free-banner-btn {
            width: 100%;
            justify-content: center;
          }
          .ticket-tab {
            font-size: 13px;
            padding: 12px 0;
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
