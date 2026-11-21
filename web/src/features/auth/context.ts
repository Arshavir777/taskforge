import { createContext, useContext } from 'react'
import type { Session } from '../../lib/auth'
import type { LoginResponse } from '../../types/api'

export interface AuthContextValue {
  session: Session | null
  isAuthenticated: boolean
  /** Store the token returned by POST /api/auth/login. */
  signIn: (res: LoginResponse) => void
  /** Client-side logout: the API has no logout endpoint, so we just drop the token. */
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
