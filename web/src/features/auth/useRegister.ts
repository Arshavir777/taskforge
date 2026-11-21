import { useMutation } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { Credentials, LoginResponse, User } from '../../types/api'
import { useAuth } from './context'

/** Registers, then logs in with the same credentials so the user lands signed in. */
export function useRegister() {
  const { signIn } = useAuth()
  return useMutation({
    mutationFn: async (creds: Credentials) => {
      await api.post<User>('/auth/register', creds)
      return api.post<LoginResponse>('/auth/login', creds)
    },
    onSuccess: signIn,
  })
}
