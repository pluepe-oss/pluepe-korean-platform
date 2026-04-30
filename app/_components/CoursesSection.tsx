'use client'
import Link from 'next/link'
import { useTranslation } from '@/lib/useTranslation'

type CourseItem = {
  num: string
  tag: string
  title: string
  desc: string
  meta: string[]
  href: string
}

function renderTitle(title: string) {
  const parts = title.split(/(\s\d+|-TOPIK)/g).filter(Boolean)
  return parts.map((p, i) => {
    const isAccent = /^\s?\d+/.test(p) || /-TOPIK/.test(p)
    return isAccent ? (
      <em key={i} className="course-title-accent">
        {p}
      </em>
    ) : (
      <span key={i}>{p}</span>
    )
  })
}

export default function CoursesSection() {
  const { t, messages } = useTranslation()
  const items = ((messages?.courses as { items?: CourseItem[] })?.items ?? []) as CourseItem[]

  return (
    <section className="courses" id="goals">
      <div className="courses-inner">
        <div className="courses-head">
          <div className="courses-eyebrow">{t('courses.eyebrow')}</div>
          <h2 className="courses-title">{t('courses.title')}</h2>
          <p className="courses-desc">{t('courses.desc')}</p>
        </div>

        <div className="courses-grid">
          {items.map((c, i) => {
            const topColors = ['#27d3c3', '#122c4f', '#ff7d5a']
            return (
            <Link
              href={c.href}
              key={i}
              className="course-card"
              style={{ borderTop: `4px solid ${topColors[i] ?? '#e2e8f0'}` }}
            >
              <span className="course-tag">{c.tag}</span>
              <h3 className="course-card-title">{renderTitle(c.title)}</h3>
              <p className="course-card-desc">{c.desc}</p>
              <ul className="course-meta">
                {c.meta.map((m, j) => (
                  <li key={j}>
                    <span className="course-meta-dot" />
                    {m}
                  </li>
                ))}
              </ul>
              <div className="course-footer">
                <span
                  className="course-more"
                  style={{
                    border: `1.5px solid ${topColors[i] ?? '#e2e8f0'}`,
                    color: topColors[i] ?? '#0f172a',
                  }}
                >
                  자세히 보기 →
                </span>
              </div>
            </Link>
            )
          })}
        </div>
      </div>

      <style jsx>{`
        .courses {
          background: #edf2f7;
          margin: 0;
          position: relative;
          z-index: 1;
        }
        .courses-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 48px 80px 80px;
          box-sizing: border-box;
        }
        .courses-head {
          margin-bottom: 44px;
        }
        .courses-eyebrow {
          display: block;
          color: #27d3c3;
          font-weight: 900;
          font-size: 13px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        .courses-title {
          font-size: 42px;
          font-weight: 700;
          letter-spacing: -0.04em;
          margin: 0;
          color: #0f172a;
          line-height: 1.15;
          font-family: Arial, "Noto Sans KR", sans-serif;
        }
        .courses-desc {
          margin: 12px 0 0;
          color: #64748b;
          font-size: 16px;
        }
        .courses-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          padding: 8px;
        }
        .course-card {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 22px;
          padding: 32px 28px;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
          width: 100%;
          box-sizing: border-box;
          cursor: pointer;
          transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
          position: relative;
          display: block;
          text-decoration: none;
          color: inherit;
        }
        .course-card:hover {
          border-color: #27d3c3;
          transform: translateY(-4px);
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
        }
        .course-num {
          position: absolute;
          top: 20px;
          right: 24px;
          font-size: 13px;
          font-weight: 900;
          color: #64748b;
          letter-spacing: 0.05em;
        }
        .course-tag {
          display: inline-flex;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(39, 211, 195, 0.12);
          color: #0e8b76;
          font-size: 12.5px;
          font-weight: 800;
          margin-bottom: 22px;
        }
        .course-card-title {
          font-size: 36px;
          font-weight: 900;
          letter-spacing: -0.05em;
          color: #0f172a;
          margin: 0 0 12px;
          line-height: 1;
        }
        :global(.course-title-accent) {
          color: #27d3c3;
          font-style: normal;
        }
        .course-card-desc {
          color: #64748b;
          font-size: 15px;
          margin: 0 0 22px;
          line-height: 1.5;
        }
        .course-meta {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 8px;
        }
        .course-meta li {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #64748b;
          font-size: 14px;
        }
        .course-meta-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #27d3c3;
          flex: 0 0 auto;
        }
        .course-footer {
          border-top: 1px solid #e2e8f0;
          margin-top: 20px;
          padding-top: 16px;
        }
        .course-more {
          display: inline-flex;
          align-items: center;
          padding: 10px 20px;
          border-radius: 12px;
          background: #ffffff;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .course-more:hover {
          opacity: 0.75;
        }
        @media (max-width: 768px) {
          .courses-inner {
            padding: 48px 20px;
          }
          .courses-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  )
}
