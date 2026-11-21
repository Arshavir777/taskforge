import { useMutation } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { Credentials, LoginResponse } from '../../types/api'
import { useAuth } from './context'

export function useLogin() {
  const { signIn } = useAuth()
  return useMutation({
    mutationFn: (creds: Credentials) => api.post<LoginResponse>('/auth/login', creds),
    onSuccess: signIn,
  })
}
