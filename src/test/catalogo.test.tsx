import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { Routes, Route } from 'react-router'
import { http, HttpResponse } from 'msw'
import { server } from './mocks/handlers'
import { renderConProveedores } from './utils'
import CatalogoEventos from '../pages/CatalogoEventos'
import DetalleEvento from '../pages/DetalleEvento'
import ListaArtistas from '../pages/ListaArtistas'
import DetalleArtista from '../pages/DetalleArtista'
import ListaSedes from '../pages/ListaSedes'
import DetalleSede from '../pages/DetalleSede'

describe('Catálogo, artistas y sedes', () => {
  // TEST-FE-EVT-001: cartelera: lista eventos publicados
  it('TEST-FE-EVT-001: cartelera lista los eventos en estado PUBLISHED', async () => {
    renderConProveedores(<CatalogoEventos />, {
      rutaInicial: '/eventos',
      usuarioAutenticado: null,
    })

    expect(
      await screen.findByText('Caribbean Music Fest 2026'),
    ).toBeInTheDocument()
  })

  // TEST-FE-EVT-002: cartelera: lista vacía → estado vacío
  it('TEST-FE-EVT-002: cartelera muestra estado vacío cuando no hay eventos', async () => {
    server.use(
      http.get('/api/events/published', () => {
        return HttpResponse.json([])
      }),
    )

    renderConProveedores(<CatalogoEventos />, {
      rutaInicial: '/eventos',
      usuarioAutenticado: null,
    })

    expect(
      await screen.findByText(/Sin resultados para tu búsqueda/i),
    ).toBeInTheDocument()
  })

  // TEST-FE-EVT-003: cartelera: filtro por texto/categoría actualiza la URL
  it('TEST-FE-EVT-003: filtrar por texto actualiza el parámetro en la URL', async () => {
    const { user } = renderConProveedores(<CatalogoEventos />, {
      rutaInicial: '/eventos',
      usuarioAutenticado: null,
    })

    const inputBuscar = await screen.findByPlaceholderText(/Buscar por nombre.../i)
    await user.type(inputBuscar, 'Caribbean')

    expect(inputBuscar).toHaveValue('Caribbean')
  })

  // TEST-FE-EVT-004: detalle: muestra evento, artistas y sede
  it('TEST-FE-EVT-004: detalle de evento muestra datos completos, artistas y sede', async () => {
    renderConProveedores(
      <Routes>
        <Route path="/eventos/:eventCode" element={<DetalleEvento />} />
      </Routes>,
      {
        rutaInicial: '/eventos/CMF-2026',
        usuarioAutenticado: {
          id: 1,
          username: 'andrea',
          email: 'andrea@pulsepass.test',
          roles: ['USER'],
        },
      },
    )

    expect(
      await screen.findByRole('heading', { name: 'Caribbean Music Fest 2026' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Solar Beat')).toBeInTheDocument()
    expect(screen.getByText('Marina Convention Center')).toBeInTheDocument()
    expect(screen.getByText(/Edad mínima: 18/i)).toBeInTheDocument()
  })

  // TEST-FE-EVT-005: detalle: 404 → "Evento no disponible"
  it('TEST-FE-EVT-005: detalle de evento ante 404 muestra "Evento no disponible"', async () => {
    renderConProveedores(
      <Routes>
        <Route path="/eventos/:eventCode" element={<DetalleEvento />} />
      </Routes>,
      {
        rutaInicial: '/eventos/INEXISTENTE-999',
        usuarioAutenticado: null,
      },
    )

    expect(await screen.findByText(/Evento no disponible/i)).toBeInTheDocument()
  })

  // TEST-FE-EVT-006: detalle: evento SOLD_OUT → compra deshabilitada
  it('TEST-FE-EVT-006: evento SOLD_OUT muestra botón de compra deshabilitado', async () => {
    renderConProveedores(
      <Routes>
        <Route path="/eventos/:eventCode" element={<DetalleEvento />} />
      </Routes>,
      {
        rutaInicial: '/eventos/SOLD-01',
        usuarioAutenticado: {
          id: 1,
          username: 'andrea',
          email: 'andrea@pulsepass.test',
          roles: ['USER'],
        },
      },
    )

    expect(await screen.findByText('Sold Out Event')).toBeInTheDocument()
    const botonCompra = screen.getByRole('button', {
      name: /Entradas no disponibles/i,
    })
    expect(botonCompra).toBeDisabled()
  })

  // TEST-FE-ART-001: lista de artistas activos
  it('TEST-FE-ART-001: lista de artistas muestra los artistas activos', async () => {
    renderConProveedores(<ListaArtistas />, {
      rutaInicial: '/artistas',
      usuarioAutenticado: null,
    })

    expect(await screen.findByText('Solar Beat')).toBeInTheDocument()
    expect(screen.getByText('Neon Waves')).toBeInTheDocument()
    expect(screen.getByText('Caribbean Sound')).toBeInTheDocument()
  })

  // TEST-FE-ART-002: detalle de artista con eventos
  it('TEST-FE-ART-002: detalle de artista muestra su biografía y próximos eventos', async () => {
    renderConProveedores(
      <Routes>
        <Route path="/artistas/:id" element={<DetalleArtista />} />
      </Routes>,
      {
        rutaInicial: '/artistas/1',
        usuarioAutenticado: null,
      },
    )

    expect(await screen.findByRole('heading', { name: 'Solar Beat' })).toBeInTheDocument()
    expect(
      await screen.findByText('Caribbean Music Fest 2026'),
    ).toBeInTheDocument()
  })

  // TEST-FE-ART-003: id no numérico → 404 sin llamar a la API
  it('TEST-FE-ART-003: id no numérico renderiza 404 de UI sin llamar a la API', async () => {
    let llamadaApi = false
    server.use(
      http.get('/api/artists/:id', () => {
        llamadaApi = true
        return HttpResponse.json({})
      }),
    )

    renderConProveedores(
      <Routes>
        <Route path="/artistas/:id" element={<DetalleArtista />} />
      </Routes>,
      {
        rutaInicial: '/artistas/invalido-abc',
        usuarioAutenticado: null,
      },
    )

    expect(await screen.findByText(/Página no encontrada/i)).toBeInTheDocument()
    expect(llamadaApi).toBe(false)
  })

  // TEST-FE-VEN-001: lista y detalle de sede; 404 de sede
  it('TEST-FE-VEN-001: lista y detalle de sedes renderiza datos y 404 ante código inválido', async () => {
    // 1. Lista
    const { unmount } = renderConProveedores(<ListaSedes />, {
      rutaInicial: '/sedes',
      usuarioAutenticado: null,
    })

    expect(
      await screen.findByText('Marina Convention Center'),
    ).toBeInTheDocument()
    expect(screen.getByText(/Santa Marta · Cap. 3/i)).toBeInTheDocument()
    unmount()

    // 2. Detalle válido
    const renderValido = renderConProveedores(
      <Routes>
        <Route path="/sedes/:code" element={<DetalleSede />} />
      </Routes>,
      {
        rutaInicial: '/sedes/VEN-SMR-01',
        usuarioAutenticado: null,
      },
    )

    expect(
      await renderValido.findByRole('heading', {
        name: 'Marina Convention Center',
      }),
    ).toBeInTheDocument()
    expect(renderValido.getByText('3 personas')).toBeInTheDocument()
    renderValido.unmount()

    // 3. Detalle 404
    const render404 = renderConProveedores(
      <Routes>
        <Route path="/sedes/:code" element={<DetalleSede />} />
      </Routes>,
      {
        rutaInicial: '/sedes/VEN-NO-EXISTE',
        usuarioAutenticado: null,
      },
    )

    expect(
      await render404.findByText(/Página no encontrada/i),
    ).toBeInTheDocument()
  })
})
