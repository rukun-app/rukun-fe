import { describe, expect, it } from 'vitest'
import { profilePayload, accountPasswordPayload } from './account'
describe('account payload boundaries', () => {
  it('sends only mutable profile fields and trims name', () => {
    expect(
      profilePayload({
        name: ' Warga ',
        locale: 'en',
        email: 'ignored@test.test',
        roles: ['admin'],
      }),
    ).toEqual({ name: 'Warga', locale: 'en' })
  })
  it('rejects blank/long names and unsupported locales', () => {
    for (const values of [
      { name: '', locale: 'id' },
      { name: ' '.repeat(3), locale: 'id' },
      { name: 'a'.repeat(101), locale: 'id' },
      { name: 'A', locale: 'fr' },
    ])
      expect(() => profilePayload(values)).toThrow()
  })
  it('requires current password, 8 characters, matching confirmation and a changed password', () => {
    for (const values of [
      { current_password: '', password: 'new-pass', password_confirmation: 'new-pass' },
      { current_password: 'old-pass', password: 'short', password_confirmation: 'short' },
      { current_password: 'old-pass', password: 'new-pass', password_confirmation: 'different' },
      { current_password: 'old-pass', password: 'old-pass', password_confirmation: 'old-pass' },
    ])
      expect(() => accountPasswordPayload(values)).toThrow()
  })
  it('preserves passwords exactly and excludes extras', () => {
    expect(
      accountPasswordPayload({
        current_password: ' old-pass ',
        password: ' new-pass ',
        password_confirmation: ' new-pass ',
        email: 'ignored',
      }),
    ).toEqual({
      current_password: ' old-pass ',
      password: ' new-pass ',
      password_confirmation: ' new-pass ',
    })
  })
})
