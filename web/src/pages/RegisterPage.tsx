import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { registerSchema, type RegisterValues } from '../features/auth/schemas'
import { useRegister } from '../features/auth/useRegister'
import { ApiError } from '../lib/api'

export function RegisterPage() {
  const [params] = useSearchParams()
  const signUp = useRegister()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) })

  const onSubmit = handleSubmit(({ email, password }) =>
    signUp.mutate(
      { email, password },
      {
        onError: (err) => {
          if (err instanceof ApiError && err.code === 'EMAIL_TAKEN') {
            setError('email', { message: 'This email is already registered.' }, { shouldFocus: true })
          }
        },
      },
    ),
  )

  // EMAIL_TAKEN is shown on the field; anything else goes in the banner.
  const bannerError =
    signUp.isError && !(signUp.error instanceof ApiError && signUp.error.code === 'EMAIL_TAKEN')
      ? signUp.error.message
      : null

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-slate-500">Start queueing jobs in under a minute.</p>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        {bannerError && <Alert>{bannerError}</Alert>}
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
          autoComplete="new-password"
          hint="8 to 72 characters."
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" className="w-full" loading={signUp.isPending}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link
          to={{ pathname: '/login', search: params.toString() }}
          className="font-medium text-brand-600 hover:text-brand-700"
        >
          Sign in
        </Link>
      </p>
    </Card>
  )
}
