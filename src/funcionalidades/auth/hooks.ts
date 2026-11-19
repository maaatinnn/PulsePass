import { useMutation } from '@tanstack/react-query'
import { authApi } from './api'
import { useAuth } from './AuthContext'
import type { LoginForm, RegisterForm } from './tipos'

export { useAuth }

export function useLogin() {
  const { iniciarSesion } = useAuth()
  return useMutation({
    mutationFn: (datos: LoginForm) => iniciarSesion(datos.identifier, datos.password),
  })
}

export function useRegistrarUsuario() {
  return useMutation({
    mutationFn: (datos: RegisterForm) => authApi.registro(datos),
  })
}
