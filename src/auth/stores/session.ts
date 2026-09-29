/**
 * Session abstraction — business code must not access token storage directly.
 * ponytail: migrate to httpOnly cookie by swapping this module when backend supports it.
 */

export interface SessionUser {
  id: string
  name: string
  email: string | null
  phone: string | null
  mustChangePassword: boolean
}

const TOKEN_KEY = 'rukun:token'

let _user: SessionUser | null = null

export const session = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
  },

  getUser(): SessionUser | null {
    return _user
  },

  setUser(user: SessionUser): void {
    _user = user
  },

  clear(): void {
    localStorage.removeItem(TOKEN_KEY)
    _user = null
  },

  isAuthenticated(): boolean {
    return this.getToken() !== null
  },
}
