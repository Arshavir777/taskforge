import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ApiKeyCard } from '../features/user/ApiKeyCard'
import { useMe } from '../features/user/useMe'
import type { Tier } from '../types/api'

const tierTone: Record<Tier, 'slate' | 'brand' | 'amber'> = {
  free: 'slate',
  pro: 'brand',
  enterprise: 'amber',
}

const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'long' })

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-900 sm:col-span-2 sm:mt-0">{children}</dd>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading profile">
      {[0, 1].map((i) => (
        <Card key={i} className="animate-pulse p-6">
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="mt-4 space-y-3">
            <div className="h-3 w-full rounded bg-slate-100" />
            <div className="h-3 w-2/3 rounded bg-slate-100" />
          </div>
        </Card>
      ))}
    </div>
  )
}

export function ProfilePage() {
  const { data: me, isPending, isError, error, refetch, isRefetching } = useMe()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Your account details and credentials.</p>
      </div>

      {isPending ? (
        <ProfileSkeleton />
      ) : isError ? (
        <div className="space-y-3">
          <Alert>{error.message}</Alert>
          <Button variant="secondary" onClick={() => refetch()} loading={isRefetching}>
            Try again
          </Button>
        </div>
      ) : (
        <>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-100 text-lg font-semibold uppercase text-brand-700">
                {me.email.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">{me.email}</p>
                <div className="mt-1">
                  <Badge tone={tierTone[me.tier] ?? 'slate'}>{me.tier}</Badge>
                </div>
              </div>
            </div>
            <dl className="mt-6 divide-y divide-slate-100 border-t border-slate-100">
              <Field label="Email">{me.email}</Field>
              <Field label="Plan">
                <span className="capitalize">{me.tier}</span>
              </Field>
              <Field label="Member since">{dateFmt.format(new Date(me.created_at))}</Field>
              <Field label="User ID">
                <span className="font-mono">{me.id}</span>
              </Field>
            </dl>
          </Card>

          <ApiKeyCard apiKey={me.api_key} />
        </>
      )}
    </div>
  )
}
