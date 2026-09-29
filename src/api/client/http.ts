import axios from 'axios'
import { env } from '@/app/config/env'
import { session } from '@/auth/stores/session'

// Context transport is injected after Pinia is installed.
let _getActiveContextId: (() => string | null) | null = null

export function setContextIdProvider(fn: () => string | null): void {
  _getActiveContextId = fn
}

export const http = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Accept-Language': 'id',
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

// Keep the envelope intact: generated types describe the complete response.
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Skip redirect for the login endpoint itself (avoid redirect loop)
      const url = error.config?.url ?? ''
      if (!url.includes('/auth/login')) {
        // An old request must not clear a newer login session.
        if (error.config?.headers.Authorization !== `Bearer ${session.getToken()}`)
          return Promise.reject(error)
        session.clear()
        const { useContextStore } = await import('@/contexts/stores/context')
        useContextStore().clearContexts()
        const { queryClient } = await import('@/app/providers/query')
        queryClient.clear()
        const { router } = await import('@/app/router')
        router.replace({ name: 'auth.login' })
      }
    }
    return Promise.reject(error)
  },
)
