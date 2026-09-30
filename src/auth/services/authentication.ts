import { ref } from 'vue'
import { session } from '@/auth/stores/session'
import { apiFetchMe } from '@/auth/api/auth'
import type { UserProfile } from '@/api/generated/models'
import { useContextStore, type UserContext } from '@/contexts/stores/context'
import { queryClient } from '@/app/providers/query'
import { normalizeApiError } from '@/api/errors/normalizer'
import type { NormalizedApiError } from '@/api/errors/types'

export const hydrationError = ref<NormalizedApiError | null>(null)
let hydration: Promise<void> | null = null
let hydratedToken: string | null = null

/** Scoped presentation capabilities come from the server; global permissions stay separate.
 * API endpoints remain responsible for authorization on every request.
 */
export function profileContexts(user: UserProfile): UserContext[] {
  const contexts: UserContext[] = [...(user.contexts ?? [])]
  const permissions = user.permissions
  if (
    permissions.some((p) =>
      /^(areas|households|residents|invoices|payments\.manual|ledger|wifi)\./.test(p),
    )
  ) {
    contexts.push({
      id: 'global:management',
      type: 'management',
      label: 'Pengelolaan lingkungan',
      scope: { type: 'global', id: '' },
      capabilities: permissions,
    })
  }
  if (permissions.some((p) => /^(users|roles|settings|audit)\./.test(p))) {
    contexts.push({
      id: 'global:system',
      type: 'system',
      label: 'Administrasi sistem',
      scope: { type: 'global', id: '' },
      capabilities: permissions,
    })
  }
  return contexts
}

export function applyProfile(user: UserProfile): void {
  session.setUser({
    id: user.public_id ?? String(user.id),
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    mustChangePassword: user.must_change_password ?? false,
  })
  const store = useContextStore()
  store.setContexts(profileContexts(user))
  if (!store.activeContextId && store.availableContexts.length === 1)
    store.switchContext(store.availableContexts[0]!.id)
  hydratedToken = session.getToken()
  hydrationError.value = null
}

export function clearAuthentication(): void {
  session.clear()
  useContextStore().clearContexts()
  queryClient.clear()
  hydratedToken = null
  hydrationError.value = null
}

export async function ensureSession(force = false): Promise<void> {
  const token = session.getToken()
  if (!token || (!force && hydratedToken === token && session.getUser())) return
  if (hydration) return hydration
  hydration = (async () => {
    try {
      const user = await apiFetchMe()
      if (session.getToken() === token) applyProfile(user)
    } catch (error) {
      if (session.getToken() === token) hydrationError.value = normalizeApiError(error)
    } finally {
      hydration = null
    }
  })()
  return hydration
}
