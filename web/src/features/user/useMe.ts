import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { User } from '../../types/api'
import { useAuth } from '../auth/context'

export const meQueryKey = ['me'] as const

export function useMe() {
  const { session } = useAuth()
  return useQuery({
    queryKey: meQueryKey,
    queryFn: () => api.get<User>('/me'),
    enabled: session !== null,
    staleTime: 60_000,
  })
}
