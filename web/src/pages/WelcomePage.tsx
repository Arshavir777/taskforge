import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router'
import { PublicHeader } from '../components/layout/PublicHeader'
import { Badge } from '../components/ui/Badge'
import { buttonClasses } from '../components/ui/buttonStyles'
import { cn } from '../components/ui/cn'
import { useAuth } from '../features/auth/context'
import { guarantees, plans, services, steps, type IconName } from '../features/welcome/content'
import { useInView } from '../features/welcome/useInView'

const STAGGER_MS = 80

const delay = (i: number): CSSProperties => ({ animationDelay: `${i * STAGGER_MS}ms` })

/** Fades its content up the first time it scrolls into view. Off when the user prefers reduced motion. */
function Reveal({ children, index = 0, className }: { children: ReactNode; index?: number; className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <div
      ref={ref}
      style={delay(index)}
      className={cn(inView ? 'motion-safe:animate-fade-up' : 'motion-safe:opacity-0', className)}
    >
      {children}
    </div>
  )
}

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold text-brand-600">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-3 text-slate-600">{subtitle}</p>}
    </Reveal>
  )
}

const iconPaths: Record<IconName, ReactNode> = {
  webhook: (
    <>
      <path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2" />
      <path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06" />
      <path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8" />
    </>
  ),
  table: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21" />
    </>
  ),
  mail: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </>
  ),
  chart: <path d="M3 3v18h18M7 16v-4M12 16V8M17 16v-7" />,
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </>
  ),
}

function Icon({ name }: { name: IconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  )
}

function Hero() {
  const { isAuthenticated } = useAuth()

  return (
    <section className="relative isolate overflow-hidden">
      {/* Soft background glow */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 size-[28rem] -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl motion-safe:animate-float sm:size-[36rem]" />
        <div className="absolute top-40 -right-24 size-72 rounded-full bg-amber-300/20 blur-3xl motion-safe:animate-float [animation-delay:-5s]" />
      </div>

      <div className="mx-auto max-w-3xl px-4 pt-20 pb-16 text-center sm:pt-28 sm:pb-24">
        <p
          style={delay(0)}
          className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-600/20 motion-safe:animate-fade-up"
        >
          <span className="size-1.5 rounded-full bg-brand-500" />
          Job processing on Postgres
        </p>
        <h1
          style={delay(1)}
          className="mt-6 text-4xl font-semibold tracking-tight text-balance text-slate-900 motion-safe:animate-fade-up sm:text-6xl"
        >
          Reliable background jobs, <span className="text-brand-600">without the Redis.</span>
        </h1>
        <p
          style={delay(2)}
          className="mx-auto mt-5 max-w-xl text-lg text-pretty text-slate-600 motion-safe:animate-fade-up"
        >
          TaskForge runs your webhooks, imports, emails and reports in the background, with retries, live progress and
          no lost work.
        </p>
        <div
          style={delay(3)}
          className="mt-8 flex flex-wrap items-center justify-center gap-3 motion-safe:animate-fade-up"
        >
          {isAuthenticated ? (
            <Link to="/profile" className={buttonClasses('primary', 'lg')}>
              Open your profile
            </Link>
          ) : (
            <>
              <Link to="/register" className={buttonClasses('primary', 'lg')}>
                Get started free
              </Link>
              <Link to="/login" className={buttonClasses('secondary', 'lg')}>
                Log in
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

function Services() {
  return (
    <section id="services" className="py-16 sm:py-20">
      <SectionHeading
        eyebrow="Services"
        title="Ready-made jobs for common work"
        subtitle="Each job type has its own queue, timeout and retry policy, so one slow task never blocks the rest."
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s, i) => (
          <Reveal key={s.tag} index={i} className="h-full">
            <article className="group h-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-brand-600/30 hover:shadow-md">
              <div className="grid size-10 place-items-center rounded-lg bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                <Icon name={s.icon} />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{s.description}</p>
              <code className="mt-4 inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-500">
                {s.tag}
              </code>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section className="py-16 sm:py-20">
      <SectionHeading eyebrow="How it works" title="From request to result in three steps" />
      <ol className="mt-12 grid gap-8 md:grid-cols-3">
        {steps.map((step, i) => (
          <li key={step.title}>
            <Reveal index={i} className="flex gap-4 md:flex-col">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                {i + 1}
              </span>
              <div>
                <h3 className="font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-1.5 text-sm text-slate-600">{step.description}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Guarantees() {
  return (
    <section className="py-16 sm:py-20">
      <Reveal className="rounded-2xl bg-slate-900 px-6 py-10 text-white sm:px-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-brand-100">Reliability</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Built for when things go wrong</h2>
            <p className="mt-3 text-sm text-slate-300">
              Networks fail and servers restart. These guarantees are part of every job.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {guarantees.map((g) => (
              <li key={g} className="flex items-start gap-3 text-sm text-slate-200">
                <svg
                  viewBox="0 0 20 20"
                  className="mt-0.5 size-4 shrink-0 text-emerald-400"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.58l7.3-7.3a1 1 0 0 1 1.4 0Z"
                    clipRule="evenodd"
                  />
                </svg>
                {g}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  )
}

function Plans() {
  return (
    <section className="py-16 sm:py-20">
      <SectionHeading eyebrow="Plans" title="Start free, grow when you need to" />
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {plans.map((p, i) => (
          <Reveal key={p.tier} index={i} className="h-full">
            <div className="h-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <Badge tone={p.tone}>{p.tier}</Badge>
              <p className="mt-4 text-sm text-slate-600">{p.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function CallToAction() {
  const { isAuthenticated } = useAuth()

  return (
    <section className="py-16 sm:py-20">
      <Reveal className="rounded-2xl bg-brand-600 px-6 py-12 text-center text-white sm:px-10">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {isAuthenticated ? 'Your workspace is ready' : 'Start with a free account'}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-brand-100">
          {isAuthenticated
            ? 'Grab your API key from your profile and submit your first job.'
            : 'Sign up in seconds and get an API key to submit your first job.'}
        </p>
        <Link
          to={isAuthenticated ? '/profile' : '/register'}
          className={buttonClasses(
            'secondary',
            'lg',
            'mt-8 text-brand-700 ring-0 hover:bg-brand-50 focus-visible:outline-white',
          )}
        >
          {isAuthenticated ? 'Go to profile' : 'Create account'}
        </Link>
      </Reveal>
    </section>
  )
}

export function WelcomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <PublicHeader />
      <main>
        <Hero />
        <div className="mx-auto max-w-5xl px-4">
          <Services />
          <HowItWorks />
          <Guarantees />
          <Plans />
          <CallToAction />
        </div>
      </main>
      <footer className="border-t border-slate-200">
        <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-slate-500">
          TaskForge · Reliable job processing on Postgres
        </div>
      </footer>
    </div>
  )
}
