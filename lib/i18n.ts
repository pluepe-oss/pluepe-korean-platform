export type Locale = 'ko' | 'en' | 'vi' | 'zh' | 'id' | 'th'

export const LOCALES = [
  { code: 'ko' as Locale, label: '한국어', flag: '🇰🇷' },
  { code: 'en' as Locale, label: 'English', flag: '🇺🇸' },
  { code: 'vi' as Locale, label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'zh' as Locale, label: '中文', flag: '🇨🇳' },
  { code: 'id' as Locale, label: 'Indonesia', flag: '🇮🇩' },
  { code: 'th' as Locale, label: 'ภาษาไทย', flag: '🇹🇭' },
]

export const STORAGE_KEY = 'pluepe_locale'

export function getNestedValue(obj: Record<string, unknown>, path: string): string {
  return path.split('.').reduce((acc: unknown, key: string) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
    return ''
  }, obj) as string
}
