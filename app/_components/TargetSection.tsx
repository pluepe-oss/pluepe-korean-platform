'use client'
import { useTranslation } from '@/lib/useTranslation'

type TargetItem = { icon: string; title: string; desc: string }

export default function TargetSection() {
  const { t, messages } = useTranslation()
  const items = ((messages?.targets as { items?: TargetItem[] })?.items ?? []) as TargetItem[]

  return (
    <section className="targets">
      <div className="targets-inner">
        <span className="targets-eyebrow">{t('targets.eyebrow')}</span>
        <h2 className="targets-title">{t('targets.title')}</h2>
        <p className="targets-desc">{t('targets.desc')}</p>
        <div className="targets-grid">
          {items.map((it, i) => (
            <div key={i} className="target-card">
              <div className="target-icon">{it.icon}</div>
              <h3 className="target-card-title">{it.title}</h3>
              <p className="target-desc">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .targets {
          background: #edf2f7;
          margin: 0;
          position: relative;
          z-index: 1;
        }
        .targets-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 80px 80px 48px;
          box-sizing: border-box;
        }
        .targets-eyebrow {
          display: block;
          color: #27d3c3;
          font-weight: 900;
          font-size: 13px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .targets-title {
          font-size: 42px;
          font-weight: 700;
          margin: 0 0 14px;
          color: #0f172a;
          letter-spacing: -0.04em;
          font-family: Arial, "Noto Sans KR", sans-serif;
        }
        .targets-desc {
          font-size: 16px;
          color: #64748b;
          margin: 0 0 36px;
        }
        .targets-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          width: 100%;
        }
        .target-card {
          background: #ffffff;
          border-radius: 22px;
          padding: 32px;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
          width: 100%;
          box-sizing: border-box;
        }
        .target-icon {
          font-size: 28px;
          margin-bottom: 16px;
          line-height: 1;
        }
        .target-card-title {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 10px;
          letter-spacing: -0.02em;
        }
        .target-desc {
          font-size: 15px;
          color: #64748b;
          line-height: 1.6;
          margin: 0;
        }
        @media (max-width: 768px) {
          .targets-inner {
            padding: 48px 20px;
          }
          .targets-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  )
}
