import { z } from 'zod'
import type { UserProfile, EmailRequest } from '@/api/generated/models'
type VerificationProfile = Pick<UserProfile, 'email' | 'email_verified_at'>
export function emailVerificationState(user: VerificationProfile) {
  if (!user.email?.trim()) return 'no_email' as const
  if (!z.string().email().safeParse(user.email).success) return 'unknown' as const
  if (user.email_verified_at === null) return 'unverified' as const
  if (
    typeof user.email_verified_at === 'string' &&
    Number.isFinite(Date.parse(user.email_verified_at))
  )
    return 'verified' as const
  return 'unknown' as const
}
export function verificationEmailPayload(user: VerificationProfile): EmailRequest | null {
  return emailVerificationState(user) === 'unverified'
    ? { email: user.email!.trim().toLowerCase() }
    : null
}
