'use client'
import { useTranslation } from '@/lib/useTranslation'

type StatItem = { value: string; label: string }

export default function StatsSection() {
  const { messages } = useTranslation()
  const items = ((messages?.stats as { items?: StatItem[] })?.items ?? []) as StatItem[]

  return (
    <section className="stats">
      {items.map((it, i) => (
        <div key={i} className={`stat-cell ${i === items.length - 1 ? 'last' : ''}`}>
          <div className="stat-value">{it.value}</div>
          <div className="stat-label">{it.label}</div>
        </div>
      ))}

      <style jsx>{`
        .stats {
          background: white;
          padding: 48px 7vw;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
        }
        .stat-cell {
          text-align: center;
          padding: 24px 16px;
          border-right: 1px solid #e6ebef;
        }
        .stat-cell.last {
          border-right: none;
        }
        .stat-value {
          font-size: 28px;
          font-weight: 900;
          color: #0f2437;
          letter-spacing: -0.05em;
        }
        .stat-label {
          font-size: 13px;
          font-weight: 600;
          color: #667085;
          margin-top: 6px;
        }
        @media (max-width: 768px) {
          .stats {
            grid-template-columns: repeat(2, 1fr);
          }
          .stat-cell:nth-child(2n) {
            border-right: none;
          }
          .stat-cell:nth-child(2n + 1) {
            border-right: 1px solid #e6ebef;
          }
          .stat-cell.last {
            border-right: none;
          }
        }
      `}</style>
    </section>
  )
}
