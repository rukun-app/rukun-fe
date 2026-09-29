import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from './mutator'
import { http } from './http'
vi.mock('./http', () => ({ http: { request: vi.fn() } }))
beforeEach(() => {
  vi.mocked(http.request).mockReset()
})
describe('generated client transport', () => {
  it('strips the API prefix once and preserves the backend envelope and cancellation', async () => {
    const signal = new AbortController().signal
    const envelope = { success: true, data: { data: [], next_cursor: 'opaque' } }
    vi.mocked(http.request).mockResolvedValue({ data: envelope })
    expect(await apiRequest({ url: '/api/community/households', method: 'GET', signal })).toEqual(
      envelope,
    )
    expect(http.request).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/community/households', signal }),
    )
  })
  it('passes idempotency headers through to Axios', async () => {
    vi.mocked(http.request).mockResolvedValue({ data: {} })
    await apiRequest(
      { url: '/api/community/households', method: 'POST' },
      { headers: { 'Idempotency-Key': 'same-intent' } },
    )
    expect(http.request).toHaveBeenCalledWith(
      expect.objectContaining({ headers: { 'Idempotency-Key': 'same-intent' } }),
    )
  })
})
