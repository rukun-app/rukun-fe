import { describe, it, expect, beforeEach } from 'vitest'
import { session } from '@/auth/stores/session'
import type { SessionUser } from '@/auth/stores/session'

const mockUser: SessionUser = {
  id: 'u1',
  name: 'Budi Santoso',
  email: 'budi@example.com',
  phone: '081234567890',
  mustChangePassword: false,
}

describe('session', () => {
  beforeEach(() => {
    session.clear()
  })

  it('starts unauthenticated with no user', () => {
    expect(session.isAuthenticated()).toBe(false)
    expect(session.getUser()).toBeNull()
    expect(session.getToken()).toBeNull()
  })

  it('setToken + isAuthenticated', () => {
    session.setToken('tok_abc123')
    expect(session.isAuthenticated()).toBe(true)
    expect(session.getToken()).toBe('tok_abc123')
  })

  it('setUser + getUser', () => {
    session.setUser(mockUser)
    expect(session.getUser()).toEqual(mockUser)
  })

  it('clear wipes token and user', () => {
    session.setToken('tok_xyz')
    session.setUser(mockUser)
    session.clear()
    expect(session.isAuthenticated()).toBe(false)
    expect(session.getUser()).toBeNull()
    expect(session.getToken()).toBeNull()
  })

  it('setUser with mustChangePassword=true is stored correctly', () => {
    const userPending: SessionUser = { ...mockUser, mustChangePassword: true }
    session.setUser(userPending)
    expect(session.getUser()?.mustChangePassword).toBe(true)
  })
})
