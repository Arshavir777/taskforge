import type { ApiResponse } from '../types/api'
import { currentSession } from './auth'

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

// Set by AuthProvider so an expired/invalid token signs the user out.
let onUnauthorized: () => void = () => {}

export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = currentSession()?.token
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server. Is the API running?')
  }

  let envelope: ApiResponse<T> | null = null
  try {
    envelope = (await res.json()) as ApiResponse<T>
  } catch {
    // Non-JSON body (e.g. proxy error page).
  }

  if (!res.ok || !envelope?.success) {
    // Only treat 401 as "session expired" when we actually sent a token;
    // a 401 from /auth/login means wrong credentials.
    if (res.status === 401 && token) onUnauthorized()
    // The dev proxy answers 502/504 with no envelope when the Go API is down.
    if (!envelope && (res.status === 502 || res.status === 504)) {
      throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server. Is the API running?')
    }
    throw new ApiError(
      res.status,
      envelope?.error?.code ?? 'UNKNOWN_ERROR',
      envelope?.error?.message ?? `Request failed (${res.status})`,
    )
  }

  return envelope.data as T
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}
