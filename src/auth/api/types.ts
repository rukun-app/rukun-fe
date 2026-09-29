import type { UserContext } from '@/contexts/stores/context'

export interface LoginRequest {
  /** email or phone — backend accepts either */
  identifier: string
  password: string
  /** Sanctum token name; use 'web' for browser clients */
  device_name: string
}

export interface LoginResponse {
  token: string
  user: {
    id: string
    name: string
    email: string | null
    phone: string | null
    must_change_password: boolean
  }
  // ponytail: contexts shape to be confirmed against BE OpenAPI once /api/auth/me is documented;
  // upgrade: align with BE's effective_access / role_assignments response when Swagger is available.
  contexts: UserContext[]
}

export interface MeResponse {
  user: {
    id: string
    name: string
    email: string | null
    phone: string | null
    must_change_password: boolean
  }
  contexts: UserContext[]
}

export interface ForgotPasswordRequest {
  /** email or phone */
  identifier: string
}

/** PUT /api/auth/password — Laravel convention field names */
export interface ChangePasswordRequest {
  current_password: string
  password: string
  password_confirmation: string
}
