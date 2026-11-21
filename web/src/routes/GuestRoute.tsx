import { Navigate, Outlet, useSearchParams } from 'react-router'
import { useAuth } from '../features/auth/context'
import { safeNext } from './safeNext'

/** Keeps signed-in users away from /login and /register. */
export function GuestRoute() {
  const { isAuthenticated } = useAuth()
  const [params] = useSearchParams()

  if (isAuthenticated) return <Navigate to={safeNext(params.get('next'))} replace />
  return <Outlet />
}
