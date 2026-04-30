'use client'
import Link from 'next/link'
import { useTranslation } from '@/lib/useTranslation'

export default function HeroSection() {
  const { t, messages } = useTranslation()
  const heroMsg = (messages?.hero ?? {}) as Record<string, unknown>
  const phoneSteps = Array.isArray(heroMsg.phone_steps)
    ? (heroMsg.phone_steps as string[][])
    : []

  const copy = t('hero.copy')
  const noteText = ((messages?.hero as { note?: string })?.note ?? '').trim()

  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-left">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            {t('hero.badge')}
          </div>
          <h1 className="hero-h1">
            {t('hero.h1_line1')}
            <br />
            <span className="hero-h1-grad">{t('hero.h1_line2')}</span>
          </h1>
          <p className="hero-copy">
            {copy.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i < copy.split('\n').length - 1 && <br />}
              </span>
            ))}
          </p>
          <div className="hero-buttons">
            <a href="/free-trial" className="hero-btn-primary">
              7일 무료로 체험하기 →
            </a>
            <a href="#goals" className="hero-btn-secondary">
              학습 목표 선택하기
            </a>
          </div>
          {noteText && <p className="hero-note">{noteText}</p>}
        </div>

        <div className="hero-right">
          <div className="phone">
            <div className="phone-notch" />
            <div className="phone-screen">
              <div className="screen-top">
                <strong>{t('hero.phone_today')}</strong>
              </div>
              <div className="progress-card">
                <small>{t('hero.phone_course')}</small>
                <h3>{t('hero.phone_unit')}</h3>
                <div className="progress-track">
                  <span />
                </div>
                <div className="progress-meta">{t('hero.phone_progress')}</div>
              </div>
              <div className="step-list">
                {phoneSteps.map((step, idx) => {
                  const status = step[3]
                  const cls =
                    status === 'done'
                      ? 'step step-done'
                      : status === 'now'
                      ? 'step step-now'
                      : 'step'
                  return (
                    <div key={idx} className={cls}>
                      <strong className="step-name">{step[1]}</strong>
                      <span className="step-state">
                        {status === 'done' ? '✓' : status === 'now' ? '●' : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero {
          background:
            radial-gradient(circle at 8% 20%, rgba(39, 211, 195, 0.32), transparent 45%),
            radial-gradient(circle at 92% 15%, rgba(39, 211, 195, 0.18), transparent 38%),
            radial-gradient(circle at 50% 100%, rgba(39, 211, 195, 0.12), transparent 40%),
            #e8f7f5;
          margin: 0;
        }
        .hero-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 80px 80px 60px;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 56px;
          align-items: center;
          box-sizing: border-box;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(39, 211, 195, 0.15);
          color: #0e8b76;
          font-weight: 800;
          font-size: 13.5px;
          border: 1px solid rgba(39, 211, 195, 0.3);
          margin-bottom: 24px;
          letter-spacing: -0.01em;
        }
        .hero-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #27d3c3;
        }
        .hero-h1 {
          font-size: clamp(40px, 5.6vw, 64px);
          line-height: 1.15;
          letter-spacing: -0.05em;
          font-weight: 900;
          margin: 0;
          color: #0f172a;
          font-family: Arial, "Noto Sans KR", sans-serif;
        }
        .hero-h1-grad {
          color: #27d3c3;
        }
        .hero-copy {
          margin-top: 22px;
          font-size: 17px;
          color: #64748b;
          letter-spacing: -0.01em;
          line-height: 1.6;
          font-family: Arial, "Noto Sans KR", sans-serif;
        }
        .hero-buttons {
          display: flex;
          gap: 12px;
          margin-top: 28px;
          flex-wrap: wrap;
        }
        .hero-btn-primary {
          background: #ff7d5a !important;
          color: #ffffff !important;
          border-radius: 999px;
          padding: 14px 28px;
          font-size: 15px;
          font-weight: 800;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          text-decoration: none;
          transition: background 0.15s, transform 0.15s;
        }
        .hero-btn-primary:hover {
          background: #e86945 !important;
          transform: translateY(-2px);
        }
        .hero-btn-secondary {
          background: #27d3c3 !important;
          color: #122c4f !important;
          border-radius: 999px;
          padding: 14px 28px;
          font-size: 15px;
          font-weight: 800;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          text-decoration: none;
          transition: background 0.15s, transform 0.15s;
        }
        .hero-btn-secondary:hover {
          background: #1fbfb0 !important;
          transform: translateY(-2px);
        }
        .hero-note {
          margin-top: 18px;
          color: #64748b;
          font-size: 13.5px;
        }

        .hero-right {
          display: flex;
          justify-content: center;
        }
        .phone {
          width: min(400px, 88vw);
          border-radius: 44px;
          padding: 14px;
          background: linear-gradient(180deg, #122c4f, #0a1f38);
          box-shadow: 0 28px 80px rgba(15, 23, 42, 0.18);
          transform: rotate(1.5deg);
          position: relative;
        }
        .phone-notch {
          position: absolute;
          top: 22px;
          left: 50%;
          transform: translateX(-50%);
          width: 96px;
          height: 24px;
          border-radius: 999px;
          background: #050d18;
          z-index: 2;
        }
        .phone-screen {
          min-height: 560px;
          border-radius: 32px;
          background: #ffffff;
          padding: 22px 20px 24px;
          overflow: hidden;
        }
        .screen-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
          padding-top: 24px;
        }
        .screen-top strong {
          font-size: 14px;
          color: #0f172a;
        }
        .progress-card {
          background: linear-gradient(135deg, #122c4f, #1a3d6b);
          color: white;
          padding: 22px;
          border-radius: 22px;
          margin-bottom: 14px;
        }
        .progress-card small {
          color: rgba(255, 255, 255, 0.6);
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .progress-card h3 {
          margin: 6px 0 14px;
          font-size: 22px;
          font-weight: 900;
          letter-spacing: -0.04em;
        }
        .progress-track {
          height: 8px;
          background: rgba(255, 255, 255, 0.16);
          border-radius: 999px;
          overflow: hidden;
        }
        .progress-track span {
          display: block;
          width: 60%;
          height: 100%;
          background: #27d3c3;
          border-radius: 999px;
        }
        .progress-meta {
          margin-top: 10px;
          font-size: 11.5px;
          color: rgba(255, 255, 255, 0.7);
        }
        .step-list {
          display: grid;
          gap: 8px;
        }
        .step {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          align-items: center;
          background: white;
          border: 1px solid #e2e8f0;
          padding: 12px 14px;
          border-radius: 14px;
        }
        .step-done {
          background: rgba(39, 211, 195, 0.08);
        }
        .step-now {
          border: 2px solid #27d3c3;
          box-shadow: 0 0 0 3px rgba(39, 211, 195, 0.1);
        }
        .step-name {
          display: block;
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
        }
        .step-state {
          font-size: 14px;
          font-weight: 900;
          color: #27d3c3;
          min-width: 14px;
          text-align: right;
        }

        @media (max-width: 1100px) {
          .hero-inner {
            gap: 24px;
          }
          .hero-h1 {
            font-size: clamp(32px, 5vw, 64px);
          }
          .phone {
            width: min(340px, 45vw);
          }
        }
        @media (max-width: 768px) {
          .hero-inner {
            grid-template-columns: 1fr;
            gap: 32px;
            padding: 48px 20px 40px;
          }
          .hero-h1 {
            font-size: 38px;
            line-height: 1.15;
          }
          .hero-copy {
            font-size: 16px;
          }
          .hero-buttons {
            flex-direction: column;
          }
          .hero-btn-primary,
          .hero-btn-secondary {
            width: 100%;
            justify-content: center;
            padding: 14px 20px;
            box-sizing: border-box;
          }
          .phone {
            width: 280px;
            margin: 0 auto;
            transform: rotate(0);
          }
          .phone-screen {
            min-height: 480px;
          }
        }
      `}</style>
    </section>
  )
}
