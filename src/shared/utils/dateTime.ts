import { i18n } from '@/i18n'
export function formatDateTime(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(i18n.global.locale.value === 'en' ? 'en-GB' : 'id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}
