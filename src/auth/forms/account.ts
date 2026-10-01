import { z } from 'zod'
import { tr } from '@/i18n'
import type { ProfileRequest, ChangePasswordRequest } from '@/api/generated/models'
export function profileSchema() {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, tr('Nama wajib diisi'))
      .max(100, tr('Nama maksimal 100 karakter')),
    locale: z.enum(['id', 'en']),
  })
}
export function profilePayload(values: unknown): ProfileRequest {
  return profileSchema().parse(values)
}
export function accountPasswordSchema() {
  return z
    .object({
      current_password: z.string().min(1, tr('Kata sandi saat ini wajib diisi')),
      password: z.string().min(8, tr('Kata sandi minimal 8 karakter')),
      password_confirmation: z.string(),
    })
    .superRefine((values, ctx) => {
      if (values.password !== values.password_confirmation)
        ctx.addIssue({
          code: 'custom',
          path: ['password_confirmation'],
          message: tr('Kata sandi tidak cocok'),
        })
      if (values.password === values.current_password)
        ctx.addIssue({
          code: 'custom',
          path: ['password'],
          message: tr('Kata sandi baru harus berbeda'),
        })
    })
}
export function accountPasswordPayload(values: unknown): ChangePasswordRequest {
  return accountPasswordSchema().parse(values)
}
