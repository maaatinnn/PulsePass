import { z } from 'zod'

export const UserResponseSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  active: z.boolean(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  birthDate: z.string(),
})

export type UserResponse = z.infer<typeof UserResponseSchema>
