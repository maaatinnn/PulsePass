import { z } from 'zod'

export const VenueResponseSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  city: z.string(),
  address: z.string().nullable().optional(),
  capacity: z.number(),
  active: z.boolean(),
})

export type VenueResponse = z.infer<typeof VenueResponseSchema>

export const CreateVenueSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'El código de la sede es obligatorio')
    .max(30, 'Máximo 30 caracteres')
    .regex(/^[A-Z0-9_-]+$/i, 'Solo letras, números, guiones y guiones bajos'),
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(150, 'Máximo 150 caracteres'),
  city: z.string().trim().min(1, 'La ciudad es obligatoria').max(100, 'Máximo 100 caracteres'),
  address: z.string().trim().max(255, 'Máximo 255 caracteres').optional(),
  capacity: z.coerce
    .number({ invalid_type_error: 'La capacidad debe ser mayor o igual a 1' })
    .int('La capacidad debe ser un número entero')
    .min(1, 'La capacidad debe ser mayor o igual a 1'),
})
export type CreateVenueForm = z.infer<typeof CreateVenueSchema>
