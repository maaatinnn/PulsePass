import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { eventosApi } from './api'
import type { CreateEventForm } from './tipos'

export function useEventosPublicados() {
  return useQuery({
    queryKey: ['eventos', 'publicados'],
    queryFn: eventosApi.publicados,
    staleTime: 60 * 1000,
  })
}

export function useEvento(eventCode: string | undefined) {
  return useQuery({
    queryKey: ['evento', eventCode],
    queryFn: () => eventosApi.porCodigo(eventCode!),
    enabled: Boolean(eventCode && eventCode.trim().length > 0),
    staleTime: 30 * 1000,
  })
}

export function useEventosPorArtista(stageName: string | undefined) {
  return useQuery({
    queryKey: ['eventos', 'artista', stageName],
    queryFn: () => eventosApi.porArtista(stageName!),
    enabled: Boolean(stageName && stageName.trim().length > 0),
    staleTime: 60 * 1000,
  })
}

export function useCrearEvento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (datos: CreateEventForm) => eventosApi.crear(datos),
    onSuccess: (data) => {
      queryClient.setQueryData(['evento', data.eventCode], data)
      queryClient.invalidateQueries({ queryKey: ['eventos', 'publicados'] })
    },
  })
}

export function usePublicarEvento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (eventCode: string) => eventosApi.publicar(eventCode),
    onSuccess: (_, eventCode) => {
      queryClient.invalidateQueries({ queryKey: ['evento', eventCode] })
      queryClient.invalidateQueries({ queryKey: ['eventos', 'publicados'] })
    },
  })
}

export function useAsociarArtista() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      eventCode,
      artistId,
    }: {
      eventCode: string
      artistId: number
    }) => eventosApi.asociarArtista(eventCode, artistId),
    onSuccess: (_, { eventCode }) => {
      queryClient.invalidateQueries({ queryKey: ['evento', eventCode] })
      queryClient.invalidateQueries({ queryKey: ['eventos'] })
    },
  })
}
