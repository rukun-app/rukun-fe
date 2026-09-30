import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { http, setContextIdProvider } from './http'
import { session } from '@/auth/stores/session'
import { setLocale } from '@/i18n'
vi.mock('@/app/config/env', () => ({ env: { VITE_API_BASE_URL: '/api' } }))
beforeEach(() => {
  setLocale('id')
  session.clear()
  setContextIdProvider(() => null)
})
afterEach(() => {
  setLocale('id')
  session.clear()
  setContextIdProvider(() => null)
})
async function capture(url: string) {
  let actual: InternalAxiosRequestConfig | undefined
  await http.get(url, {
    adapter: async (config) => {
      actual = config
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
    },
  })
  return actual!
}
describe('HTTP locale and public authentication', () => {
  it('defaults to ID and follows live locale changes on every request', async () => {
    expect((await capture('/community/areas')).headers['Accept-Language']).toBe('id')
    setLocale('en')
    expect((await capture('/community/areas')).headers['Accept-Language']).toBe('en')
    setLocale('id')
    expect((await capture('/community/areas')).headers['Accept-Language']).toBe('id')
  })
  it('uses in-memory preference even when browser storage is unavailable', async () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    try {
      setLocale('en')
      expect((await capture('/auth/forgot-password')).headers['Accept-Language']).toBe('en')
    } finally {
      spy.mockRestore()
    }
  })
  it('preserves authentication and scope for protected requests', async () => {
    session.setToken('session-test-token')
    setContextIdProvider(() => 'rt:test')
    const config = await capture('/community/areas')
    expect(config.headers.Authorization).toBe('Bearer session-test-token')
    expect(config.headers['X-Rukun-Context']).toBe('rt:test')
    expect(config.headers['X-Request-ID']).toBeTruthy()
  })
  it('does not attach old authentication or scope to public login and recovery', async () => {
    session.setToken('old-session')
    setContextIdProvider(() => 'rt:test')
    for (const path of ['/auth/login', '/auth/forgot-password', '/auth/reset-password']) {
      const config = await capture(path)
      expect(config.headers.Authorization).toBeUndefined()
      expect(config.headers['X-Rukun-Context']).toBeUndefined()
    }
  })
  it('public reset failure does not clear another existing session', async () => {
    session.setToken('existing-session')
    await expect(
      http.post(
        '/auth/reset-password',
        {},
        {
          adapter: async (config) => {
            throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
              data: {},
              status: 401,
              statusText: 'Unauthorized',
              headers: {},
              config,
            })
          },
        },
      ),
    ).rejects.toThrow('Unauthorized')
    expect(session.getToken()).toBe('existing-session')
  })
})
