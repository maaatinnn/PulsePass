import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { Routes, Route } from 'react-router'
import { http, HttpResponse } from 'msw'
import { server } from './mocks/handlers'
import { renderConProveedores } from './utils'
import Login from '../pages/Login'
import Registro from '../pages/Registro'
import RutaProtegida from '../layouts/RutaProtegida'
import RutaPorRol from '../layouts/RutaPorRol'
import { useAuth } from '../funcionalidades/auth/AuthContext'

function ComponenteConLogout() {
  const { cerrarSesion } = useAuth()
  return <button onClick={cerrarSesion}>Cerrar sesión ahora</button>
}

describe('Autenticación y guardas', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  // TEST-FE-AUTH-001: login válido → sesión autenticada y redirección a 'desde'
  it('TEST-FE-AUTH-001: login válido inicia sesión y redirige', async () => {
    const { user } = renderConProveedores(
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/destino" element={<h1>Página Destino</h1>} />
      </Routes>,
      {
        rutaInicial: '/login',
        usuarioAutenticado: null,
      },
    )

    const inputUser = screen.getByLabelText(/Usuario o correo/i)
    const inputPass = screen.getByLabelText(/^Contraseña/i)
    const botonIngresar = screen.getByRole('button', { name: /Ingresar/i })

    await user.type(inputUser, 'andrea')
    await user.type(inputPass, 'Password123456!')
    await user.click(botonIngresar)

    await waitFor(() => {
      expect(sessionStorage.getItem('pulsepass_token')).toBe('mock-jwt-token-xyz')
    })
  })

  // TEST-FE-AUTH-002: login 401 → "Credenciales inválidas"
  it('TEST-FE-AUTH-002: login 401 muestra mensaje genérico', async () => {
    const { user } = renderConProveedores(<Login />, {
      rutaInicial: '/login',
      usuarioAutenticado: null,
    })

    const inputUser = screen.getByLabelText(/Usuario o correo/i)
    const inputPass = screen.getByLabelText(/^Contraseña/i)
    const botonIngresar = screen.getByRole('button', { name: /Ingresar/i })

    await user.type(inputUser, 'credenciales_malas')
    await user.type(inputPass, 'incorrecta')
    await user.click(botonIngresar)

    expect(await screen.findByText(/Credenciales inválidas/i)).toBeInTheDocument()
  })

  // FR-FE-AUTH-003: un 401 de login no debe disparar el aviso de sesión expirada
  it('login con credenciales inválidas no muestra "Tu sesión expiró"', async () => {
    const { user } = renderConProveedores(<Login />, {
      rutaInicial: '/login',
      usuarioAutenticado: null,
    })

    await user.type(screen.getByLabelText(/Usuario o correo/i), 'credenciales_malas')
    await user.type(screen.getByLabelText(/^Contraseña/i), 'incorrecta')
    await user.click(screen.getByRole('button', { name: /Ingresar/i }))

    expect(await screen.findByText(/Credenciales inválidas/i)).toBeInTheDocument()
    expect(screen.queryByText(/Tu sesión expiró/i)).not.toBeInTheDocument()
  })

  // TEST-FE-AUTH-003: login sin campos → errores y 0 peticiones
  it('TEST-FE-AUTH-003: login sin campos muestra errores y no llama a la API', async () => {
    let peticionLlamada = false
    server.use(
      http.post('/api/auth/login', () => {
        peticionLlamada = true
        return HttpResponse.json({})
      }),
    )

    const { user } = renderConProveedores(<Login />, {
      rutaInicial: '/login',
      usuarioAutenticado: null,
    })

    const botonIngresar = screen.getByRole('button', { name: /Ingresar/i })
    await user.click(botonIngresar)

    expect(await screen.findByText(/Ingresa tu usuario o correo/i)).toBeInTheDocument()
    expect(await screen.findByText(/Ingresa tu contraseña/i)).toBeInTheDocument()
    expect(peticionLlamada).toBe(false)
  })

  // TEST-FE-AUTH-004: registro con contraseña corta → error y 0 peticiones
  it('TEST-FE-AUTH-004: registro con contraseña < 12 chars muestra error y no llama a la API', async () => {
    let peticionLlamada = false
    server.use(
      http.post('/api/users', () => {
        peticionLlamada = true
        return HttpResponse.json({}, { status: 201 })
      }),
    )

    const { user } = renderConProveedores(<Registro />, {
      rutaInicial: '/registro',
      usuarioAutenticado: null,
    })

    await user.type(screen.getByLabelText(/Nombre de usuario/i), 'nuevo')
    await user.type(screen.getByLabelText(/Correo electrónico/i), 'nuevo@test.com')
    await user.type(screen.getByLabelText(/Nombres/i), 'Juan')
    await user.type(screen.getByLabelText(/Apellidos/i), 'Perez')
    await user.type(screen.getByLabelText(/Fecha de nacimiento/i), '2000-01-01')
    await user.type(screen.getByLabelText(/^Contraseña/i), 'corta123')

    const botonCrear = screen.getByRole('button', { name: /Crear cuenta/i })
    await user.click(botonCrear)

    expect(
      await screen.findByText(/La contraseña debe tener al menos 12 caracteres/i),
    ).toBeInTheDocument()
    expect(peticionLlamada).toBe(false)
  })

  // TEST-FE-AUTH-005: registro 201 → redirección a /login
  it('TEST-FE-AUTH-005: registro 201 redirige a /login con aviso', async () => {
    const { user } = renderConProveedores(
      <Routes>
        <Route path="/registro" element={<Registro />} />
        <Route path="/login" element={<Login />} />
      </Routes>,
      {
        rutaInicial: '/registro',
        usuarioAutenticado: null,
      },
    )

    await user.type(screen.getByLabelText(/Nombre de usuario/i), 'nuevoUsuario')
    await user.type(screen.getByLabelText(/Correo electrónico/i), 'nuevo@pulsepass.test')
    await user.type(screen.getByLabelText(/Nombres/i), 'Nuevo')
    await user.type(screen.getByLabelText(/Apellidos/i), 'Usuario')
    await user.type(screen.getByLabelText(/Fecha de nacimiento/i), '1995-05-15')
    await user.type(screen.getByLabelText(/^Contraseña/i), 'ContrasenaSegura123!')

    const botonCrear = screen.getByRole('button', { name: /Crear cuenta/i })
    await user.click(botonCrear)

    expect(await screen.findByText(/Cuenta creada, inicia sesión/i)).toBeInTheDocument()
  })

  // TEST-FE-AUTH-006: registro 409 → mensaje genérico
  it('TEST-FE-AUTH-006: registro 409 muestra aviso genérico de duplicado', async () => {
    const { user } = renderConProveedores(<Registro />, {
      rutaInicial: '/registro',
      usuarioAutenticado: null,
    })

    await user.type(screen.getByLabelText(/Nombre de usuario/i), 'duplicado')
    await user.type(screen.getByLabelText(/Correo electrónico/i), 'duplicado@pulsepass.test')
    await user.type(screen.getByLabelText(/Nombres/i), 'Duplicado')
    await user.type(screen.getByLabelText(/Apellidos/i), 'Usuario')
    await user.type(screen.getByLabelText(/Fecha de nacimiento/i), '1995-05-15')
    await user.type(screen.getByLabelText(/^Contraseña/i), 'ContrasenaSegura123!')

    const botonCrear = screen.getByRole('button', { name: /Crear cuenta/i })
    await user.click(botonCrear)

    expect(
      await screen.findByText(/El usuario o correo ya está registrado/i),
    ).toBeInTheDocument()
  })

  // TEST-FE-AUTH-007: RutaProtegida: anónimo → /login con state.desde
  it('TEST-FE-AUTH-007: RutaProtegida redirige a /login cuando no hay sesión', async () => {
    renderConProveedores(
      <Routes>
        <Route element={<RutaProtegida />}>
          <Route path="/protegida" element={<h1>Contenido Protegido</h1>} />
        </Route>
        <Route path="/login" element={<h1>Vista de Login</h1>} />
      </Routes>,
      {
        rutaInicial: '/protegida',
        usuarioAutenticado: null,
      },
    )

    expect(await screen.findByText(/Vista de Login/i)).toBeInTheDocument()
  })

  // TEST-FE-AUTH-008: RutaPorRol: USER en /admin → /403
  it('TEST-FE-AUTH-008: RutaPorRol con rol insuficiente redirige a /403', async () => {
    renderConProveedores(
      <Routes>
        <Route element={<RutaPorRol roles={['ADMIN']} />}>
          <Route path="/admin" element={<h1>Panel Admin</h1>} />
        </Route>
        <Route path="/403" element={<h1>403 Sin Permisos</h1>} />
      </Routes>,
      {
        rutaInicial: '/admin',
        usuarioAutenticado: {
          id: 1,
          username: 'andrea',
          email: 'andrea@pulsepass.test',
          roles: ['USER'],
        },
      },
    )

    expect(await screen.findByText(/403 Sin Permisos/i)).toBeInTheDocument()
  })

  // TEST-FE-AUTH-009: RutaPorRol: ADMIN en /admin → renderiza
  it('TEST-FE-AUTH-009: RutaPorRol con rol autorizado renderiza la ruta', async () => {
    server.use(
      http.get('/api/auth/me', () => {
        return HttpResponse.json({
          id: 99,
          username: 'admin',
          email: 'admin@pulsepass.test',
          roles: ['ROLE_ADMIN'],
        })
      }),
    )

    renderConProveedores(
      <Routes>
        <Route element={<RutaPorRol roles={['ADMIN']} />}>
          <Route path="/admin" element={<h1>Panel Admin Exclusivo</h1>} />
        </Route>
      </Routes>,
      {
        rutaInicial: '/admin',
        usuarioAutenticado: {
          id: 99,
          username: 'admin',
          email: 'admin@pulsepass.test',
          roles: ['ADMIN'],
        },
      },
    )

    expect(await screen.findByText(/Panel Admin Exclusivo/i)).toBeInTheDocument()
  })

  // TEST-FE-AUTH-010: cerrar sesión limpia token y caché
  it('TEST-FE-AUTH-010: cerrar sesión elimina token de sessionStorage y limpia cache', async () => {
    const { user, queryClient } = renderConProveedores(<ComponenteConLogout />, {
      rutaInicial: '/',
      usuarioAutenticado: {
        id: 1,
        username: 'andrea',
        email: 'andrea@pulsepass.test',
        roles: ['USER'],
      },
    })

    const clearSpy = vi.spyOn(queryClient, 'clear')

    const botonCerrar = screen.getByRole('button', { name: /Cerrar sesión ahora/i })
    await user.click(botonCerrar)

    expect(sessionStorage.getItem('pulsepass_token')).toBeNull()
    expect(clearSpy).toHaveBeenCalled()
  })

  // TEST-FE-AUTH-011: token expirado al restaurar sesión → anónimo
  it('TEST-FE-AUTH-011: token con timestamp vencido restaura sesión como anónimo', async () => {
    sessionStorage.setItem('pulsepass_token', 'token-vencido')
    sessionStorage.setItem('pulsepass_expires_at', String(Date.now() - 5000))

    function EstadoSesionInspector() {
      const { sesion } = useAuth()
      return <div>Estado: {sesion.estado}</div>
    }

    renderConProveedores(<EstadoSesionInspector />, {
      rutaInicial: '/',
    })

    expect(await screen.findByText(/Estado: anonimo/i)).toBeInTheDocument()
    expect(sessionStorage.getItem('pulsepass_token')).toBeNull()
  })
})
