import { afterEach, describe, expect, it } from 'vitest'
import { setLocale } from '@/i18n'
import { readResetLink, resetPasswordPayload } from './resetPassword'
const query = { token: 'test-reset-token', email: 'resident@example.test' }
const password = 'New-password-123'
afterEach(() => setLocale('id'))
describe('password reset contract', () => {
  it('rejects missing, repeated and malformed link parameters', () => {
    for (const value of [
      {},
      { email: query.email },
      { token: query.token },
      { ...query, token: '' },
      { ...query, token: ['one', 'two'] },
      { ...query, email: ['a@example.test'] },
      { ...query, email: 'bad' },
    ])
      expect(readResetLink(value)).toBeNull()
  })
  it('accepts valid links and normalizes the email without forwarding URL extras', () => {
    expect(
      readResetLink({ ...query, email: ' Resident@Example.test ', redirect: '//untrusted.test' }),
    ).toEqual(query)
  })
  it('rejects passwords below reset minimum and mismatched confirmation', () => {
    expect(() =>
      resetPasswordPayload(query, {
        password: 'a'.repeat(11),
        password_confirmation: 'a'.repeat(11),
      }),
    ).toThrow('12')
    expect(() =>
      resetPasswordPayload(query, { password, password_confirmation: 'different' }),
    ).toThrow('Kata sandi tidak cocok')
  })
  it('preserves password whitespace and sends only the documented fields', () => {
    const exact = '  new-password  '
    expect(
      resetPasswordPayload(
        { ...query, user_id: 'ignored' },
        { password: exact, password_confirmation: exact, role: 'ignored' },
      ),
    ).toEqual({ ...query, password: exact, password_confirmation: exact })
    expect(
      resetPasswordPayload(query, {
        password: 'a'.repeat(12),
        password_confirmation: 'a'.repeat(12),
      }).password,
    ).toHaveLength(12)
  })
  it('localizes client validation errors', () => {
    setLocale('en')
    expect(() =>
      resetPasswordPayload(query, { password: 'short', password_confirmation: 'short' }),
    ).toThrow('Password must contain at least 12 characters')
  })
})
