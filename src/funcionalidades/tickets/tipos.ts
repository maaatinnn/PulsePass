import { z } from 'zod'

export const TicketTypeSchema = z.enum(['GENERAL', 'VIP', 'BACKSTAGE', 'STUDENT'])
export type TicketType = z.infer<typeof TicketTypeSchema>

export const TicketStatusSchema = z.enum(['RESERVED', 'PAID', 'CANCELLED', 'USED'])
export type TicketStatus = z.infer<typeof TicketStatusSchema>

export const TicketResponseSchema = z.object({
  id: z.number().optional(),
  ticketCode: z.string(),
  type: TicketTypeSchema,
  price: z.union([z.number(), z.string().transform(Number)]),
  status: TicketStatusSchema,
  purchaseDate: z.string(),
  userEmail: z.string(),
  eventCode: z.string(),
  eventName: z.string(),
})
export type TicketResponse = z.infer<typeof TicketResponseSchema>

export const PurchaseTicketSchema = z.object({
  type: TicketTypeSchema,
})
export type PurchaseTicketForm = z.infer<typeof PurchaseTicketSchema>
