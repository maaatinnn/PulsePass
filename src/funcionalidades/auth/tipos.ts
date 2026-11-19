import { z } from 'zod'

export const RolSchema = z.enum(['USER', 'STAFF', 'ADMIN'])
export type Rol = z.infer<typeof RolSchema>

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  tokenType: z.string().default('Bearer'),
  expiresIn: z.number(),
})
export type AuthResponse = z.infer<typeof AuthResponseSchema>

export const AuthenticatedUserResponseSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  roles: z.array(z.string()).transform((roles) =>
    roles.map((r) => r.replace(/^ROLE_/, '')).filter((r): r is Rol => ['USER', 'STAFF', 'ADMIN'].includes(r)),
  ),
})
export type AuthenticatedUserResponse = z.infer<typeof AuthenticatedUserResponseSchema>

export interface UsuarioAutenticado {
  id: number
  username: string
  email: string
  roles: Rol[]
}

export type Sesion =
  | { estado: 'cargando' }
  | { estado: 'anonimo' }
  | { estado: 'autenticado'; token: string; expiraEn: number; usuario: UsuarioAutenticado }

// Formularios
export const LoginSchema = z.object({
  identifier: z.string().min(1, 'Ingresa tu usuario o correo'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})
export type LoginForm = z.infer<typeof LoginSchema>

export const RegisterSchema = z
  .object({
    username: z.string().min(1, 'El nombre de usuario es obligatorio').max(50, 'Máximo 50 caracteres'),
    email: z.string().min(1, 'El correo electrónico es obligatorio').email('Ingresa un correo electrónico válido'),
    firstName: z.string().min(1, 'Los nombres son obligatorios').max(100, 'Máximo 100 caracteres'),
    lastName: z.string().min(1, 'Los apellidos son obligatorios').max(100, 'Máximo 100 caracteres'),
    phone: z.string().max(30, 'Máximo 30 caracteres').optional(),
    city: z.string().max(100, 'Máximo 100 caracteres').optional(),
    birthDate: z
      .string()
      .min(1, 'La fecha de nacimiento es obligatoria')
      .refine((val) => {
        const d = new Date(val)
        return !isNaN(d.getTime()) && d <= new Date()
      }, 'La fecha de nacimiento no puede ser futura'),
    password: z
      .string()
      .min(12, 'La contraseña debe tener al menos 12 caracteres')
      .max(72, 'La contraseña no puede exceder 72 caracteres')
      .refine((val) => new TextEncoder().encode(val).length <= 72, 'La contraseña no puede exceder 72 bytes'),
  })

export type RegisterForm = z.infer<typeof RegisterSchema>
