import { useQuery } from '@tanstack/react-query'
import { usuariosApi } from './api'

export function useUsuarioPorEmail(email: string | undefined) {
  return useQuery({
    queryKey: ['usuario', email],
    queryFn: () => usuariosApi.porEmail(email!),
    enabled: Boolean(email && email.trim().length > 0),
    staleTime: 60 * 1000,
  })
}

export function useUsuarioPorUsername(username: string | undefined) {
  return useQuery({
    queryKey: ['usuario', 'username', username],
    queryFn: () => usuariosApi.porUsername(username!),
    enabled: Boolean(username && username.trim().length > 0),
    staleTime: 60 * 1000,
  })
}
