import { http } from '../../lib/http'
import { UserResponseSchema, type UserResponse } from './tipos'

export const usuariosApi = {
  porEmail: async (email: string): Promise<UserResponse> => {
    return http.get<UserResponse>(
      '/users/by-email',
      { params: { email } },
      UserResponseSchema,
    )
  },

  porUsername: async (username: string): Promise<UserResponse> => {
    return http.get<UserResponse>(
      '/users/by-username',
      { params: { username } },
      UserResponseSchema,
    )
  },
}
