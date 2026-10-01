import { z } from 'zod'
import type { ListNotificationsParams } from '@/api/generated/models'
const item = z.object({
  id: z.string().min(1),
  category: z.string(),
  title: z.string(),
  message: z.string(),
  read_at: z.string().nullable(),
  created_at: z.string().nullable(),
})
const envelope = z.object({ success: z.literal(true), data: item })
const listing = z.object({
  success: z.literal(true),
  data: z.object({ data: z.array(item), next_cursor: z.string().nullable(), prev_cursor: z.string().nullable() }),
})
const count = z.object({ success: z.literal(true), data: z.object({ count: z.number().int().nonnegative() }) })
export type InboxItem = z.infer<typeof item>
export function parseInbox(value: unknown) { return listing.parse(value).data }
export function parseNotification(value: unknown) { return envelope.parse(value).data }
export function parseUnreadCount(value: unknown) { return count.parse(value).data.count }
export function inboxParams(status: '' | 'read' | 'unread', category: '' | 'security' | 'account' | 'system', cursor?: string): ListNotificationsParams {
  return { per_page: 20, ...(status ? { status } : {}), ...(category ? { category } : {}), ...(cursor ? { cursor } : {}) }
}
export function categoryLabel(category: string) {
  return ({ security: 'Keamanan', account: 'Akun', system: 'Sistem' } as Record<string, string>)[category] ?? 'Lainnya'
}
