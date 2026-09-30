import axios from 'axios'
import { env } from '@/app/config/env'
import { session } from '@/auth/stores/session'
import { i18n } from '@/i18n'

function isPublicAuthRequest(url = '') {
  const path = url.split('?')[0]
  return ['/auth/login', '/auth/forgot-password', '/auth/reset-password'].some((endpoint) =>
    path?.endsWith(endpoint),
  )
}

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
  const publicAuth = isPublicAuthRequest(config.url)
  const token = session.getToken()
  if (publicAuth) {
    config.headers.delete('Authorization')
    config.headers.delete('X-Rukun-Context')
  } else if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }

  const contextId = _getActiveContextId?.()
  if (contextId && !publicAuth) {
    config.headers['X-Rukun-Context'] = contextId
  }

  config.headers['Accept-Language'] = i18n.global.locale.value === 'en' ? 'en' : 'id'
  config.headers['X-Request-ID'] = crypto.randomUUID()

  return config
})

// Keep the envelope intact: generated types describe the complete response.
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Public auth failures must not invalidate an unrelated existing session.
      const url = error.config?.url ?? ''
      if (!isPublicAuthRequest(url)) {
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
