/**
 * Session abstraction — business code must not access token storage directly.
 * ponytail: migrate to httpOnly cookie by swapping this module when backend supports it.
 */
const TOKEN_KEY = 'rukun:token'

export const session = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
  },

  clear(): void {
    localStorage.removeItem(TOKEN_KEY)
  },
}
