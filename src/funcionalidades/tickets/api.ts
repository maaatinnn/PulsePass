import { z } from 'zod'
import { http } from '../../lib/http'
import {
  TicketResponseSchema,
  type TicketResponse,
  type TicketType,
} from './tipos'

export interface ComprarTicketPayload {
  userEmail: string
  eventCode: string
  type: TicketType
}

export const ticketsApi = {
  comprar: async (payload: ComprarTicketPayload): Promise<TicketResponse> => {
    return http.post<TicketResponse>('/tickets', payload, undefined, TicketResponseSchema)
  },

  porCodigo: async (ticketCode: string): Promise<TicketResponse> => {
    return http.get<TicketResponse>(
      `/tickets/${ticketCode}`,
      undefined,
      TicketResponseSchema,
    )
  },

  porUsuario: async (email: string): Promise<TicketResponse[]> => {
    return http.get<TicketResponse[]>(
      '/tickets/by-user',
      { params: { email } },
      z.array(TicketResponseSchema),
    )
  },

  pagadosPorEvento: async (eventCode: string): Promise<TicketResponse[]> => {
    return http.get<TicketResponse[]>(
      `/events/${eventCode}/tickets/paid`,
      undefined,
      z.array(TicketResponseSchema),
    )
  },

  cancelar: async (ticketCode: string): Promise<TicketResponse> => {
    return http.patch<TicketResponse>(
      `/tickets/${ticketCode}/cancel`,
      undefined,
      undefined,
      TicketResponseSchema,
    )
  },

  usar: async (ticketCode: string): Promise<TicketResponse> => {
    return http.patch<TicketResponse>(
      `/tickets/${ticketCode}/use`,
      undefined,
      undefined,
      TicketResponseSchema,
    )
  },
}
