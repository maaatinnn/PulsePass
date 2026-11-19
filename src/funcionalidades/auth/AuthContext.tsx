import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import {
  registrarTokenGetter,
  registrarOnUnauthorized,
} from '../../lib/http'
import { useQueryClient } from '@tanstack/react-query'
import { authApi } from './api'
import type { Rol, Sesion, UsuarioAutenticado } from './tipos'

const STORAGE_TOKEN_KEY = 'pulsepass_token'
const STORAGE_EXPIRES_KEY = 'pulsepass_expires_at'

export interface AuthContextType {
  sesion: Sesion
  iniciarSesion: (identifier: string, password: string) => Promise<UsuarioAutenticado>
  cerrarSesion: () => void
  tieneRol: (...roles: Rol[]) => boolean
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion>({ estado: 'cargando' })
  const queryClient = useQueryClient()
  const tokenRef = useRef<string | null>(null)
  const timerExpiracionRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const limpiarTimer = () => {
    if (timerExpiracionRef.current) {
      clearTimeout(timerExpiracionRef.current)
      timerExpiracionRef.current = null
    }
  }

  const cerrarSesion = useCallback(() => {
    limpiarTimer()
    sessionStorage.removeItem(STORAGE_TOKEN_KEY)
    sessionStorage.removeItem(STORAGE_EXPIRES_KEY)
    tokenRef.current = null
    queryClient.clear()
    setSesion({ estado: 'anonimo' })
  }, [queryClient])

  const programarExpiracion = useCallback(
    (milisegundos: number) => {
      limpiarTimer()
      if (milisegundos <= 0) {
        cerrarSesion()
        return
      }
      timerExpiracionRef.current = setTimeout(() => {
        cerrarSesion()
        window.dispatchEvent(new CustomEvent('pulsepass_sesion_expirada'))
      }, milisegundos)
    },
    [cerrarSesion],
  )

  const iniciarSesion = useCallback(
    async (identifier: string, password: string): Promise<UsuarioAutenticado> => {
      const respLogin = await authApi.login({ identifier, password })
      const token = respLogin.accessToken
      const expiraEn = respLogin.expiresIn ?? 900

      sessionStorage.setItem(STORAGE_TOKEN_KEY, token)
      const expiraAt = Date.now() + expiraEn * 1000
      sessionStorage.setItem(STORAGE_EXPIRES_KEY, String(expiraAt))
      tokenRef.current = token

      try {
        const respMe = await authApi.me()
        const usuario: UsuarioAutenticado = {
          id: respMe.id,
          username: respMe.username,
          email: respMe.email,
          roles: respMe.roles,
        }

        setSesion({
          estado: 'autenticado',
          token,
          expiraEn,
          usuario,
        })

        programarExpiracion(expiraEn * 1000)
        return usuario
      } catch (err) {
        cerrarSesion()
        throw err
      }
    },
    [cerrarSesion, programarExpiracion],
  )

  const tieneRol = useCallback(
    (...roles: Rol[]): boolean => {
      if (sesion.estado !== 'autenticado') return false
      return roles.some((rol) => sesion.usuario.roles.includes(rol))
    },
    [sesion],
  )

  // Registrar callbacks con el cliente HTTP
  useEffect(() => {
    registrarTokenGetter(() => tokenRef.current)
    registrarOnUnauthorized(() => {
      cerrarSesion()
      window.dispatchEvent(new CustomEvent('pulsepass_sesion_expirada'))
    })
  }, [cerrarSesion])

  // Restaurar sesión desde sessionStorage al montar
  useEffect(() => {
    const tokenGuardado = sessionStorage.getItem(STORAGE_TOKEN_KEY)
    const expiraAtGuardado = sessionStorage.getItem(STORAGE_EXPIRES_KEY)

    if (!tokenGuardado || !expiraAtGuardado) {
      setSesion({ estado: 'anonimo' })
      return
    }

    const tiempoRestante = Number(expiraAtGuardado) - Date.now()
    if (tiempoRestante <= 0) {
      cerrarSesion()
      return
    }

    tokenRef.current = tokenGuardado

    authApi
      .me()
      .then((respMe) => {
        const usuario: UsuarioAutenticado = {
          id: respMe.id,
          username: respMe.username,
          email: respMe.email,
          roles: respMe.roles,
        }
        setSesion({
          estado: 'autenticado',
          token: tokenGuardado,
          expiraEn: Math.floor(tiempoRestante / 1000),
          usuario,
        })
        programarExpiracion(tiempoRestante)
      })
      .catch(() => {
        cerrarSesion()
      })
  }, [cerrarSesion, programarExpiracion])

  return (
    <AuthContext.Provider
      value={{
        sesion,
        iniciarSesion,
        cerrarSesion,
        tieneRol,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}
