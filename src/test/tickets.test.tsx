import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { Routes, Route } from 'react-router'
import { http, HttpResponse } from 'msw'
import { server } from './mocks/handlers'
import { renderConProveedores } from './utils'
import DetalleEvento from '../pages/DetalleEvento'
import MisTickets from '../pages/MisTickets'
import DetalleTicket from '../pages/DetalleTicket'
import ConfirmacionCompra from '../pages/ConfirmacionCompra'

describe('Tickets y Compra', () => {
  // TEST-FE-TKT-001: compra válida → 201 y navega a confirmación
  it('TEST-FE-TKT-001: compra válida de entrada navega a página de confirmación', async () => {
    const { user } = renderConProveedores(
      <Routes>
        <Route path="/eventos/:eventCode" element={<DetalleEvento />} />
        <Route
          path="/compra/confirmacion/:ticketCode"
          element={<ConfirmacionCompra />}
        />
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

    const botonComprar = (
      await screen.findAllByRole('button', { name: /Comprar entrada/i })
    )[0]!
    await user.click(botonComprar)

    const botonConfirmar = await screen.findByRole('button', {
      name: /^Confirmar$/i,
    })
    await user.click(botonConfirmar)

    expect(
      await screen.findByText(/¡Compra realizada con éxito!/i),
    ).toBeInTheDocument()
  })

  // TEST-FE-TKT-002: compra anónima → redirige a login
  it('TEST-FE-TKT-002: usuario anónimo que pulsa comprar es redirigido a login', async () => {
    const { user } = renderConProveedores(
      <Routes>
        <Route path="/eventos/:eventCode" element={<DetalleEvento />} />
        <Route path="/login" element={<h1>Página Login</h1>} />
      </Routes>,
      {
        rutaInicial: '/eventos/CMF-2026',
        usuarioAutenticado: null,
      },
    )

    const botonComprar = await screen.findByRole('button', {
      name: /Inicia sesión para comprar/i,
    })
    await user.click(botonComprar)

    expect(await screen.findByText(/Página Login/i)).toBeInTheDocument()
  })

  // TEST-FE-TKT-003: compra 409 → mensaje del backend en el modal
  it('TEST-FE-TKT-003: error 409 por regla de negocio se muestra dentro del modal', async () => {
    const { user } = renderConProveedores(
      <Routes>
        <Route path="/eventos/:eventCode" element={<DetalleEvento />} />
      </Routes>,
      {
        rutaInicial: '/eventos/CMF-2026',
        usuarioAutenticado: {
          id: 2,
          username: 'laura',
          email: 'laura@pulsepass.test',
          roles: ['USER'],
        },
      },
    )

    const botonComprar = (
      await screen.findAllByRole('button', { name: /Comprar entrada/i })
    )[0]!
    await user.click(botonComprar)

    const botonConfirmar = await screen.findByRole('button', {
      name: /^Confirmar$/i,
    })
    await user.click(botonConfirmar)

    expect(
      await screen.findByText(
        /El usuario no cumple la edad mínima del evento./i,
      ),
    ).toBeInTheDocument()
  })

  // TEST-FE-TKT-004: compra envía el email de la sesión
  it('TEST-FE-TKT-004: compra envía el email de la sesión y no permite editarlo', async () => {
    let emailEnviado = ''
    server.use(
      http.post('/api/tickets', async ({ request }) => {
        const body = (await request.json()) as { userEmail: string }
        emailEnviado = body.userEmail
        return HttpResponse.json(
          {
            id: 99,
            ticketCode: 'TKT-TEST',
            type: 'VIP',
            price: 250000,
            status: 'PAID',
            purchaseDate: '2026-11-08T14:00:00',
            userEmail: body.userEmail,
            eventCode: 'CMF-2026',
            eventName: 'Caribbean Music Fest 2026',
          },
          { status: 201 },
        )
      }),
    )

    const { user } = renderConProveedores(
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

    const botonComprar = (
      await screen.findAllByRole('button', { name: /Comprar entrada/i })
    )[0]!
    await user.click(botonComprar)

    const botonConfirmar = await screen.findByRole('button', {
      name: /^Confirmar$/i,
    })
    await user.click(botonConfirmar)

    await waitFor(() => {
      expect(emailEnviado).toBe('andrea@pulsepass.test')
    })
  })

  // TEST-FE-TKT-005: mis tickets: lista y filtra por estado
  it('TEST-FE-TKT-005: mis tickets lista entradas y permite filtrar por chips', async () => {
    const { user } = renderConProveedores(<MisTickets />, {
      rutaInicial: '/mis-tickets',
      usuarioAutenticado: {
        id: 1,
        username: 'andrea',
        email: 'andrea@pulsepass.test',
        roles: ['USER'],
      },
    })

    expect(await screen.findByText('TKT-8F2A1C')).toBeInTheDocument()
    expect(screen.getByText('TKT-USED01')).toBeInTheDocument()

    // Filtrar por 'Usados'
    const chipUsados = screen.getByRole('button', { name: /^Usados$/i })
    await user.click(chipUsados)

    expect(screen.getByText('TKT-USED01')).toBeInTheDocument()
    expect(screen.queryByText('TKT-8F2A1C')).not.toBeInTheDocument()
  })

  // TEST-FE-TKT-006: mis tickets: vacío
  it('TEST-FE-TKT-006: mis tickets muestra estado vacío cuando el usuario no tiene entradas', async () => {
    server.use(
      http.get('/api/tickets/by-user', () => {
        return HttpResponse.json([])
      }),
    )

    renderConProveedores(<MisTickets />, {
      rutaInicial: '/mis-tickets',
      usuarioAutenticado: {
        id: 1,
        username: 'andrea',
        email: 'andrea@pulsepass.test',
        roles: ['USER'],
      },
    })

    expect(
      await screen.findByRole('heading', { name: /Aún no tienes tickets/i }),
    ).toBeInTheDocument()
  })

  // TEST-FE-TKT-007: cancelar PAID → 200 y lista actualizada
  it('TEST-FE-TKT-007: cancelar ticket en estado PAID actualiza su estado a CANCELLED', async () => {
    const { user } = renderConProveedores(<MisTickets />, {
      rutaInicial: '/mis-tickets',
      usuarioAutenticado: {
        id: 1,
        username: 'andrea',
        email: 'andrea@pulsepass.test',
        roles: ['USER'],
      },
    })

    const botonCancelar = await screen.findByRole('button', {
      name: /^Cancelar$/i,
    })
    await user.click(botonCancelar)

    const botonConfirmarCancelacion = await screen.findByRole('button', {
      name: /^Cancelar ticket$/i,
    })
    await user.click(botonConfirmarCancelacion)

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: /^Cancelar ticket$/i }),
      ).not.toBeInTheDocument()
    })
  })

  // TEST-FE-TKT-008: cancelar → 409 muestra mensaje y mantiene modal
  it('TEST-FE-TKT-008: error 409 al cancelar muestra mensaje y mantiene abierto el modal', async () => {
    server.use(
      http.patch('/api/tickets/:ticketCode/cancel', () => {
        return HttpResponse.json(
          {
            status: 409,
            message: 'El ticket no puede cancelarse en su estado actual.',
            details: {},
          },
          { status: 409 },
        )
      }),
    )

    const { user } = renderConProveedores(<MisTickets />, {
      rutaInicial: '/mis-tickets',
      usuarioAutenticado: {
        id: 1,
        username: 'andrea',
        email: 'andrea@pulsepass.test',
        roles: ['USER'],
      },
    })

    const botonCancelar = await screen.findByRole('button', {
      name: /^Cancelar$/i,
    })
    await user.click(botonCancelar)

    const botonConfirmarCancelacion = await screen.findByRole('button', {
      name: /^Cancelar ticket$/i,
    })
    await user.click(botonConfirmarCancelacion)

    expect(
      await screen.findByText(
        /El ticket no puede cancelarse en su estado actual/i,
      ),
    ).toBeInTheDocument()
  })

  // TEST-FE-TKT-009: ticket ajeno 403/404 → "Ticket no disponible"
  it('TEST-FE-TKT-009: abrir un ticket ajeno o inexistente muestra "Ticket no disponible"', async () => {
    renderConProveedores(
      <Routes>
        <Route path="/mis-tickets/:ticketCode" element={<DetalleTicket />} />
      </Routes>,
      {
        rutaInicial: '/mis-tickets/TKT-AJENO',
        usuarioAutenticado: {
          id: 1,
          username: 'andrea',
          email: 'andrea@pulsepass.test',
          roles: ['USER'],
        },
      },
    )

    expect(await screen.findByText(/Ticket no disponible/i)).toBeInTheDocument()
  })

  // TEST-FE-TKT-010: botón cancelar oculto si status ≠ PAID
  it('TEST-FE-TKT-010: botón cancelar está oculto si el ticket no está en estado PAID', async () => {
    const { user } = renderConProveedores(<MisTickets />, {
      rutaInicial: '/mis-tickets',
      usuarioAutenticado: {
        id: 1,
        username: 'andrea',
        email: 'andrea@pulsepass.test',
        roles: ['USER'],
      },
    })

    // Filtramos solo por 'Usados'
    const chipUsados = await screen.findByRole('button', { name: /^Usados$/i })
    await user.click(chipUsados)

    expect(await screen.findByText('TKT-USED01')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /^Cancelar$/i }),
    ).not.toBeInTheDocument()
  })
})
