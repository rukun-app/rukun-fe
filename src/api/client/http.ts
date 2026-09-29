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
