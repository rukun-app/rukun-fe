import axios from 'axios'
import { env } from '@/app/config/env'
import { session } from '@/auth/stores/session'

// ponytail: inject activeContextId via useContextStore() when Pinia is available post-FE-2
// For now, context store reads are done via direct import to avoid circular deps at bootstrap.
let _getActiveContextId: (() => string | null) | null = null

export function setContextIdProvider(fn: () => string | null): void {
  _getActiveContextId = fn
}

export const http = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

http.interceptors.request.use((config) => {
  const token = session.getToken()
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }

  const contextId = _getActiveContextId?.()
  if (contextId) {
    config.headers['X-Rukun-Context'] = contextId
  }

  config.headers['X-Request-ID'] = crypto.randomUUID()

  return config
})

// Unwrap BE envelope: {"success": true, "data": {...}} → response.data = inner data
http.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      response.data = response.data.data
    }
    return response
  },
  async (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Skip redirect for the login endpoint itself (avoid redirect loop)
      const url = error.config?.url ?? ''
      if (!url.includes('/auth/login')) {
        session.clear()
        const { useContextStore } = await import('@/contexts/stores/context')
        useContextStore().clearContexts()
        const { router } = await import('@/app/router')
        router.replace({ name: 'auth.login' })
      }
    }
    return Promise.reject(error)
  },
)
