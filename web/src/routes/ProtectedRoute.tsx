import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../features/auth/context'

/** Renders child routes only for signed-in users; otherwise sends them to /login?next=... */
export function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }
  return <Outlet />
}
