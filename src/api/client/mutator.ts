import type { AxiosRequestConfig } from 'axios'
import { http } from './http'

export const apiRequest = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  return http
    .request<T>({ ...config, ...options, url: config.url?.replace(/^\/api(?=\/)/, '') })
    .then((response) => response.data)
}
