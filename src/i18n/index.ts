import { createI18n } from 'vue-i18n'
import id from './locales/id'
import en from './locales/en'
export function savedLocale(): 'id' | 'en' {
  try {
    return localStorage.getItem('rukun:locale') === 'en' ? 'en' : 'id'
  } catch {
    return 'id'
  }
}
export const i18n = createI18n({
  legacy: false,
  locale: savedLocale(),
  fallbackLocale: 'id',
  messages: { id, en: {} },
})
export function setLocale(value: string) {
  const locale = value === 'en' ? 'en' : 'id'
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
