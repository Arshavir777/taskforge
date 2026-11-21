import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { setUnauthorizedHandler } from '../../lib/api'
import { clearSession, loadSession, saveSession, type Session } from '../../lib/auth'
import type { LoginResponse } from '../../types/api'
import { AuthContext, type AuthContextValue } from './context'

// setTimeout overflows above ~24.8 days.
const MAX_TIMEOUT = 2_147_483_647

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(loadSession)

  const signOut = useCallback(() => {
    clearSession()
    setSession(null)
    queryClient.clear()
  }, [queryClient])

  const signIn = useCallback((res: LoginResponse) => {
    setSession(saveSession(res.token, res.expires_at))
  }, [])

  // Any 401 on an authenticated request means the token is no longer valid.
  useEffect(() => {
    setUnauthorizedHandler(signOut)
    return () => setUnauthorizedHandler(() => {})
  }, [signOut])

  // Log out automatically when the JWT expires.
  useEffect(() => {
    if (!session) return
    const ms = Math.min(session.expiresAt - Date.now(), MAX_TIMEOUT)
    const id = setTimeout(signOut, Math.max(ms, 0))
    return () => clearTimeout(id)
  }, [session, signOut])

  // Keep tabs in sync: signing in or out in one tab applies to the others.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== null && !e.key.startsWith('taskforge.')) return
      // Storage events only fire for changes made by *other* tabs, so the user may
      // have changed (logout, or login as someone else): drop cached user data.
      queryClient.clear()
      const next = loadSession()
      setSession((prev) => (prev?.token === next?.token ? prev : next))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({ session, isAuthenticated: session !== null, signIn, signOut }),
    [session, signIn, signOut],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
