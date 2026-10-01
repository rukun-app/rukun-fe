import type { ApiToken } from '@/api/generated/models'
import { tr } from '@/i18n'
export function sessionLabel(token: Pick<ApiToken, 'name'>) {
  return token.name.trim() || tr('Perangkat tanpa nama')
}
/** Snapshot server metadata before confirmation; never infer current device by name. */
export function sessionRevocation(token: ApiToken) {
  if (!Number.isSafeInteger(token.id) || token.id <= 0) return null
  return { id: token.id, label: sessionLabel(token), signsOut: token.is_current === true }
}
