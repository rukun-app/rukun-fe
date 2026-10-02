import { z } from 'zod'
import type { UpdateNotificationPreferencesBody } from '@/api/generated/models'
const preference = z
  .object({
    category: z.enum(['security', 'account', 'system']),
    database_enabled: z.boolean(),
    mail_enabled: z.boolean(),
    locked_channels: z.array(z.enum(['database', 'mail'])),
  })
  .refine(
    (row) => row.locked_channels.every((channel) => row[`${channel}_enabled`]),
    'Required channel disabled',
  )
const rows = z
  .array(preference)
  .min(1)
  .refine(
    (value) => new Set(value.map((row) => row.category)).size === value.length,
    'Duplicate category',
  )
export type NotificationPreference = z.infer<typeof preference>
export type Channel = 'database' | 'mail'
export function parsePreferences(value: unknown) {
  return z.object({ success: z.literal(true), data: rows }).parse(value).data
}
export function clonePreferences(value: NotificationPreference[]) {
  return value.map((row) => ({ ...row, locked_channels: [...row.locked_channels] }))
}
export function preferencesChanged(
  draft: NotificationPreference[],
  baseline: NotificationPreference[],
) {
  return (
    draft.some((row) => {
      const saved = baseline.find((item) => item.category === row.category)
      return (
        !saved ||
        row.database_enabled !== saved.database_enabled ||
        row.mail_enabled !== saved.mail_enabled
      )
    }) || draft.length !== baseline.length
  )
}
export function preferencesPayload(
  draft: NotificationPreference[],
  baseline: NotificationPreference[],
): UpdateNotificationPreferencesBody {
  const original = rows.parse(baseline)
  const checked = rows.parse(draft)
  if (checked.length !== original.length) throw new Error('Categories changed')
  return {
    preferences: checked.flatMap((row) => {
      const saved = original.find((item) => item.category === row.category)
      if (!saved || saved.locked_channels.some((channel) => !row[`${channel}_enabled`]))
        throw new Error('Invalid preference')
      if (
        row.database_enabled === saved.database_enabled &&
        row.mail_enabled === saved.mail_enabled
      )
        return []
      return [
        {
          category: row.category,
          database_enabled: row.database_enabled,
          mail_enabled: row.mail_enabled,
        },
      ]
    }),
  }
}
