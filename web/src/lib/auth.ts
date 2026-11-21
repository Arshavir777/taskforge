// JWT storage. localStorage keeps the session across reloads; an httpOnly cookie
// would be safer against XSS but needs backend support (see plan / future ADR).
const TOKEN_KEY = 'taskforge.token'
const EXPIRES_KEY = 'taskforge.expires_at'

export interface Session {
  token: string
  expiresAt: number // epoch ms
}

// In-memory copy so the API client can read the token synchronously.
let current: Session | null = null

export function currentSession(): Session | null {
  return current
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function loadSession(): Session | null {
  const token = safeGet(TOKEN_KEY)
  const expires = Date.parse(safeGet(EXPIRES_KEY) ?? '')
  if (!token || Number.isNaN(expires) || expires <= Date.now()) {
    clearSession()
    return null
  }
  current = { token, expiresAt: expires }
  return current
}

export function saveSession(token: string, expiresAt: string): Session {
  try {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(EXPIRES_KEY, expiresAt)
  } catch {
    // Storage unavailable (private mode etc.): session lives in memory only.
  }
  current = { token, expiresAt: Date.parse(expiresAt) }
  return current
}

export function clearSession(): void {
  current = null
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(EXPIRES_KEY)
  } catch {
    // ignore
  }
}
