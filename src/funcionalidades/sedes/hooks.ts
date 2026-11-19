import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sedesApi } from './api'
import type { CreateVenueForm } from './tipos'

export function useSedesActivas() {
  return useQuery({
    queryKey: ['sedes', 'activas'],
    queryFn: sedesApi.activas,
    staleTime: 5 * 60 * 1000,
  })
}

export function useSedesAdmin() {
  return useQuery({
    queryKey: ['sedes', 'todas'],
    queryFn: sedesApi.todas,
    staleTime: 30 * 1000,
  })
}

export function useSede(code: string | undefined) {
  return useQuery({
    queryKey: ['sede', code],
    queryFn: () => sedesApi.porCodigo(code!),
    enabled: Boolean(code && code.trim().length > 0),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCrearSede() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (datos: CreateVenueForm) => sedesApi.crear(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sedes'] })
    },
  })
}

export function useEliminarSede() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => sedesApi.eliminar(code),
    onSuccess: (_, code) => {
      queryClient.removeQueries({ queryKey: ['sede', code] })
      queryClient.invalidateQueries({ queryKey: ['sedes'] })
    },
  })
}
