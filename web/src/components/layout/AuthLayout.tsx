import { Outlet } from 'react-router'
import { Logo } from './Logo'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-sm">
        <Outlet />
      </div>
      <p className="mt-8 text-xs text-slate-400">Reliable job processing on Postgres</p>
    </div>
  )
}
