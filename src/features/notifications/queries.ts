import { computed, type Ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { listNotifications, notificationUnreadCount, showNotification } from '@/api/generated/endpoints'
import { session } from '@/auth/stores/session'
import { i18n } from '@/i18n'
import { inboxParams, parseInbox, parseNotification, parseUnreadCount } from './model'
export function useInbox(status: Ref<'' | 'read' | 'unread'>, category: Ref<'' | 'security' | 'account' | 'system'>, cursor: Ref<string | undefined>, selected: Ref<string>) {
  const key = ['account', session.getUser()?.id, 'notifications']
  const locale = computed(() => i18n.global.locale.value)
  const list = useQuery({ queryKey: computed(() => [...key, 'list', locale.value, status.value, category.value, cursor.value]), queryFn: async ({ signal }) => parseInbox(await listNotifications(inboxParams(status.value, category.value, cursor.value), undefined, signal)) })
  const count = useQuery({ queryKey: [...key, 'count'], queryFn: async ({ signal }) => parseUnreadCount(await notificationUnreadCount(undefined, signal)) })
  const detail = useQuery({ queryKey: computed(() => [...key, 'detail', locale.value, selected.value]), enabled: computed(() => !!selected.value), queryFn: async ({ signal }) => parseNotification(await showNotification(encodeURIComponent(selected.value), undefined, signal)) })
  return { key, list, count, detail }
}
