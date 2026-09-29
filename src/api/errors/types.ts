export interface ApiFieldErrors {
  [field: string]: string[]
}

export interface NormalizedApiError {
  code: string
  message: string
  fieldErrors: ApiFieldErrors
  requestId: string | null
  httpStatus: number
}
