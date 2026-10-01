import { createI18n } from 'vue-i18n'
import id from './locales/id'
import en from './locales/en'
function storedLocale(): 'id' | 'en' | undefined {
  try {
    const value = localStorage.getItem('rukun:locale')
    return value === 'id' || value === 'en' ? value : undefined
  } catch {
    return undefined
  }
}
let explicitLocale = storedLocale()
export function savedLocale(): 'id' | 'en' {
  return storedLocale() ?? 'id'
}
/** Explicit browser choice wins; otherwise use the account preference, then ID. */
export function applyProfileLocale(value?: string | null) {
  const locale = explicitLocale ?? (value === 'en' ? 'en' : 'id')
  i18n.global.locale.value = locale
  document.documentElement.lang = locale
}
export const i18n = createI18n({
  legacy: false,
  locale: savedLocale(),
  fallbackLocale: 'id',
  messages: { id, en: {} },
})
export function setLocale(value: string) {
  const locale = value === 'en' ? 'en' : 'id'
  explicitLocale = locale
  i18n.global.locale.value = locale
  document.documentElement.lang = locale
  try {
    localStorage.setItem('rukun:locale', locale)
  } catch {
    /* Preference still applies for this session. */
  }
}
/** Translate UI copy only. Backend record names and free-form server messages stay untouched. */
export function tr(source: string): string {
  return i18n.global.locale.value === 'en' ? (en[source] ?? source) : source
}
