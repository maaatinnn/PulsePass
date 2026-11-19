import { http } from '../../lib/http'
import {
  AuthResponseSchema,
  AuthenticatedUserResponseSchema,
  type AuthResponse,
  type AuthenticatedUserResponse,
  type LoginForm,
  type RegisterForm,
} from './tipos'
import { UserResponseSchema, type UserResponse } from '../usuarios/tipos'

export const authApi = {
  login: async (datos: LoginForm): Promise<AuthResponse> => {
    return http.post<AuthResponse>('/auth/login', datos, undefined, AuthResponseSchema)
  },

  me: async (): Promise<AuthenticatedUserResponse> => {
    return http.get<AuthenticatedUserResponse>('/auth/me', undefined, AuthenticatedUserResponseSchema)
  },

  registro: async (datos: RegisterForm): Promise<UserResponse> => {
    return http.post<UserResponse>('/users', datos, undefined, UserResponseSchema)
  },
}
