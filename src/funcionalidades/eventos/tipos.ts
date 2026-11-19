import { z } from 'zod'
import { ArtistResponseSchema } from '../artistas/tipos'

export const EventCategorySchema = z.enum([
  'MUSIC',
  'SPORTS',
  'TECHNOLOGY',
  'EDUCATION',
  'CULTURE',
  'ENTERTAINMENT',
])
export type EventCategory = z.infer<typeof EventCategorySchema>

export const EventStatusSchema = z.enum([
  'DRAFT',
  'PUBLISHED',
  'SOLD_OUT',
  'CANCELLED',
  'FINISHED',
])
export type EventStatus = z.infer<typeof EventStatusSchema>

export const EventSummaryResponseSchema = z.object({
  id: z.number().optional(),
  eventCode: z.string(),
  name: z.string(),
  category: EventCategorySchema,
  status: EventStatusSchema,
  eventDate: z.string(),
  minimumAge: z.number().default(0),
  venueCode: z.string().optional(),
  venueName: z.string().optional(),
})
export type EventSummaryResponse = z.infer<typeof EventSummaryResponseSchema>

export const EventResponseSchema = z.object({
  id: z.number().optional(),
  eventCode: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  category: EventCategorySchema,
  status: EventStatusSchema,
  eventDate: z.string(),
  minimumAge: z.number().default(0),
  venueCode: z.string().optional(),
  venueName: z.string().optional(),
  artists: z.array(ArtistResponseSchema).optional().default([]),
})
export type EventResponse = z.infer<typeof EventResponseSchema>

export const CreateEventSchema = z.object({
  eventCode: z
    .string()
    .min(1, 'El código del evento es obligatorio')
    .max(30, 'Máximo 30 caracteres')
    .regex(/^[A-Z0-9_-]+$/i, 'Solo letras, números, guiones y guiones bajos'),
  name: z.string().min(1, 'El nombre es obligatorio').max(200, 'Máximo 200 caracteres'),
  description: z.string().max(2000, 'Máximo 2000 caracteres').optional(),
  category: EventCategorySchema,
  eventDate: z.string().min(1, 'La fecha y hora del evento son obligatorias'),
  minimumAge: z.coerce.number().int().min(0, 'La edad mínima debe ser mayor o igual a 0'),
  venueCode: z.string().min(1, 'Debes seleccionar una sede'),
})
export type CreateEventForm = z.infer<typeof CreateEventSchema>
