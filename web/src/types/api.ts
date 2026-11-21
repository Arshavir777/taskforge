// Mirrors internal/response.Response on the Go side.
export interface ApiErrorInfo {
  code: string
  message: string
}

export interface ApiMeta {
  page?: number
  per_page?: number
  total?: number
  total_pages?: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiErrorInfo
  meta?: ApiMeta
}

export type Tier = 'free' | 'pro' | 'enterprise'

// Mirrors internal/model.User as returned by GET /api/me.
export interface User {
  id: number
  email: string
  api_key: string
  tier: Tier
  created_at: string
  updated_at: string
}

// Mirrors internal/dto.LoginResponse.
export interface LoginResponse {
  token: string
  token_type: string
  expires_at: string
}

export interface Credentials {
  email: string
  password: string
}
