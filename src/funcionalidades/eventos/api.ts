import { z } from 'zod'
import { http } from '../../lib/http'
import {
  EventResponseSchema,
  EventSummaryResponseSchema,
  type CreateEventForm,
  type EventResponse,
  type EventSummaryResponse,
} from './tipos'

export const eventosApi = {
  publicados: async (): Promise<EventSummaryResponse[]> => {
    return http.get<EventSummaryResponse[]>(
      '/events/published',
      undefined,
      z.array(EventSummaryResponseSchema),
    )
  },

  porCodigo: async (eventCode: string): Promise<EventResponse> => {
    return http.get<EventResponse>(
      `/events/${eventCode}`,
      undefined,
      EventResponseSchema,
    )
  },

  porArtista: async (stageName: string): Promise<EventSummaryResponse[]> => {
    return http.get<EventSummaryResponse[]>(
      '/events/by-artist',
      { params: { stageName } },
      z.array(EventSummaryResponseSchema),
    )
  },

  crear: async (datos: CreateEventForm): Promise<EventResponse> => {
    return http.post<EventResponse>('/events', datos, undefined, EventResponseSchema)
  },

  publicar: async (eventCode: string): Promise<EventResponse> => {
    return http.patch<EventResponse>(
      `/events/${eventCode}/publish`,
      undefined,
      undefined,
      EventResponseSchema,
    )
  },

  asociarArtista: async (
    eventCode: string,
    artistId: number,
  ): Promise<EventResponse> => {
    return http.post<EventResponse>(
      `/events/${eventCode}/artists/${artistId}`,
      undefined,
      undefined,
      EventResponseSchema,
    )
  },
}
