import { describe, it, expect } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server, mockArtistas, mockSedes } from './mocks/handlers'
import { renderConProveedores } from './utils'
import type { VenueResponse } from '../funcionalidades/sedes/tipos'
import { http as httpCliente } from '../lib/http'
import AdminArtistas from '../pages/AdminArtistas'
import AdminSedes from '../pages/AdminSedes'
import Layout from '../layouts/Layout'

// Con noUncheckedIndexedAccess, un índice de lista puede ser undefined: este helper lo acota.
function primero<T>(items: T[]): T {
  const item = items[0]
  if (item === undefined) throw new Error('Se esperaba al menos un elemento')
  return item
}

const ADMIN = {
  id: 99,
  username: 'admin',
  email: 'admin@pulsepass.test',
  roles: ['ADMIN' as const],
}

describe('ADMIN: administrar artistas', () => {
  // TEST-FE-ADM-ART-001: listado completo en tabla
  it('TEST-FE-ADM-ART-001: lista los artistas devueltos por la API', async () => {
    renderConProveedores(<AdminArtistas />, {
      rutaInicial: '/admin/artistas',
      usuarioAutenticado: ADMIN,
    })

    expect(
      screen.getByRole('heading', { name: /Administración de artistas/i }),
    ).toBeInTheDocument()
    // La tabla (desktop) y las tarjetas (móvil) coexisten en el DOM; CSS oculta una de ellas.
    expect((await screen.findAllByText('Solar Beat')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Neon Waves').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Caribbean Sound').length).toBeGreaterThan(0)
  })

  // TEST-FE-ADM-ART-002: estado vacío
  it('TEST-FE-ADM-ART-002: sin artistas muestra el estado vacío con acción para crear', async () => {
    server.use(http.get('/api/artists', () => HttpResponse.json([])))

    renderConProveedores(<AdminArtistas />, {
      rutaInicial: '/admin/artistas',
      usuarioAutenticado: ADMIN,
    })

    expect(await screen.findByText(/Aún no hay artistas/i)).toBeInTheDocument()
  })

  // TEST-FE-ADM-ART-003: formulario vacío → errores y 0 peticiones
  it('TEST-FE-ADM-ART-003: crear con nombre vacío muestra error y no llama a la API', async () => {
    let peticionLlamada = false
    server.use(
      http.post('/api/artists', () => {
        peticionLlamada = true
        return HttpResponse.json({}, { status: 201 })
      }),
    )

    const { user } = renderConProveedores(<AdminArtistas />, {
      rutaInicial: '/admin/artistas',
      usuarioAutenticado: ADMIN,
    })

    await user.click(await screen.findByRole('button', { name: /\+ Nuevo artista/i }))
    await user.click(screen.getByRole('button', { name: /Crear artista/i }))

    expect(await screen.findByText(/El nombre artístico es obligatorio/i)).toBeInTheDocument()
    expect(peticionLlamada).toBe(false)
  })

  // TEST-FE-ADM-ART-004: crear artista válido → 201, aviso, modal cerrado y lista actualizada
  it('TEST-FE-ADM-ART-004: crear artista válido lo envía a la API y actualiza el listado', async () => {
    let artistas = [...mockArtistas]
    let cuerpoRecibido: unknown = null
    server.use(
      http.get('/api/artists', () => HttpResponse.json(artistas)),
      http.post('/api/artists', async ({ request }) => {
        cuerpoRecibido = await request.json()
        const nuevo = { id: 50, stageName: 'Luna Roja', country: 'Chile', genre: 'Pop', active: true }
        artistas = [...artistas, nuevo]
        return HttpResponse.json(nuevo, { status: 201 })
      }),
    )

    const { user } = renderConProveedores(<AdminArtistas />, {
      rutaInicial: '/admin/artistas',
      usuarioAutenticado: ADMIN,
    })

    await user.click(await screen.findByRole('button', { name: /\+ Nuevo artista/i }))
    await user.type(screen.getByLabelText(/Nombre artístico/i), 'Luna Roja')
    await user.type(screen.getByLabelText(/País/i), 'Chile')
    await user.type(screen.getByLabelText(/Género/i), 'Pop')
    await user.click(screen.getByRole('button', { name: /Crear artista/i }))

    expect(await screen.findByText(/Artista «Luna Roja» creado con éxito/i)).toBeInTheDocument()
    expect((await screen.findAllByText('Luna Roja')).length).toBeGreaterThan(0)
    expect(cuerpoRecibido).toEqual({ stageName: 'Luna Roja', country: 'Chile', genre: 'Pop' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  // TEST-FE-ADM-ART-005: nombre duplicado → 409 visible dentro del modal
  it('TEST-FE-ADM-ART-005: crear un artista duplicado muestra el error 409 y mantiene el modal', async () => {
    const { user } = renderConProveedores(<AdminArtistas />, {
      rutaInicial: '/admin/artistas',
      usuarioAutenticado: ADMIN,
    })

    await user.click(await screen.findByRole('button', { name: /\+ Nuevo artista/i }))
    await user.type(screen.getByLabelText(/Nombre artístico/i), 'Solar Beat')
    await user.click(screen.getByRole('button', { name: /Crear artista/i }))

    expect(
      await screen.findByText(/Ya existe un artista con el nombre «Solar Beat»/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  // TEST-FE-ADM-ART-006: eliminar con confirmación
  it('TEST-FE-ADM-ART-006: eliminar un artista pide confirmación y lo quita del listado', async () => {
    let artistas = [...mockArtistas]
    let idEliminado: string | null = null
    server.use(
      http.get('/api/artists', () => HttpResponse.json(artistas)),
      http.delete('/api/artists/:id', ({ params }) => {
        idEliminado = String(params.id)
        artistas = artistas.filter((a) => a.id !== Number(params.id))
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const { user } = renderConProveedores(<AdminArtistas />, {
      rutaInicial: '/admin/artistas',
      usuarioAutenticado: ADMIN,
    })

    const botones = await screen.findAllByRole('button', { name: 'Eliminar Caribbean Sound' })
    await user.click(primero(botones))

    const dialogo = screen.getByRole('dialog')
    expect(within(dialogo).getByText(/¿Confirmas la eliminación del artista/i)).toBeInTheDocument()
    await user.click(within(dialogo).getByRole('button', { name: 'Eliminar' }))

    expect(await screen.findByText(/Artista «Caribbean Sound» eliminado/i)).toBeInTheDocument()
    await waitFor(() => expect(screen.queryAllByText('Caribbean Sound')).toHaveLength(0))
    expect(idEliminado).toBe('3')
    expect(screen.getAllByText('Solar Beat').length).toBeGreaterThan(0)
  })

  // TEST-FE-ADM-ART-007: cancelar la confirmación no elimina
  it('TEST-FE-ADM-ART-007: cancelar la confirmación no llama a la API', async () => {
    let peticionLlamada = false
    server.use(
      http.delete('/api/artists/:id', () => {
        peticionLlamada = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const { user } = renderConProveedores(<AdminArtistas />, {
      rutaInicial: '/admin/artistas',
      usuarioAutenticado: ADMIN,
    })

    const botones = await screen.findAllByRole('button', { name: 'Eliminar Neon Waves' })
    await user.click(primero(botones))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(peticionLlamada).toBe(false)
    expect(screen.getAllByText('Neon Waves').length).toBeGreaterThan(0)
  })

  // TEST-FE-ADM-ART-008: artista asociado a eventos → 409 visible
  it('TEST-FE-ADM-ART-008: eliminar un artista asociado a eventos muestra el conflicto 409', async () => {
    const { user } = renderConProveedores(<AdminArtistas />, {
      rutaInicial: '/admin/artistas',
      usuarioAutenticado: ADMIN,
    })

    const botones = await screen.findAllByRole('button', { name: 'Eliminar Solar Beat' })
    await user.click(primero(botones))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }))

    expect(
      await screen.findByText(/No se puede eliminar a «Solar Beat» porque está asociado a uno o más eventos/i),
    ).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getAllByText('Solar Beat').length).toBeGreaterThan(0)
  })
})

describe('ADMIN: administrar sedes', () => {
  // TEST-FE-ADM-SED-001: listado completo en tabla
  it('TEST-FE-ADM-SED-001: lista las sedes devueltas por la API', async () => {
    renderConProveedores(<AdminSedes />, {
      rutaInicial: '/admin/sedes',
      usuarioAutenticado: ADMIN,
    })

    expect(screen.getByRole('heading', { name: /Administración de sedes/i })).toBeInTheDocument()
    expect((await screen.findAllByText('Marina Convention Center')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('VEN-SMR-01').length).toBeGreaterThan(0)
  })

  // TEST-FE-ADM-SED-002: estado vacío
  it('TEST-FE-ADM-SED-002: sin sedes muestra el estado vacío con acción para crear', async () => {
    server.use(http.get('/api/venues', () => HttpResponse.json([])))

    renderConProveedores(<AdminSedes />, {
      rutaInicial: '/admin/sedes',
      usuarioAutenticado: ADMIN,
    })

    expect(await screen.findByText(/Aún no hay sedes/i)).toBeInTheDocument()
  })

  // TEST-FE-ADM-SED-003: formulario vacío → errores y 0 peticiones
  it('TEST-FE-ADM-SED-003: crear con campos vacíos muestra errores y no llama a la API', async () => {
    let peticionLlamada = false
    server.use(
      http.post('/api/venues', () => {
        peticionLlamada = true
        return HttpResponse.json({}, { status: 201 })
      }),
    )

    const { user } = renderConProveedores(<AdminSedes />, {
      rutaInicial: '/admin/sedes',
      usuarioAutenticado: ADMIN,
    })

    await user.click(await screen.findByRole('button', { name: /\+ Nueva sede/i }))
    await user.click(screen.getByRole('button', { name: /Crear sede/i }))

    expect(await screen.findByText(/El código de la sede es obligatorio/i)).toBeInTheDocument()
    expect(await screen.findByText(/El nombre es obligatorio/i)).toBeInTheDocument()
    expect(await screen.findByText(/La ciudad es obligatoria/i)).toBeInTheDocument()
    expect(await screen.findByText(/La capacidad debe ser mayor o igual a 1/i)).toBeInTheDocument()
    expect(peticionLlamada).toBe(false)
  })

  // TEST-FE-ADM-SED-004: crear sede válida → 201, código en mayúsculas, lista actualizada
  it('TEST-FE-ADM-SED-004: crear sede válida envía el código en mayúsculas y actualiza el listado', async () => {
    let sedes: VenueResponse[] = [...mockSedes]
    let cuerpoRecibido: Record<string, unknown> | null = null
    server.use(
      http.get('/api/venues', () => HttpResponse.json(sedes)),
      http.post('/api/venues', async ({ request }) => {
        cuerpoRecibido = (await request.json()) as Record<string, unknown>
        const nueva = {
          id: 50,
          code: 'VEN-BOG-01',
          name: 'Movistar Arena',
          city: 'Bogotá',
          address: null,
          capacity: 800,
          active: true,
        }
        sedes = [...sedes, nueva]
        return HttpResponse.json(nueva, { status: 201 })
      }),
    )

    const { user } = renderConProveedores(<AdminSedes />, {
      rutaInicial: '/admin/sedes',
      usuarioAutenticado: ADMIN,
    })

    await user.click(await screen.findByRole('button', { name: /\+ Nueva sede/i }))
    await user.type(screen.getByLabelText(/Código de la sede/i), 'ven-bog-01')
    await user.type(screen.getByLabelText(/Nombre/i), 'Movistar Arena')
    await user.type(screen.getByLabelText(/Ciudad/i), 'Bogotá')
    await user.type(screen.getByLabelText(/Capacidad/i), '800')
    await user.click(screen.getByRole('button', { name: /Crear sede/i }))

    expect(await screen.findByText(/Sede «Movistar Arena» creada con éxito/i)).toBeInTheDocument()
    expect((await screen.findAllByText('Movistar Arena')).length).toBeGreaterThan(0)
    expect(cuerpoRecibido).toMatchObject({
      code: 'VEN-BOG-01',
      name: 'Movistar Arena',
      city: 'Bogotá',
      capacity: 800,
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  // TEST-FE-ADM-SED-005: código con caracteres inválidos → error de validación
  it('TEST-FE-ADM-SED-005: un código con espacios o símbolos se rechaza en el formulario', async () => {
    let peticionLlamada = false
    server.use(
      http.post('/api/venues', () => {
        peticionLlamada = true
        return HttpResponse.json({}, { status: 201 })
      }),
    )

    const { user } = renderConProveedores(<AdminSedes />, {
      rutaInicial: '/admin/sedes',
      usuarioAutenticado: ADMIN,
    })

    await user.click(await screen.findByRole('button', { name: /\+ Nueva sede/i }))
    await user.type(screen.getByLabelText(/Código de la sede/i), 'sede nueva/1')
    await user.type(screen.getByLabelText(/Nombre/i), 'Sede Nueva')
    await user.type(screen.getByLabelText(/Ciudad/i), 'Bogotá')
    await user.type(screen.getByLabelText(/Capacidad/i), '100')
    await user.click(screen.getByRole('button', { name: /Crear sede/i }))

    expect(
      await screen.findByText(/Solo letras, números, guiones y guiones bajos/i),
    ).toBeInTheDocument()
    expect(peticionLlamada).toBe(false)
  })

  // TEST-FE-ADM-SED-006: código duplicado → 409 visible dentro del modal
  it('TEST-FE-ADM-SED-006: crear una sede con código duplicado muestra el error 409', async () => {
    const { user } = renderConProveedores(<AdminSedes />, {
      rutaInicial: '/admin/sedes',
      usuarioAutenticado: ADMIN,
    })

    await user.click(await screen.findByRole('button', { name: /\+ Nueva sede/i }))
    await user.type(screen.getByLabelText(/Código de la sede/i), 'VEN-SMR-01')
    await user.type(screen.getByLabelText(/Nombre/i), 'Otra Marina')
    await user.type(screen.getByLabelText(/Ciudad/i), 'Santa Marta')
    await user.type(screen.getByLabelText(/Capacidad/i), '100')
    await user.click(screen.getByRole('button', { name: /Crear sede/i }))

    expect(
      await screen.findByText(/Ya existe una sede con el código «VEN-SMR-01»/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  // TEST-FE-ADM-SED-007: eliminar con confirmación
  it('TEST-FE-ADM-SED-007: eliminar una sede pide confirmación y la quita del listado', async () => {
    const libre: VenueResponse = { id: 7, code: 'VEN-LIBRE', name: 'Sede Libre', city: 'Cali', address: null, capacity: 50, active: true }
    let sedes: VenueResponse[] = [...mockSedes, libre]
    let codigoEliminado: string | null = null
    server.use(
      http.get('/api/venues', () => HttpResponse.json(sedes)),
      http.delete('/api/venues/:code', ({ params }) => {
        codigoEliminado = String(params.code)
        sedes = sedes.filter((s) => s.code !== params.code)
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const { user } = renderConProveedores(<AdminSedes />, {
      rutaInicial: '/admin/sedes',
      usuarioAutenticado: ADMIN,
    })

    const botones = await screen.findAllByRole('button', { name: 'Eliminar Sede Libre' })
    await user.click(primero(botones))

    const dialogo = screen.getByRole('dialog')
    expect(within(dialogo).getByText(/¿Confirmas la eliminación de la sede/i)).toBeInTheDocument()
    await user.click(within(dialogo).getByRole('button', { name: 'Eliminar' }))

    expect(await screen.findByText(/Sede «Sede Libre» eliminada/i)).toBeInTheDocument()
    await waitFor(() => expect(screen.queryAllByText('Sede Libre')).toHaveLength(0))
    expect(codigoEliminado).toBe('VEN-LIBRE')
    expect(screen.getAllByText('Marina Convention Center').length).toBeGreaterThan(0)
  })

  // TEST-FE-ADM-SED-008: sede con eventos → 409 visible
  it('TEST-FE-ADM-SED-008: eliminar una sede con eventos asociados muestra el conflicto 409', async () => {
    const { user } = renderConProveedores(<AdminSedes />, {
      rutaInicial: '/admin/sedes',
      usuarioAutenticado: ADMIN,
    })

    const botones = await screen.findAllByRole('button', { name: 'Eliminar Marina Convention Center' })
    await user.click(primero(botones))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }))

    expect(
      await screen.findByText(/No se puede eliminar la sede «Marina Convention Center» porque tiene eventos asociados/i),
    ).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getAllByText('Marina Convention Center').length).toBeGreaterThan(0)
  })
})

describe('ADMIN: navegación y cliente HTTP', () => {
  // TEST-FE-ADM-NAV-001: el menú "Administrar" ofrece las tres secciones y se cierra con Escape
  it('TEST-FE-ADM-NAV-001: el menú Administrar lista eventos, artistas y sedes y se cierra con Escape', async () => {
    const { user } = renderConProveedores(<Layout />, {
      rutaInicial: '/',
      usuarioAutenticado: ADMIN,
    })

    await user.click(await screen.findByRole('button', { name: /^Administrar$/ }))

    const menu = screen.getByRole('menu')
    expect(within(menu).getByRole('menuitem', { name: 'Administrar eventos' })).toHaveAttribute(
      'href',
      '/admin/eventos',
    )
    expect(within(menu).getByRole('menuitem', { name: 'Administrar artistas' })).toHaveAttribute(
      'href',
      '/admin/artistas',
    )
    expect(within(menu).getByRole('menuitem', { name: 'Administrar sedes' })).toHaveAttribute(
      'href',
      '/admin/sedes',
    )

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  // TEST-FE-ADM-NAV-002: STAFF no ve opciones de administración
  it('TEST-FE-ADM-NAV-002: un STAFF no ve el menú Administrar', async () => {
    renderConProveedores(<Layout />, {
      rutaInicial: '/',
      usuarioAutenticado: { id: 5, username: 'staff', email: 'staff@pulsepass.test', roles: ['STAFF'] },
    })

    expect((await screen.findAllByText('Validar ingreso')).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: /^Administrar$/ })).not.toBeInTheDocument()
    expect(screen.queryByText('Administrar artistas')).not.toBeInTheDocument()
    expect(screen.queryByText('Administrar sedes')).not.toBeInTheDocument()
  })

  // TEST-FE-ADM-HTTP-001: http.delete envía DELETE y tolera 204 sin cuerpo
  it('TEST-FE-ADM-HTTP-001: http.delete usa el método DELETE y resuelve con 204 sin cuerpo', async () => {
    let metodo: string | null = null
    server.use(
      http.delete('/api/test-delete', ({ request }) => {
        metodo = request.method
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await expect(httpCliente.delete('/test-delete')).resolves.toEqual({})
    expect(metodo).toBe('DELETE')
  })
})
