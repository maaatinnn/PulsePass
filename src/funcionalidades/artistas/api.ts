import { z } from 'zod'
import { http } from '../../lib/http'
import {
  ArtistResponseSchema,
  type ArtistResponse,
  type CreateArtistForm,
} from './tipos'

export const artistasApi = {
  activos: async (): Promise<ArtistResponse[]> => {
    return http.get<ArtistResponse[]>(
      '/artists/active',
      undefined,
      z.array(ArtistResponseSchema),
    )
  },

  // Solo ADMIN: incluye también los artistas inactivos
  todos: async (): Promise<ArtistResponse[]> => {
    return http.get<ArtistResponse[]>(
      '/artists',
      undefined,
      z.array(ArtistResponseSchema),
    )
  },

  porId: async (id: number): Promise<ArtistResponse> => {
    return http.get<ArtistResponse>(`/artists/${id}`, undefined, ArtistResponseSchema)
  },

  porStageName: async (stageName: string): Promise<ArtistResponse> => {
    return http.get<ArtistResponse>(
      '/artists/by-stage-name',
      { params: { stageName } },
      ArtistResponseSchema,
    )
  },

  crear: async (datos: CreateArtistForm): Promise<ArtistResponse> => {
    return http.post<ArtistResponse>('/artists', datos, undefined, ArtistResponseSchema)
  },

  eliminar: async (id: number): Promise<void> => {
    await http.delete<void>(`/artists/${id}`)
  },
}
