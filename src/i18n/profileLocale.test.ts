import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
})
afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})
describe('account language precedence', () => {
  it('uses ID without a preference and adopts a valid server locale', async () => {
    const { applyProfileLocale, i18n } = await import('./index')
    applyProfileLocale(null)
    expect(i18n.global.locale.value).toBe('id')
    applyProfileLocale('en')
    expect(i18n.global.locale.value).toBe('en')
    expect(localStorage.getItem('rukun:locale')).toBeNull()
    applyProfileLocale('unsupported')
    expect(i18n.global.locale.value).toBe('id')
  })
  it('keeps an explicit persisted browser choice above the profile', async () => {
    localStorage.setItem('rukun:locale', 'id')
    const { applyProfileLocale, i18n } = await import('./index')
    applyProfileLocale('en')
    expect(i18n.global.locale.value).toBe('id')
  })
  it('honors new choices in memory even when persistence fails', async () => {
    const { applyProfileLocale, setLocale, i18n } = await import('./index')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    setLocale('en')
    applyProfileLocale('id')
    expect(i18n.global.locale.value).toBe('en')
    expect(document.documentElement.lang).toBe('en')
  })
})
