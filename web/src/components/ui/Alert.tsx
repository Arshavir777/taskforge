import type { ReactNode } from 'react'
import { cn } from './cn'

type Tone = 'error' | 'info' | 'success'

const tones: Record<Tone, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-brand-100 bg-brand-50 text-brand-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
}

export function Alert({ tone = 'error', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('rounded-lg border px-3 py-2.5 text-sm', tones[tone])}
    >
      {children}
    </div>
  )
}
