import { Link } from 'react-router'
import { useAuth } from '../../features/auth/context'
import { buttonClasses } from '../ui/buttonStyles'
import { Logo } from './Logo'

export function PublicHeader() {
  const { isAuthenticated } = useAuth()

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
        <Logo />
        <nav className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link to="/profile" className={buttonClasses('primary', 'sm')}>
              Go to profile
            </Link>
          ) : (
            <>
              <Link to="/login" className={buttonClasses('ghost', 'sm')}>
                Log in
              </Link>
              <Link to="/register" className={buttonClasses('primary', 'sm')}>
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
