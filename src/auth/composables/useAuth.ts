/**
 * useAuth — login/logout orchestration, /auth/me hydration.
 * Call login() or logout(); never touch session/contextStore directly from pages.
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { session } from '@/auth/stores/session'
import { useContextStore } from '@/contexts/stores/context'
import { apiLogin, apiLogout, apiFetchMe } from '@/auth/api/auth'
import { normalizeApiError, isApiError } from '@/api/errors/normalizer'
import type { LoginRequest, LoginResponse, MeResponse } from '@/auth/api/types'
import type { NormalizedApiError } from '@/api/errors/types'
import type { SessionUser } from '@/auth/stores/session'

export function useAuth() {
  const router = useRouter()
  const contextStore = useContextStore()

  const loading = ref(false)
  const error = ref<NormalizedApiError | null>(null)

  async function login(credentials: LoginRequest): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const data = await apiLogin(credentials)
      session.setToken(data.token)
      session.setUser(mapUser(data.user))
      contextStore.setContexts(data.contexts)

      // Auto-select first context if only one available
      if (data.contexts.length === 1) {
        contextStore.switchContext(data.contexts[0]!.id)
      }

      await redirectAfterLogin()
    } catch (e) {
      error.value = isApiError(e) ? normalizeApiError(e) : unknownError()
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    try {
      await apiLogout()
    } catch {
      // best-effort; always clear locally
    } finally {
      session.clear()
      contextStore.clearContexts()
      router.replace({ name: 'auth.login' })
    }
  }

  /** Hydrate user + contexts from /auth/me (called on app mount when token exists). */
  async function hydrate(): Promise<void> {
    if (!session.isAuthenticated()) return
    try {
      const data = await apiFetchMe()
      session.setUser(mapUser(data.user))
      contextStore.setContexts(data.contexts)
      if (data.contexts.length === 1 && !contextStore.activeContextId) {
        contextStore.switchContext(data.contexts[0]!.id)
      }
    } catch (e) {
      if (isApiError(e) && e.response?.status === 401) {
        // Token invalid/expired — clear and stay on login
        session.clear()
        contextStore.clearContexts()
      }
      // other errors: stay with what we have; interceptor handles 401 globally
    }
  }

  return { loading, error, login, logout, hydrate }
}

// ─── helpers ────────────────────────────────────────────────────────────────

/** Map BE snake_case user payload to FE SessionUser (camelCase). */
function mapUser(u: LoginResponse['user'] | MeResponse['user']): SessionUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    mustChangePassword: u.must_change_password,
  }
}

function unknownError(): NormalizedApiError {
  return {
    code: 'UNKNOWN_ERROR',
    message: 'Terjadi kesalahan. Silakan coba lagi.',
    fieldErrors: {},
    requestId: null,
    httpStatus: 0,
  }
}

async function redirectAfterLogin(): Promise<void> {
  const { router } = await import('@/app/router')
  const user = session.getUser()

  if (user?.mustChangePassword) {
    await router.replace({ name: 'auth.change-initial-password' })
    return
  }

  // Pick shell based on active context type
  const { useContextStore } = await import('@/contexts/stores/context')
  const ctxStore = useContextStore()
  const ctxType = ctxStore.activeContext?.type

  const contextShellRoute: Record<string, string> = {
    household: 'app.home',
    management: 'manage.dashboard',
    vendor: 'vendor.dashboard',
    system: 'system.overview',
  }

  const dest = (ctxType && contextShellRoute[ctxType]) ?? 'app.home'

  // Honor ?redirect= param if present and safe (same origin)
  const redirectParam = router.currentRoute.value.query['redirect'] as string | undefined
  if (redirectParam && redirectParam.startsWith('/')) {
    await router.replace(redirectParam)
    return
  }

  if (ctxType && !ctxStore.activeContextId) {
    // Multiple contexts — let user pick
    await router.replace({ name: 'auth.login' })
    return
  }

  await router.replace({ name: dest })
}
