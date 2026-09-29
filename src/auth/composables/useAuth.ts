import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useContextStore } from '@/contexts/stores/context'
import { session } from '@/auth/stores/session'
import { apiLogin, apiLogout } from '@/auth/api/auth'
import { normalizeApiError } from '@/api/errors/normalizer'
import type { LoginRequest } from '@/auth/api/types'
import type { NormalizedApiError } from '@/api/errors/types'
import { applyProfile, clearAuthentication, ensureSession } from '@/auth/services/authentication'

export function useAuth() {
  const router = useRouter()
  const loading = ref(false)
  const error = ref<NormalizedApiError | null>(null)
  async function login(credentials: LoginRequest): Promise<void> {
    if (loading.value) return
    loading.value = true
    error.value = null
    try {
      const data = await apiLogin(credentials)
      clearAuthentication()
      session.setToken(data.token)
      applyProfile(data.user)
      const store = useContextStore()
      const homes: Record<string, string> = {
        management: '/manage/dashboard',
        household: '/app/home',
        vendor: '/vendor/dashboard',
        system: '/system/overview',
      }
      const home = data.user.must_change_password
        ? '/auth/change-initial-password'
        : (homes[store.activeContext?.type ?? ''] ?? '/auth/select-context')
      const redirect = router.currentRoute.value.query.redirect
      await router.replace(
        typeof redirect === 'string' &&
          redirect.startsWith('/') &&
          !redirect.startsWith('//') &&
          !redirect.startsWith('/auth/')
          ? redirect
          : home,
      )
    } catch (e) {
      error.value = normalizeApiError(e)
    } finally {
      loading.value = false
    }
  }
  async function logout(): Promise<void> {
    loading.value = true
    try {
      await apiLogout()
    } catch {
      /* Clear locally even when offline. */
    } finally {
      clearAuthentication()
      loading.value = false
      await router.replace({ name: 'auth.login' })
    }
  }
  return { loading, error, login, logout, hydrate: () => ensureSession(true) }
}
