import { http } from '@/api/client/http'
import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
  ForgotPasswordRequest,
  ChangePasswordRequest,
} from './types'

export async function apiLogin(data: LoginRequest): Promise<LoginResponse> {
  const res = await http.post<LoginResponse>('/auth/login', data)
  return res.data
}

export async function apiLogout(): Promise<void> {
  await http.post('/auth/logout')
}

export async function apiFetchMe(): Promise<MeResponse> {
  const res = await http.get<MeResponse>('/auth/me')
  return res.data
}

export async function apiForgotPassword(data: ForgotPasswordRequest): Promise<void> {
  await http.post('/auth/forgot-password', data)
}

export async function apiChangePassword(data: ChangePasswordRequest): Promise<void> {
  await http.put('/auth/password', data)
}
