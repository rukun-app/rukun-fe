import {
  login,
  logout,
  currentUser,
  forgotPassword,
  changePassword,
} from '@/api/generated/endpoints'
import type { LoginRequest, EmailRequest, ChangePasswordRequest } from '@/api/generated/models'

export async function apiLogin(data: LoginRequest) {
  return (await login(data)).data
}
export async function apiLogout() {
  await logout()
}
export async function apiFetchMe() {
  return (await currentUser()).data
}
export async function apiForgotPassword(data: EmailRequest) {
  await forgotPassword(data)
}
export async function apiChangePassword(data: ChangePasswordRequest) {
  await changePassword(data)
}
