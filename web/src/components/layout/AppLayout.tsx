import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../../features/auth/context'
import { useMe } from '../../features/user/useMe'
import { Button } from '../ui/Button'
import { cn } from '../ui/cn'
import { Logo } from './Logo'

const navItems = [{ to: '/profile', label: 'Profile' }]

export function AppLayout() {
  const { signOut } = useAuth()
  const { data: me } = useMe()

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <Logo />
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                      isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {me && <span className="hidden truncate text-sm text-slate-500 sm:inline">{me.email}</span>}
            <Button variant="secondary" size="sm" onClick={signOut}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
