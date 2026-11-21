import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { loginSchema, type LoginValues } from '../features/auth/schemas'
import { useLogin } from '../features/auth/useLogin'
import { ApiError } from '../lib/api'

function loginErrorMessage(err: unknown): string {
  if (err instanceof ApiError && err.code === 'INVALID_CREDENTIALS') return 'Invalid email or password.'
  if (err instanceof Error) return err.message
  return 'Something went wrong. Please try again.'
}

export function LoginPage() {
  const [params] = useSearchParams()
  const login = useLogin()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  // On success AuthProvider updates the session and GuestRoute redirects to ?next.
  const onSubmit = handleSubmit((values) => login.mutate(values))

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-slate-500">Welcome back. Enter your details to continue.</p>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        {login.isError && <Alert>{loginErrorMessage(login.error)}</Alert>}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" className="w-full" loading={login.isPending}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        No account yet?{' '}
        <Link
          to={{ pathname: '/register', search: params.toString() }}
          className="font-medium text-brand-600 hover:text-brand-700"
        >
          Create one
        </Link>
      </p>
    </Card>
  )
}
