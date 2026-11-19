import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { artistasApi } from './api'
import type { CreateArtistForm } from './tipos'

export function useArtistasActivos() {
  return useQuery({
    queryKey: ['artistas', 'activos'],
    queryFn: artistasApi.activos,
    staleTime: 5 * 60 * 1000,
  })
}

export function useArtistasAdmin() {
  return useQuery({
    queryKey: ['artistas', 'todos'],
    queryFn: artistasApi.todos,
    staleTime: 30 * 1000,
  })
}

export function useArtista(id: number | string | undefined) {
  const numId = Number(id)
  return useQuery({
    queryKey: ['artista', numId],
    queryFn: () => artistasApi.porId(numId),
    enabled: !isNaN(numId) && numId > 0,
    staleTime: 5 * 60 * 1000,
  })
}

export function useArtistaPorNombre(stageName: string | undefined) {
  return useQuery({
    queryKey: ['artista', 'nombre', stageName],
    queryFn: () => artistasApi.porStageName(stageName!),
    enabled: Boolean(stageName && stageName.trim().length > 0),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCrearArtista() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (datos: CreateArtistForm) => artistasApi.crear(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artistas'] })
    },
  })
}

export function useEliminarArtista() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => artistasApi.eliminar(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: ['artista', id] })
      queryClient.invalidateQueries({ queryKey: ['artistas'] })
    },
  })
}
