import { describe, expect, it } from 'vitest'
import { emailVerificationState, verificationEmailPayload } from './emailVerification'
const email = 'resident@example.test'
describe('email verification contract', () => {
  it('distinguishes absent status from explicitly unverified', () => {
    expect(emailVerificationState({ email })).toBe('unknown')
    expect(emailVerificationState({ email, email_verified_at: null })).toBe('unverified')
  })
  it('requires a valid server timestamp for verified status', () => {
    expect(emailVerificationState({ email, email_verified_at: '2026-10-01T01:00:00Z' })).toBe(
      'verified',
    )
    expect(emailVerificationState({ email, email_verified_at: 'invalid' })).toBe('unknown')
  })
  it('does not offer resend for missing or invalid email', () => {
    expect(emailVerificationState({ email: null })).toBe('no_email')
    expect(verificationEmailPayload({ email: 'invalid', email_verified_at: null })).toBeNull()
    expect(verificationEmailPayload({ email: null, email_verified_at: null })).toBeNull()
  })
  it('sends only the normalized email for explicitly unverified accounts', () => {
    expect(
      verificationEmailPayload({ email: 'Resident@Example.test', email_verified_at: null }),
    ).toEqual({ email })
  })
  it('never resends for verified or unknown status', () => {
    expect(verificationEmailPayload({ email })).toBeNull()
    expect(
      verificationEmailPayload({ email, email_verified_at: '2026-10-01T01:00:00Z' }),
    ).toBeNull()
  })
})
