import { beforeEach, describe, expect, it, vi } from 'vitest'
import { applyTheme, darkMode, initializeTheme } from './theme'
import { i18n, savedLocale, setLocale, tr } from '@/i18n'
beforeEach(() => {
  localStorage.clear()
  setLocale('id')
  document.documentElement.className = ''
})
describe('display preferences', () => {
  it('defaults to Indonesian and rejects unsupported locale values', () => {
    localStorage.removeItem('rukun:locale')
    expect(savedLocale()).toBe('id')
    setLocale('fr')
    expect(i18n.global.locale.value).toBe('id')
    expect(document.documentElement.lang).toBe('id')
  })
  it('persists English, translates copy and preserves backend names', () => {
    setLocale('en')
    expect(savedLocale()).toBe('en')
    expect(document.documentElement.lang).toBe('en')
    expect(tr('Pilih kartu keluarga')).toBe('Choose household')
    expect(tr('RW Melati')).toBe('RW Melati')
    setLocale('id')
    expect(tr('Pilih kartu keluarga')).toBe('Pilih kartu keluarga')
  })
  it('uses system dark preference initially and explicit choice after reload', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    initializeTheme()
    expect(darkMode.value).toBe(true)
    applyTheme(false)
    initializeTheme()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    applyTheme(true)
    expect(localStorage.getItem('rukun:theme')).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
    vi.unstubAllGlobals()
  })
  it('keeps preferences usable when storage is blocked', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => {
      setLocale('en')
      applyTheme(true)
    }).not.toThrow()
    expect(tr('Masuk')).toBe('Sign in')
    expect(darkMode.value).toBe(true)
    spy.mockRestore()
  })
})
