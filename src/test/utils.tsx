import { type ReactElement, type ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import { AuthProvider } from '../funcionalidades/auth/AuthContext'
import type { UsuarioAutenticado } from '../funcionalidades/auth/tipos'

export interface OpcionesRenderConProveedores extends Omit<RenderOptions, 'wrapper'> {
  rutaInicial?: string
  usuarioAutenticado?: UsuarioAutenticado | null
}

export function crearQueryClientTest() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

export function renderConProveedores(
  ui: ReactElement,
  opciones: OpcionesRenderConProveedores = {},
) {
  const {
    rutaInicial = '/',
    usuarioAutenticado,
    ...opcionesRender
  } = opciones

  const testQueryClient = crearQueryClientTest()

  if (usuarioAutenticado !== undefined) {
    if (usuarioAutenticado) {
      // El token simulado codifica la identidad para que el mock de /api/auth/me la devuelva.
      const { id, username, email, roles } = usuarioAutenticado
      sessionStorage.setItem(
        'pulsepass_token',
        `mock-test-jwt-token|${id}|${username}|${email}|${roles.join(',')}`,
      )
      sessionStorage.setItem(
        'pulsepass_expires_at',
        String(Date.now() + 900 * 1000),
      )
    } else {
      sessionStorage.removeItem('pulsepass_token')
      sessionStorage.removeItem('pulsepass_expires_at')
    }
  }
  // Si usuarioAutenticado es undefined no se toca sessionStorage: cada prueba controla su propio estado.

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={testQueryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={[rutaInicial]}>
            {children}
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    )
  }

  return {
    user: userEvent.setup(),
    queryClient: testQueryClient,
    ...render(ui, { wrapper: Wrapper, ...opcionesRender }),
  }
}
