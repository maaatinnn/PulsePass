import { z } from 'zod'
import { http } from '../../lib/http'
import { VenueResponseSchema, type CreateVenueForm, type VenueResponse } from './tipos'

export const sedesApi = {
  activas: async (): Promise<VenueResponse[]> => {
    return http.get<VenueResponse[]>(
      '/venues/active',
      undefined,
      z.array(VenueResponseSchema),
    )
  },

  // Solo ADMIN: incluye también las sedes inactivas
  todas: async (): Promise<VenueResponse[]> => {
    return http.get<VenueResponse[]>(
      '/venues',
      undefined,
      z.array(VenueResponseSchema),
    )
  },

  porCodigo: async (code: string): Promise<VenueResponse> => {
    return http.get<VenueResponse>(`/venues/${code}`, undefined, VenueResponseSchema)
  },

  crear: async (datos: CreateVenueForm): Promise<VenueResponse> => {
    return http.post<VenueResponse>('/venues', datos, undefined, VenueResponseSchema)
  },

  eliminar: async (code: string): Promise<void> => {
    await http.delete<void>(`/venues/${code}`)
  },
}
