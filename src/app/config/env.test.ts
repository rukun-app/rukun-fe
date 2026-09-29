import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('env validation', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('accepts valid env vars', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3000')
    vi.stubEnv('VITE_APP_ENV', 'development')
    const { env } = await import('./env')
    expect(env.VITE_API_BASE_URL).toBe('http://localhost:3000')
    expect(env.VITE_APP_ENV).toBe('development')
  })

  it('throws when VITE_API_BASE_URL is missing', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    await expect(import('./env')).rejects.toThrow()
  })
})
