'use client'
import Link from 'next/link'
import { useTranslation } from '@/lib/useTranslation'
import LanguageSelector from './LanguageSelector'

export default function PublicHeader() {
  const { t } = useTranslation()

  return (
    <>
      <header className="public-header">
        <div className="public-header-inner">
          <Link href="/" className="public-logo">
            <span className="public-logo-mark">P</span>
            <span className="public-logo-text">PLUEPE</span>
          </Link>

          <nav className="public-nav">
            <Link href="#goals" className="public-nav-link">
              {t('nav.goals')}
            </Link>
            <Link href="#process" className="public-nav-link">
              {t('nav.process')}
            </Link>
            <Link href="#pricing" className="public-nav-link">
              {t('nav.pricing')}
            </Link>
            <Link href="/auth" className="public-nav-link">
              {t('nav.login')}
            </Link>
          </nav>

          <div className="public-right">
            <Link
              href="/free-trial"
              className="public-cta"
              style={{
                background: '#ff7d5a',
                color: '#ffffff',
                borderRadius: '999px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '800',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              {t('nav.cta')}
            </Link>
            <LanguageSelector />
          </div>
        </div>
      </header>

      <style jsx>{`
        .public-header {
          position: sticky;
          top: 0;
          z-index: 30;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          background: rgba(255, 255, 255, 0.92);
          border-bottom: 1px solid #e2e8f0;
        }
        .public-header-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 16px 80px;
          display: flex;
          flex-wrap: nowrap;
          white-space: nowrap;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          box-sizing: border-box;
        }
        .public-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: #122c4f;
        }
        .public-logo-mark {
          width: 34px;
          height: 34px;
          border-radius: 11px;
          background: #27d3c3;
          display: grid;
          place-items: center;
          font-weight: 900;
          font-size: 17px;
          color: #122c4f;
        }
        .public-logo-text {
          font-weight: 900;
          font-size: 18px;
          letter-spacing: -0.04em;
          color: #122c4f;
          white-space: nowrap;
        }
        .public-nav {
          display: flex;
          align-items: center;
          gap: 28px;
          margin-left: auto;
        }
        .public-nav-link {
          font-size: 14.5px;
          font-weight: 700;
          color: #64748b;
          text-decoration: none;
          letter-spacing: -0.01em;
        }
        .public-nav-link:hover {
          color: #122c4f;
        }
        .public-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .public-cta {
          background: #ff7d5a;
          color: #ffffff;
          border-radius: 999px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 800;
          border: none;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          letter-spacing: -0.01em;
          white-space: nowrap;
          transition: background 0.15s;
        }
        .public-cta:hover {
          background: #e86945;
        }
        @media (max-width: 1024px) {
          .public-nav {
            display: none;
          }
          .public-cta {
            padding: 8px 14px;
            font-size: 13px;
          }
        }
        @media (max-width: 768px) {
          .public-header-inner {
            padding: 14px 20px;
            gap: 8px;
          }
        }
      `}</style>
    </>
  )
}
