import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

// Kept separate so it can switch to "prefix + regenerate, show once" when
// API keys are stored hashed (TASK.md Phase 1).
function mask(key: string): string {
  if (key.length <= 8) return '•'.repeat(key.length)
  return `${key.slice(0, 4)}${'•'.repeat(24)}${key.slice(-4)}`
}

export function ApiKeyCard({ apiKey }: { apiKey: string }) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle')

  useEffect(() => {
    if (copied === 'idle') return
    const id = setTimeout(() => setCopied('idle'), 2000)
    return () => clearTimeout(id)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey)
      setCopied('ok')
    } catch {
      setCopied('fail')
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-base font-semibold">API key</h2>
      <p className="mt-1 text-sm text-slate-500">
        Use this key to authenticate requests from your services. Keep it secret.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <code
          className="min-w-0 flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-sm text-slate-800"
          aria-label={revealed ? 'API key' : 'API key (hidden)'}
        >
          {revealed ? apiKey : mask(apiKey)}
        </code>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setRevealed((r) => !r)} aria-pressed={revealed}>
            {revealed ? 'Hide' : 'Reveal'}
          </Button>
          <Button variant="secondary" onClick={copy}>
            {copied === 'ok' ? 'Copied' : copied === 'fail' ? 'Copy failed' : 'Copy'}
          </Button>
        </div>
      </div>
      <span className="sr-only" aria-live="polite">
        {copied === 'ok' ? 'API key copied to clipboard' : ''}
      </span>
    </Card>
  )
}
