'use client'
import { useState, useEffect } from 'react'
import { type Locale, STORAGE_KEY, getNestedValue } from './i18n'

export function useTranslation() {
  const [locale, setLocale] = useState<Locale>('ko')
  const [messages, setMessages] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as Locale) || 'ko'
    setLocale(saved)
  }, [])

  useEffect(() => {
    setLoading(true)
    import('../messages/' + locale + '.json')
      .catch(() => import('../messages/ko.json'))
      .then((mod) => {
        setMessages(mod.default)
        setLoading(false)
      })
  }, [locale])

  useEffect(() => {
    const handler = (e: Event) => {
      const newLocale = (e as CustomEvent<Locale>).detail
      setLocale(newLocale)
      localStorage.setItem(STORAGE_KEY, newLocale)
    }
    window.addEventListener('localeChange', handler)
    return () => window.removeEventListener('localeChange', handler)
  }, [])

  const t = (key: string): string => {
    const val = getNestedValue(messages, key)
    return val || key
  }

  return { t, locale, messages, loading }
}
