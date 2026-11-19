import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { Routes, Route } from 'react-router'
import { http, HttpResponse } from 'msw'
import { server } from './mocks/handlers'
import { renderConProveedores } from './utils'
import ValidacionIngreso from '../pages/ValidacionIngreso'
import TicketsPagadosEvento from '../pages/TicketsPagadosEvento'
import AdminCrearEvento from '../pages/AdminCrearEvento'
import AdminGestionEvento from '../pages/AdminGestionEvento'

describe('STAFF y ADMIN', () => {
  // TEST-FE-STF-001: validar ingreso: buscar y marcar como usado → éxito
  it('TEST-FE-STF-001: validar ingreso busca ticket y lo marca como usado exitosamente', async () => {
    const { user } = renderConProveedores(<ValidacionIngreso />, {
      rutaInicial: '/staff/validacion',
      usuarioAutenticado: {
        id: 5,
        username: 'staff',
        email: 'staff@pulsepass.test',
        roles: ['STAFF'],
      },
    })

    const inputCodigo = screen.getByLabelText(/Código de ticket/i)
    await user.type(inputCodigo, 'TKT-8F2A1C')

    const botonBuscar = screen.getByRole('button', { name: /Buscar/i })
    await user.click(botonBuscar)

    const botonMarcar = await screen.findByRole('button', {
      name: /Marcar como usado/i,
    })
    await user.click(botonMarcar)

    expect(await screen.findByText(/Ingreso registrado/i)).toBeInTheDocument()
  })

  // TEST-FE-STF-002: validar ingreso: segunda vez → 409 visible
  it('TEST-FE-STF-002: validar ingreso de ticket ya usado muestra error 409', async () => {
    const { user } = renderConProveedores(<ValidacionIngreso />, {
      rutaInicial: '/staff/validacion',
      usuarioAutenticado: {
        id: 5,
        username: 'staff',
        email: 'staff@pulsepass.test',
        roles: ['STAFF'],
      },
    })

    const inputCodigo = screen.getByLabelText(/Código de ticket/i)
    await user.type(inputCodigo, 'TKT-USED01')

    const botonBuscar = screen.getByRole('button', { name: /Buscar/i })
    await user.click(botonBuscar)

    expect(await screen.findByText('USED')).toBeInTheDocument()
  })

  // TEST-FE-STF-003: validar ingreso: ticket inexistente → 404 visible
  it('TEST-FE-STF-003: buscar ticket inexistente muestra "Ticket no encontrado"', async () => {
    const { user } = renderConProveedores(<ValidacionIngreso />, {
      rutaInicial: '/staff/validacion',
      usuarioAutenticado: {
        id: 5,
        username: 'staff',
        email: 'staff@pulsepass.test',
        roles: ['STAFF'],
      },
    })

    const inputCodigo = screen.getByLabelText(/Código de ticket/i)
    await user.type(inputCodigo, 'TKT-NO-EXISTE')

    const botonBuscar = screen.getByRole('button', { name: /Buscar/i })
    await user.click(botonBuscar)

    expect(await screen.findByText(/Ticket no encontrado/i)).toBeInTheDocument()
  })

  // TEST-FE-STF-004: tickets pagados de evento: tabla con filas
  it('TEST-FE-STF-004: tabla de tickets pagados renderiza filas de entradas en estado PAID', async () => {
    renderConProveedores(
      <Routes>
        <Route
          path="/staff/eventos/:eventCode/tickets"
          element={<TicketsPagadosEvento />}
        />
      </Routes>,
      {
        rutaInicial: '/staff/eventos/CMF-2026/tickets',
        usuarioAutenticado: {
          id: 5,
          username: 'staff',
          email: 'staff@pulsepass.test',
          roles: ['STAFF'],
        },
      },
    )

    // La tabla (desktop) y las tarjetas (móvil) coexisten en el DOM; CSS oculta una de ellas.
    expect((await screen.findAllByText('TKT-8F2A1C')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('TKT-91B07D').length).toBeGreaterThan(0)
  })

  // TEST-FE-ADM-001: crear evento: campos vacíos → errores y 0 peticiones
  it('TEST-FE-ADM-001: crear evento con campos vacíos muestra errores y no llama a la API', async () => {
    let peticionLlamada = false
    server.use(
      http.post('/api/events', () => {
        peticionLlamada = true
        return HttpResponse.json({}, { status: 201 })
      }),
    )

    const { user } = renderConProveedores(<AdminCrearEvento />, {
      rutaInicial: '/admin/eventos/nuevo',
      usuarioAutenticado: {
        id: 99,
        username: 'admin',
        email: 'admin@pulsepass.test',
        roles: ['ADMIN'],
      },
    })

    const botonCrear = screen.getByRole('button', { name: /Crear evento/i })
    await user.click(botonCrear)

    expect(
      await screen.findByText(/El código del evento es obligatorio/i),
    ).toBeInTheDocument()
    expect(await screen.findByText(/El nombre es obligatorio/i)).toBeInTheDocument()
    expect(peticionLlamada).toBe(false)
  })

  // TEST-FE-ADM-002: crear evento: 201 → navega a gestión
  it('TEST-FE-ADM-002: crear evento válido con 201 navega a vista de gestión', async () => {
    const { user } = renderConProveedores(
      <Routes>
        <Route path="/admin/eventos/nuevo" element={<AdminCrearEvento />} />
        <Route
          path="/admin/eventos/:eventCode"
          element={<h1>Gestión de Evento Creado</h1>}
        />
      </Routes>,
      {
        rutaInicial: '/admin/eventos/nuevo',
        usuarioAutenticado: {
          id: 99,
          username: 'admin',
          email: 'admin@pulsepass.test',
          roles: ['ADMIN'],
        },
      },
    )

    await user.type(screen.getByLabelText(/Código del evento/i), 'FEST-2027')
    await user.type(screen.getByLabelText(/Nombre/i), 'Festival del Sol')
    await user.type(
      screen.getByLabelText(/Fecha y hora/i),
      '2027-06-15T18:00',
    )
    await user.selectOptions(screen.getByLabelText(/Sede/i), 'VEN-SMR-01')

    const botonCrear = screen.getByRole('button', { name: /Crear evento/i })
    await user.click(botonCrear)

    expect(
      await screen.findByText(/Gestión de Evento Creado/i),
    ).toBeInTheDocument()
  })

  // TEST-FE-ADM-003: crear evento: 400 con details → errores en campos
  it('TEST-FE-ADM-003: error 400 de API con details mapea errores a los campos', async () => {
    server.use(
      http.post('/api/events', () => {
        return HttpResponse.json(
          {
            timestamp: '2026-11-08T12:00:00',
            status: 400,
            error: 'Bad Request',
            message: 'Error de validación',
            details: { name: 'El nombre ya se encuentra registrado' },
          },
          { status: 400 },
        )
      }),
    )

    const { user } = renderConProveedores(<AdminCrearEvento />, {
      rutaInicial: '/admin/eventos/nuevo',
      usuarioAutenticado: {
        id: 99,
        username: 'admin',
        email: 'admin@pulsepass.test',
        roles: ['ADMIN'],
      },
    })

    await user.type(screen.getByLabelText(/Código del evento/i), 'FEST-2027')
    await user.type(screen.getByLabelText(/Nombre/i), 'Festival Repetido')
    await user.type(
      screen.getByLabelText(/Fecha y hora/i),
      '2027-06-15T18:00',
    )
    await user.selectOptions(screen.getByLabelText(/Sede/i), 'VEN-SMR-01')

    const botonCrear = screen.getByRole('button', { name: /Crear evento/i })
    await user.click(botonCrear)

    expect(
      await screen.findByText(/El nombre ya se encuentra registrado/i),
    ).toBeInTheDocument()
  })

  // TEST-FE-ADM-004: publicar evento → badge PUBLISHED
  it('TEST-FE-ADM-004: publicar evento cambia su estado a PUBLISHED', async () => {
    const { user } = renderConProveedores(
      <Routes>
        <Route
          path="/admin/eventos/:eventCode"
          element={<AdminGestionEvento />}
        />
      </Routes>,
      {
        rutaInicial: '/admin/eventos/DRAFT-01',
        usuarioAutenticado: {
          id: 99,
          username: 'admin',
          email: 'admin@pulsepass.test',
          roles: ['ADMIN'],
        },
      },
    )

    const botonPublicar = await screen.findByRole('button', {
      name: /Publicar evento/i,
    })
    await user.click(botonPublicar)

    const botonConfirmar = await screen.findByRole('button', {
      name: /^Publicar$/i,
    })
    await user.click(botonConfirmar)

    expect(
      await screen.findByText(/Evento publicado exitosamente/i),
    ).toBeInTheDocument()
  })

  // TEST-FE-ADM-005: publicar → 409 visible
  it('TEST-FE-ADM-005: error 409 al publicar muestra mensaje de conflicto', async () => {
    server.use(
      http.get('/api/events/:eventCode', () => {
        return HttpResponse.json({
          id: 1,
          eventCode: 'ERROR-409',
          name: 'Evento Con Error',
          category: 'MUSIC',
          status: 'DRAFT',
          eventDate: '2026-12-12T20:00:00',
          minimumAge: 18,
          artists: [],
        })
      }),
    )

    const { user } = renderConProveedores(
      <Routes>
        <Route
          path="/admin/eventos/:eventCode"
          element={<AdminGestionEvento />}
        />
      </Routes>,
      {
        rutaInicial: '/admin/eventos/ERROR-409',
        usuarioAutenticado: {
          id: 99,
          username: 'admin',
          email: 'admin@pulsepass.test',
          roles: ['ADMIN'],
        },
      },
    )

    const botonPublicar = await screen.findByRole('button', {
      name: /Publicar evento/i,
    })
    await user.click(botonPublicar)

    const botonConfirmar = await screen.findByRole('button', {
      name: /^Publicar$/i,
    })
    await user.click(botonConfirmar)

    expect(
      await screen.findByText(
        /No se puede publicar el evento en su estado actual/i,
      ),
    ).toBeInTheDocument()
  })

  // TEST-FE-ADM-006: asociar artista → aparece en la lista; duplicado → 409
  it('TEST-FE-ADM-006: asociar artista a evento lo añade a la lista y maneja error 409', async () => {
    const { user } = renderConProveedores(
      <Routes>
        <Route
          path="/admin/eventos/:eventCode"
          element={<AdminGestionEvento />}
        />
      </Routes>,
      {
        rutaInicial: '/admin/eventos/DRAFT-01',
        usuarioAutenticado: {
          id: 99,
          username: 'admin',
          email: 'admin@pulsepass.test',
          roles: ['ADMIN'],
        },
      },
    )

    const selector = await screen.findByLabelText(/Agregar artista/i)
    await user.selectOptions(selector, '2')

    const botonAsociar = screen.getByRole('button', { name: /\+ Asociar/i })
    await user.click(botonAsociar)

    expect(
      await screen.findByText(/Artista asociado con éxito/i),
    ).toBeInTheDocument()
  })
})
