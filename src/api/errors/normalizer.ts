import axios from 'axios'
import type { AxiosError } from 'axios'
import type { NormalizedApiError, ApiFieldErrors } from './types'

interface BackendErrorBody {
  code?: string
  message?: string
  errors?: Record<string, string | string[]>
}

export function normalizeApiError(error: unknown): NormalizedApiError {
  if (!axios.isAxiosError(error))
    return {
      code: 'UNKNOWN_ERROR',
      message: 'Terjadi kesalahan. Silakan coba lagi.',
      fieldErrors: {},
      requestId: null,
      httpStatus: 0,
    }
  const status = error.response?.status ?? 0
  const requestId = (error.response?.headers?.['x-request-id'] as string | undefined) ?? null
  const body = error.response?.data as BackendErrorBody | undefined

  const code = body?.code ?? deriveCode(status)
  const message = body?.message ?? error.message ?? 'Terjadi kesalahan. Silakan coba lagi.'

  const fieldErrors: ApiFieldErrors = {}
  if (body?.errors) {
    for (const [field, msgs] of Object.entries(body.errors)) {
      fieldErrors[field] = Array.isArray(msgs) ? msgs : [msgs]
    }
  }

  return { code, message, fieldErrors, requestId, httpStatus: status }
}

function deriveCode(status: number): string {
  if (status === 401) return 'UNAUTHENTICATED'
  if (status === 403) return 'FORBIDDEN'
  if (status === 404) return 'NOT_FOUND'
  if (status === 409) return 'CONFLICT'
  if (status === 422) return 'VALIDATION_ERROR'
  if (status === 429) return 'RATE_LIMITED'
  if (status >= 500) return 'SERVER_ERROR'
  return 'UNKNOWN_ERROR'
}

export function isApiError(error: unknown): error is AxiosError {
  return axios.isAxiosError(error)
}
