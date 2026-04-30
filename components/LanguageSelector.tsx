'use client'
import { STORAGE_KEY, type Locale } from '@/lib/i18n'
import { useState, useEffect } from 'react'

const VISIBLE_LOCALES: { code: Locale; label: string }[] = [
  { code: 'ko', label: '한국어' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
]

export default function LanguageSelector() {
  const [current, setCurrent] = useState<Locale>('ko')

  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as Locale) || 'ko'
    setCurrent(saved)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const locale = e.target.value as Locale
    setCurrent(locale)
    localStorage.setItem(STORAGE_KEY, locale)
    window.dispatchEvent(new CustomEvent('localeChange', { detail: locale }))
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      style={{
        padding: '9px 12px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        fontSize: '14px',
        fontWeight: 600,
        background: 'white',
        cursor: 'pointer',
        fontFamily: 'inherit',
        color: '#0f172a',
      }}
    >
      {VISIBLE_LOCALES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  )
}
