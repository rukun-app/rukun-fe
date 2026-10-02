import { describe, expect, it } from 'vitest'
import {
  categoryLabel,
  inboxParams,
  parseInbox,
  parseNotification,
  parseUnreadCount,
} from './model'
const item = {
  id: 'notification-id',
  title: 'Halo',
  message: '<script>unsafe</script>',
  category: 'account',
  read_at: null,
  created_at: '2026-10-02T00:00:00Z',
}
describe('notification response boundary', () => {
  it('retains server cursor as opaque data and excludes arbitrary action/context', () => {
    const result = parseInbox({
      success: true,
      data: {
        data: [
          {
            ...item,
            action: { url: 'https://outside.test' },
            context: { household_id: 'private' },
          },
        ],
        next_cursor: 'opaque+/=',
        prev_cursor: null,
      },
    })
    expect(result.next_cursor).toBe('opaque+/=')
    expect(result.data[0]).toEqual(item)
  })
  it('preserves read state and message as plain text', () => {
    expect(parseNotification({ success: true, data: item }).read_at).toBeNull()
    expect(parseNotification({ success: true, data: item }).message).toBe(item.message)
    expect(
      parseNotification({ success: true, data: { ...item, read_at: '2026-10-02T01:00:00Z' } })
        .read_at,
    ).toBeTruthy()
  })
  it('rejects malformed or unsuccessful lists instead of rendering a false empty state', () => {
    expect(() => parseInbox({ success: false, data: { data: [] } })).toThrow()
    expect(() =>
      parseInbox({
        success: true,
        data: { data: [{ title: 'Incomplete' }], next_cursor: null, prev_cursor: null },
      }),
    ).toThrow()
  })
  it('accepts genuine zero counts but rejects missing, negative and string counts', () => {
    expect(parseUnreadCount({ success: true, data: { count: 0 } })).toBe(0)
    for (const count of [-1, '1', undefined])
      expect(() => parseUnreadCount({ success: true, data: { count } })).toThrow()
  })
  it('omits empty filters and sends backend filter names and opaque cursor', () => {
    expect(inboxParams('', '')).toEqual({ per_page: 20 })
    expect(inboxParams('unread', 'security', 'opaque+/=')).toEqual({
      per_page: 20,
      status: 'unread',
      category: 'security',
      cursor: 'opaque+/=',
    })
  })
  it('uses readable labels with a fallback for future categories', () => {
    expect(categoryLabel('security')).toBe('Keamanan')
    expect(categoryLabel('unknown')).toBe('Lainnya')
  })
})
