'use client'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from '@/lib/useTranslation'
import { createClient } from '@/lib/supabase/client'
import LanguageSelector from './LanguageSelector'

export default function PublicHeader() {
  const { t } = useTranslation()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
    })
    return () => listener.subscription.unsubscribe()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const ctaStyle = {
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
  } as const

  return (
    <>
      <header className="public-header">
        <div className="public-header-inner">
          <a href="/" className="public-logo">
            <span className="logo-pluepe">PLUEPE</span>
            <span className="logo-korean">KOREAN</span>
          </a>

          <nav className="public-nav">
            <Link href="/#goals" className="public-nav-link">
              {t('nav.goals')}
            </Link>
            <Link href="/#process" className="public-nav-link">
              {t('nav.process')}
            </Link>
            <Link href="/#pricing" className="public-nav-link">
              {t('nav.pricing')}
            </Link>
          </nav>

          <div className="public-right">
            {isLoggedIn ? (
              <>
                <Link href="/my" className="public-nav-link">마이페이지</Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="nav-link"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '15px',
                    fontWeight: 500,
                    color: '#0f172a',
                    fontFamily: 'inherit',
                  }}
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link href="/auth" className="public-nav-link">
                  {t('nav.login')}
                </Link>
                <Link href="/auth/signup" className="public-cta" style={ctaStyle}>
                  {t('nav.cta')}
                </Link>
              </>
            )}
            <LanguageSelector />
          </div>
        </div>
      </header>

      <style jsx>{`
        .public-header {
          position: sticky;
          top: 0;
          z-index: 50;
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
          align-items: baseline;
          gap: 6px;
          text-decoration: none;
          white-space: nowrap;
        }
        .logo-pluepe {
          font-size: 22px;
          font-weight: 900;
          color: #122c4f;
          letter-spacing: -0.03em;
        }
        .logo-korean {
          font-size: 22px;
          font-weight: 900;
          color: #27d3c3;
          letter-spacing: -0.03em;
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
