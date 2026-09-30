import { z } from 'zod'
import { tr } from '@/i18n'
import type { ResetPasswordRequest } from '@/api/generated/models'

const linkSchema = z.object({
  token: z.string().trim().min(1),
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
})

/** Query arrays, missing token and malformed email are invalid links. */
export function readResetLink(query: Record<string, unknown>) {
  const parsed = linkSchema.safeParse(query)
  return parsed.success ? parsed.data : null
}

export function resetPasswordFieldsSchema() {
  return z
    .object({
      password: z.string().min(12, tr('Kata sandi minimal 12 karakter')),
      password_confirmation: z.string(),
    })
    .refine((values) => values.password === values.password_confirmation, {
      path: ['password_confirmation'],
      message: tr('Kata sandi tidak cocok'),
    })
}

export function resetPasswordPayload(
  query: Record<string, unknown>,
  values: unknown,
): ResetPasswordRequest {
  return { ...linkSchema.parse(query), ...resetPasswordFieldsSchema().parse(values) }
}
