import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ticketsApi, type ComprarTicketPayload } from './api'
import { useAuth } from '../auth/AuthContext'

export function useTicket(ticketCode: string | undefined) {
  return useQuery({
    queryKey: ['ticket', ticketCode],
    queryFn: () => ticketsApi.porCodigo(ticketCode!),
    enabled: Boolean(ticketCode && ticketCode.trim().length > 0),
    staleTime: 15 * 1000,
  })
}

export function useMisTickets() {
  const { sesion } = useAuth()
  const email = sesion.estado === 'autenticado' ? sesion.usuario.email : undefined

  return useQuery({
    queryKey: ['tickets', 'usuario', email],
    queryFn: () => ticketsApi.porUsuario(email!),
    enabled: Boolean(email),
    staleTime: 15 * 1000,
  })
}

export function useTicketsPagadosPorEvento(eventCode: string | undefined) {
  return useQuery({
    queryKey: ['tickets', 'pagados', eventCode],
    queryFn: () => ticketsApi.pagadosPorEvento(eventCode!),
    enabled: Boolean(eventCode && eventCode.trim().length > 0),
    staleTime: 15 * 1000,
  })
}

export function useComprarTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ComprarTicketPayload) => ticketsApi.comprar(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['tickets', 'usuario', data.userEmail],
      })
      queryClient.invalidateQueries({ queryKey: ['evento', data.eventCode] })
    },
  })
}

export function useCancelarTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ticketCode: string) => ticketsApi.cancelar(ticketCode),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['tickets', 'usuario', data.userEmail],
      })
      queryClient.invalidateQueries({ queryKey: ['ticket', data.ticketCode] })
      queryClient.invalidateQueries({
        queryKey: ['tickets', 'pagados', data.eventCode],
      })
    },
  })
}

export function useUsarTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ticketCode: string) => ticketsApi.usar(ticketCode),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', data.ticketCode] })
      queryClient.invalidateQueries({
        queryKey: ['tickets', 'pagados', data.eventCode],
      })
    },
  })
}
