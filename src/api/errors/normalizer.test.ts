import { describe, expect, it } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { normalizeApiError } from './normalizer'

describe('API errors', () => {
  it('preserves stable error codes, field errors, and support request ID', () => {
    const config = { headers: new AxiosHeaders() }
    const error = new AxiosError('Rejected', 'ERR_BAD_REQUEST', config, undefined, {
      status: 422,
      statusText: 'Unprocessable Entity',
      config,
      headers: { 'x-request-id': 'request-123' },
      data: {
        code: 'validation.failed',
        message: 'Data tidak valid',
        errors: { name: ['Nama wajib diisi'], address: 'Alamat wajib diisi' },
      },
    })
    expect(normalizeApiError(error)).toEqual({
      code: 'validation.failed',
      message: 'Data tidak valid',
      fieldErrors: { name: ['Nama wajib diisi'], address: ['Alamat wajib diisi'] },
      requestId: 'request-123',
      httpStatus: 422,
    })
  })
  it('handles network errors without assuming a response exists', () => {
    expect(normalizeApiError(new AxiosError('Network Error')).httpStatus).toBe(0)
  })
  it('does not expose unexpected exception details to the screen', () => {
    const normalized = normalizeApiError(new Error('internal token=private'))
    expect(normalized.message).not.toContain('private')
    expect(normalized.code).toBe('UNKNOWN_ERROR')
  })
})
