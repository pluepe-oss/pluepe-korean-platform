'use client'
import Link from 'next/link'
import { useTranslation } from '@/lib/useTranslation'

export default function CtaSection() {
  const { t, messages } = useTranslation()

  const links = ((messages?.footer as { links?: string[] })?.links ?? []) as string[]
  const hrefs = ((messages?.footer as { hrefs?: string[] })?.hrefs ?? []) as string[]

  return (
    <>
      <section className="cta">
        <div className="cta-inner">
          <h2 className="cta-title">
            처음 한국어를 시작하는 사람도,<br />
            지금 시작하면 합격까지 이어집니다.
          </h2>
          <p className="cta-desc">지금 바로 7일 무료 체험을 시작하고, 한국어 학습을 이어가세요.</p>
          <a href="/auth/signup" className="cta-btn">7일 무료 체험하기 →</a>
          <div className="cta-tracks">
            <span>TOPIK 1</span>
            <span className="cta-track-divider">|</span>
            <span>TOPIK 2</span>
            <span className="cta-track-divider">|</span>
            <span>EPS-TOPIK</span>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="footer-mark">P</span>
            <strong>PLUEPE</strong>
          </div>
          <div className="footer-links">
            {links.map((label, i) => (
              <Link key={i} href={hrefs[i] ?? '#'} className="footer-link">
                {label}
              </Link>
            ))}
          </div>
          <div className="footer-copy">{t('footer.copy')}</div>
        </div>
      </footer>

      <style jsx>{`
        .cta {
          background: #122c4f;
          color: white;
          margin: 0;
        }
        .cta-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 80px 80px;
          box-sizing: border-box;
          text-align: center;
        }
        .cta-title {
          font-size: clamp(32px, 4.4vw, 48px);
          font-weight: 700;
          letter-spacing: -0.04em;
          margin: 0 0 16px;
          line-height: 1.2;
          font-family: Arial, "Noto Sans KR", sans-serif;
          color: white;
        }
        .cta-desc {
          color: rgba(255, 255, 255, 0.72);
          font-size: 16px;
          margin: 0 0 36px;
        }
        .cta-btn {
          padding: 16px 36px;
          border-radius: 999px;
          background: #ff7d5a;
          color: white;
          font-weight: 800;
          font-size: 16px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 12px 26px rgba(255, 125, 90, 0.35);
          border: none;
          cursor: pointer;
          transition: background 0.15s;
        }
        .cta-btn:hover {
          background: #ff6a44;
        }
        .cta-tracks {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 20px;
          color: rgba(255, 255, 255, 0.55);
          font-size: 14px;
          font-weight: 700;
        }
        .cta-track-divider {
          color: rgba(255, 255, 255, 0.25);
        }

        .footer {
          background: #edf2f7;
          border-top: 1px solid #e2e8f0;
          margin: 0;
        }
        .footer-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 32px 80px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          color: #64748b;
          gap: 16px;
          box-sizing: border-box;
        }
        .footer-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .footer-mark {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          background: #27d3c3;
          display: grid;
          place-items: center;
          color: #122c4f;
          font-weight: 900;
          font-size: 13px;
        }
        .footer-brand strong {
          color: #122c4f;
          font-size: 15px;
          letter-spacing: -0.02em;
        }
        .footer-links {
          display: flex;
          gap: 24px;
        }
        .footer-link {
          color: #64748b;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
        }
        .footer-link:hover {
          color: #122c4f;
        }
        .footer-copy {
          color: #64748b;
        }

        @media (max-width: 768px) {
          .cta-inner {
            padding: 72px 20px;
          }
          .cta-title {
            font-size: 28px;
            line-height: 1.25;
          }
          .cta-btn {
            width: 100%;
            justify-content: center;
            box-sizing: border-box;
          }
          .footer-inner {
            flex-direction: column;
            gap: 16px;
            text-align: center;
            padding: 28px 20px;
          }
        }
      `}</style>
    </>
  )
}
