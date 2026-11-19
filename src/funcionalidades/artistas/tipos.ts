import { z } from 'zod'

export const ArtistResponseSchema = z.object({
  id: z.number(),
  stageName: z.string(),
  country: z.string().nullable().optional(),
  genre: z.string().nullable().optional(),
  active: z.boolean(),
})

export type ArtistResponse = z.infer<typeof ArtistResponseSchema>

export const CreateArtistSchema = z.object({
  stageName: z
    .string()
    .trim()
    .min(1, 'El nombre artístico es obligatorio')
    .max(150, 'Máximo 150 caracteres'),
  country: z.string().trim().max(100, 'Máximo 100 caracteres').optional(),
  genre: z.string().trim().max(100, 'Máximo 100 caracteres').optional(),
})
export type CreateArtistForm = z.infer<typeof CreateArtistSchema>
