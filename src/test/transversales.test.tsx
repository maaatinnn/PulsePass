import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Routes, Route, createMemoryRouter, RouterProvider } from 'react-router'
import { renderConProveedores } from './utils'
import Layout from '../layouts/Layout'
import NoEncontrada from '../pages/NoEncontrada'
import ErrorPagina from '../pages/ErrorPagina'

describe('Pruebas Transversales', () => {
  // TEST-FE-GEN-001: ruta inexistente → 404
  it('TEST-FE-GEN-001: ruta inexistente renderiza página 404', async () => {
    renderConProveedores(
      <Routes>
        <Route path="*" element={<NoEncontrada />} />
      </Routes>,
      {
        rutaInicial: '/esta-ruta-no-existe-12345',
        usuarioAutenticado: null,
      },
    )

    expect(await screen.findByText('404')).toBeInTheDocument()
    expect(screen.getByText(/No encontramos esta página/i)).toBeInTheDocument()
  })

  // TEST-FE-GEN-002: errorElement muestra mensaje seguro (sin stack)
  it('TEST-FE-GEN-002: errorElement muestra mensaje amigable sin detalles de stack trace', async () => {
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <div>Inicio</div>,
          errorElement: <ErrorPagina />,
          loader: () => {
            throw new Error('Error interno del servidor simulado')
          },
        },
      ],
      { initialEntries: ['/'] },
    )

    render(<RouterProvider router={router} />)

    expect(await screen.findByText(/¡Ups! Algo salió mal./i)).toBeInTheDocument()
    expect(
      screen.getByText(/Ocurrió un error inesperado. Inténtalo más tarde./i),
    ).toBeInTheDocument()
    expect(screen.queryByText(/at Object/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Error interno/i)).not.toBeInTheDocument()
  })

  // TEST-FE-GEN-003: navbar muestra enlaces según rol
  it('TEST-FE-GEN-003: navbar adapta sus enlaces según el rol del usuario', async () => {
    // 1. Anónimo
    const { unmount } = renderConProveedores(<Layout />, {
      rutaInicial: '/',
      usuarioAutenticado: null,
    })

    expect(screen.getByText('Eventos')).toBeInTheDocument()
    expect(screen.getAllByText('Artistas').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Sedes').length).toBeGreaterThan(0)
    expect(screen.getByText('Ingresar')).toBeInTheDocument()
    expect(screen.getByText('Registrarse')).toBeInTheDocument()
    expect(screen.queryByText('Mis tickets')).not.toBeInTheDocument()
    expect(screen.queryByText('Administrar eventos')).not.toBeInTheDocument()
    unmount()

    // 2. USER
    const renderUser = renderConProveedores(<Layout />, {
      rutaInicial: '/',
      usuarioAutenticado: {
        id: 1,
        username: 'andrea',
        email: 'andrea@pulsepass.test',
        roles: ['USER'],
      },
    })

    // La sesión se restaura de forma asíncrona (GET /api/auth/me)
    expect((await renderUser.findAllByText('Mis tickets')).length).toBeGreaterThan(0)
    expect(renderUser.queryByText('Administrar eventos')).not.toBeInTheDocument()
    expect(renderUser.queryByRole('button', { name: /^Administrar$/ })).not.toBeInTheDocument()
    renderUser.unmount()

    // 3. ADMIN
    const renderAdmin = renderConProveedores(<Layout />, {
      rutaInicial: '/',
      usuarioAutenticado: {
        id: 99,
        username: 'admin',
        email: 'admin@pulsepass.test',
        roles: ['ADMIN'],
      },
    })

    // Las opciones de administración se agrupan en un menú desplegable "Administrar"
    const botonAdministrar = await renderAdmin.findByRole('button', { name: /^Administrar$/ })
    expect(renderAdmin.queryByText('Administrar eventos')).not.toBeInTheDocument()
    await renderAdmin.user.click(botonAdministrar)
    expect(renderAdmin.getByText('Administrar eventos')).toBeInTheDocument()
    expect(renderAdmin.getByText('Administrar artistas')).toBeInTheDocument()
    expect(renderAdmin.getByText('Administrar sedes')).toBeInTheDocument()
    expect(renderAdmin.getAllByText('Validar ingreso').length).toBeGreaterThan(0)
    expect(renderAdmin.getAllByText('Tickets pagados').length).toBeGreaterThan(0)
    renderAdmin.unmount()
  })

  // TEST-FE-GEN-004: menú móvil abre y cierra con teclado
  it('TEST-FE-GEN-004: menú móvil se abre y cierra mediante interacción accesible', async () => {
    const { user } = renderConProveedores(<Layout />, {
      rutaInicial: '/',
      usuarioAutenticado: null,
    })

    const botonHamburguesa = screen.getByRole('button', {
      name: /Abrir menú principal/i,
    })
    expect(botonHamburguesa).toHaveAttribute('aria-expanded', 'false')

    await user.click(botonHamburguesa)
    expect(botonHamburguesa).toHaveAttribute('aria-expanded', 'true')

    await user.click(botonHamburguesa)
    expect(botonHamburguesa).toHaveAttribute('aria-expanded', 'false')
  })
})
