import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

export const mockArtistas = [
  { id: 1, stageName: 'Solar Beat', genre: 'Electrónica', country: 'Colombia', active: true },
  { id: 2, stageName: 'Neon Waves', genre: 'Synthwave', country: 'Colombia', active: true },
  { id: 3, stageName: 'Caribbean Sound', genre: 'Fusión caribeña', country: 'Colombia', active: true },
]

export const mockSedes = [
  {
    id: 1,
    code: 'VEN-SMR-01',
    name: 'Marina Convention Center',
    city: 'Santa Marta',
    address: 'Carrera 1 # 22-10',
    capacity: 3,
    active: true,
  },
]

export const mockEventos = [
  {
    id: 1,
    eventCode: 'CMF-2026',
    name: 'Caribbean Music Fest 2026',
    description: 'Tres noches de música caribeña frente a la bahía de Santa Marta.',
    category: 'MUSIC',
    status: 'PUBLISHED',
    eventDate: '2026-12-12T20:00:00',
    minimumAge: 18,
    venueCode: 'VEN-SMR-01',
    venueName: 'Marina Convention Center',
    artists: [mockArtistas[0], mockArtistas[1]],
  },
  {
    id: 2,
    eventCode: 'SOLD-01',
    name: 'Sold Out Event',
    description: 'Evento totalmente agotado.',
    category: 'MUSIC',
    status: 'SOLD_OUT',
    eventDate: '2026-11-20T20:00:00',
    minimumAge: 18,
    venueCode: 'VEN-SMR-01',
    venueName: 'Marina Convention Center',
    artists: [],
  },
  {
    id: 3,
    eventCode: 'DRAFT-01',
    name: 'Draft Event',
    description: 'Evento en borrador.',
    category: 'MUSIC',
    status: 'DRAFT',
    eventDate: '2026-12-30T20:00:00',
    minimumAge: 18,
    venueCode: 'VEN-SMR-01',
    venueName: 'Marina Convention Center',
    artists: [mockArtistas[0]],
  },
]

export const mockTickets = [
  {
    id: 1,
    ticketCode: 'TKT-8F2A1C',
    type: 'VIP',
    price: 250000,
    status: 'PAID',
    purchaseDate: '2026-11-05T14:32:00',
    userEmail: 'andrea@pulsepass.test',
    eventCode: 'CMF-2026',
    eventName: 'Caribbean Music Fest 2026',
  },
  {
    id: 2,
    ticketCode: 'TKT-91B07D',
    type: 'GENERAL',
    price: 120000,
    status: 'PAID',
    purchaseDate: '2026-11-06T10:15:00',
    userEmail: 'carlos@pulsepass.test',
    eventCode: 'CMF-2026',
    eventName: 'Caribbean Music Fest 2026',
  },
  {
    id: 3,
    ticketCode: 'TKT-USED01',
    type: 'GENERAL',
    price: 120000,
    status: 'USED',
    purchaseDate: '2026-11-01T12:00:00',
    userEmail: 'andrea@pulsepass.test',
    eventCode: 'CMF-2026',
    eventName: 'Caribbean Music Fest 2026',
  },
]

export const handlers = [
  // Auth
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { identifier?: string; password?: string }
    if (body.identifier === 'credenciales_malas' || body.password === 'incorrecta') {
      return HttpResponse.json(
        { timestamp: '2026-11-08T12:00:00', status: 401, error: 'Unauthorized', message: 'Credenciales inválidas', details: {} },
        { status: 401 },
      )
    }
    return HttpResponse.json({
      accessToken: 'mock-jwt-token-xyz',
      tokenType: 'Bearer',
      expiresIn: 900,
    })
  }),

  http.get('/api/auth/me', ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      return HttpResponse.json(
        { timestamp: '2026-11-08T12:00:00', status: 401, error: 'Unauthorized', message: 'Token no provisto', details: {} },
        { status: 401 },
      )
    }
    // Token de prueba con formato mock-test-jwt-token|id|username|email|ROLES (ver test/utils.tsx)
    const [prefijo, id, username, email, roles] = auth.slice('Bearer '.length).split('|')
    if (prefijo === 'mock-test-jwt-token' && id && username && email && roles) {
      return HttpResponse.json({
        id: Number(id),
        username,
        email,
        roles: roles.split(',').map((r) => `ROLE_${r}`),
      })
    }
    return HttpResponse.json({
      id: 1,
      username: 'andrea',
      email: 'andrea@pulsepass.test',
      roles: ['ROLE_USER'],
    })
  }),

  http.post('/api/users', async ({ request }) => {
    const body = (await request.json()) as { email?: string; username?: string; password?: string }
    if (body.email === 'duplicado@pulsepass.test' || body.username === 'duplicado') {
      return HttpResponse.json(
        {
          timestamp: '2026-11-08T12:00:00',
          status: 409,
          error: 'Conflict',
          message: 'El usuario o correo ya está registrado',
          details: {},
        },
        { status: 409 },
      )
    }
    return HttpResponse.json(
      {
        id: 10,
        username: body.username || 'nuevo',
        email: body.email || 'nuevo@test.com',
        active: true,
        firstName: 'Nuevo',
        lastName: 'Usuario',
        phone: null,
        city: null,
        birthDate: '2000-01-01',
      },
      { status: 201 },
    )
  }),

  // Users
  http.get('/api/users/by-email', ({ request }) => {
    const url = new URL(request.url)
    const email = url.searchParams.get('email')
    return HttpResponse.json({
      id: 1,
      username: 'andrea',
      email: email || 'andrea@pulsepass.test',
      active: true,
      firstName: 'Andrea',
      lastName: 'Ruiz',
      phone: '3001234567',
      city: 'Santa Marta',
      birthDate: '1998-04-12',
    })
  }),

  http.get('/api/users/by-username', ({ request }) => {
    const url = new URL(request.url)
    const username = url.searchParams.get('username')
    return HttpResponse.json({
      id: 1,
      username: username || 'andrea',
      email: 'andrea@pulsepass.test',
      active: true,
      firstName: 'Andrea',
      lastName: 'Ruiz',
      phone: '3001234567',
      city: 'Santa Marta',
      birthDate: '1998-04-12',
    })
  }),

  // Artistas
  http.get('/api/artists/active', () => {
    return HttpResponse.json(mockArtistas)
  }),

  http.get('/api/artists/by-stage-name', ({ request }) => {
    const url = new URL(request.url)
    const stageName = url.searchParams.get('stageName')
    const artista = mockArtistas.find((a) => a.stageName.toLowerCase() === stageName?.toLowerCase())
    if (!artista) {
      return HttpResponse.json({ status: 404, message: 'Artista no encontrado', details: {} }, { status: 404 })
    }
    return HttpResponse.json(artista)
  }),

  http.get('/api/artists', () => {
    return HttpResponse.json(mockArtistas)
  }),

  http.post('/api/artists', async ({ request }) => {
    const body = (await request.json()) as { stageName: string; country?: string; genre?: string }
    if (body.stageName.toLowerCase() === 'solar beat') {
      return HttpResponse.json(
        { timestamp: '2026-11-08T12:00:00', status: 409, error: 'Conflict', message: 'Artist already exists: Solar Beat', details: {} },
        { status: 409 },
      )
    }
    return HttpResponse.json(
      { id: 99, stageName: body.stageName, country: body.country || null, genre: body.genre || null, active: true },
      { status: 201 },
    )
  }),

  http.delete('/api/artists/:id', ({ params }) => {
    const id = Number(params.id)
    // Los artistas 1 y 2 participan en eventos: la API no permite eliminarlos
    if (id === 1 || id === 2) {
      return HttpResponse.json(
        { timestamp: '2026-11-08T12:00:00', status: 409, error: 'Conflict', message: 'Cannot delete artist: it is associated with 1 event(s).', details: {} },
        { status: 409 },
      )
    }
    if (id === 404) {
      return HttpResponse.json({ status: 404, message: 'Artist not found: 404', details: {} }, { status: 404 })
    }
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/artists/:id', ({ params }) => {
    const id = Number(params.id)
    const artista = mockArtistas.find((a) => a.id === id)
    if (!artista) {
      return HttpResponse.json({ status: 404, message: 'Artista no encontrado', details: {} }, { status: 404 })
    }
    return HttpResponse.json(artista)
  }),

  // Sedes
  http.get('/api/venues/active', () => {
    return HttpResponse.json(mockSedes)
  }),

  http.get('/api/venues', () => {
    return HttpResponse.json(mockSedes)
  }),

  http.post('/api/venues', async ({ request }) => {
    const body = (await request.json()) as {
      code: string
      name: string
      city: string
      address?: string
      capacity: number
    }
    if (body.code.toUpperCase() === 'VEN-SMR-01') {
      return HttpResponse.json(
        { timestamp: '2026-11-08T12:00:00', status: 409, error: 'Conflict', message: 'Venue already exists: VEN-SMR-01', details: {} },
        { status: 409 },
      )
    }
    return HttpResponse.json(
      { id: 99, ...body, address: body.address || null, active: true },
      { status: 201 },
    )
  }),

  http.delete('/api/venues/:code', ({ params }) => {
    const code = String(params.code)
    // VEN-SMR-01 tiene eventos asociados: la API no permite eliminarla
    if (code === 'VEN-SMR-01') {
      return HttpResponse.json(
        { timestamp: '2026-11-08T12:00:00', status: 409, error: 'Conflict', message: 'Cannot delete venue VEN-SMR-01: it has 3 associated event(s).', details: {} },
        { status: 409 },
      )
    }
    if (code === 'NO-EXISTE') {
      return HttpResponse.json({ status: 404, message: 'Venue not found: NO-EXISTE', details: {} }, { status: 404 })
    }
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/venues/:code', ({ params }) => {
    const sede = mockSedes.find((s) => s.code.toLowerCase() === String(params.code).toLowerCase())
    if (!sede) {
      return HttpResponse.json({ status: 404, message: 'Sede no encontrada', details: {} }, { status: 404 })
    }
    return HttpResponse.json(sede)
  }),

  // Eventos
  http.get('/api/events/published', () => {
    const publicados = mockEventos.filter((e) => e.status === 'PUBLISHED')
    return HttpResponse.json(publicados)
  }),

  http.get('/api/events/by-artist', ({ request }) => {
    const url = new URL(request.url)
    const stageName = url.searchParams.get('stageName')
    const filtrados = mockEventos.filter((e) =>
      e.artists.some((a) => a?.stageName.toLowerCase() === stageName?.toLowerCase()),
    )
    return HttpResponse.json(filtrados)
  }),

  http.get('/api/events/:eventCode', ({ params }) => {
    const code = String(params.eventCode)
    const evento = mockEventos.find((e) => e.eventCode.toLowerCase() === code.toLowerCase())
    if (!evento) {
      return HttpResponse.json({ status: 404, message: 'Evento no disponible', details: {} }, { status: 404 })
    }
    return HttpResponse.json(evento)
  }),

  http.post('/api/events', async ({ request }) => {
    const body = (await request.json()) as { eventCode: string; name: string }
    if (body.eventCode === 'DUPLICADO') {
      return HttpResponse.json(
        { timestamp: '2026-11-08T12:00:00', status: 409, error: 'Conflict', message: 'El código de evento ya existe', details: {} },
        { status: 409 },
      )
    }
    return HttpResponse.json(
      {
        id: 99,
        eventCode: body.eventCode,
        name: body.name,
        category: 'MUSIC',
        status: 'DRAFT',
        eventDate: '2026-12-30T20:00:00',
        minimumAge: 18,
        venueCode: 'VEN-SMR-01',
        venueName: 'Marina Convention Center',
        artists: [],
      },
      { status: 201 },
    )
  }),

  http.patch('/api/events/:eventCode/publish', ({ params }) => {
    const code = String(params.eventCode)
    if (code === 'ERROR-409') {
      return HttpResponse.json(
        { status: 409, message: 'No se puede publicar el evento en su estado actual', details: {} },
        { status: 409 },
      )
    }
    return HttpResponse.json({
      id: 1,
      eventCode: code,
      name: 'Caribbean Music Fest 2026',
      category: 'MUSIC',
      status: 'PUBLISHED',
      eventDate: '2026-12-12T20:00:00',
      minimumAge: 18,
      venueCode: 'VEN-SMR-01',
      venueName: 'Marina Convention Center',
      artists: [],
    })
  }),

  http.post('/api/events/:eventCode/artists/:artistId', ({ params }) => {
    const artistId = Number(params.artistId)
    if (artistId === 999) {
      return HttpResponse.json(
        { status: 409, message: 'El artista ya se encuentra asociado al evento', details: {} },
        { status: 409 },
      )
    }
    return HttpResponse.json({
      id: 1,
      eventCode: String(params.eventCode),
      name: 'Caribbean Music Fest 2026',
      category: 'MUSIC',
      status: 'DRAFT',
      eventDate: '2026-12-12T20:00:00',
      minimumAge: 18,
      venueCode: 'VEN-SMR-01',
      venueName: 'Marina Convention Center',
      artists: [...mockArtistas],
    })
  }),

  // Tickets
  http.get('/api/tickets/by-user', ({ request }) => {
    const url = new URL(request.url)
    const email = url.searchParams.get('email')
    const usuarioTickets = mockTickets.filter((t) => t.userEmail.toLowerCase() === email?.toLowerCase())
    return HttpResponse.json(usuarioTickets)
  }),

  http.get('/api/events/:eventCode/tickets/paid', () => {
    const pagados = mockTickets.filter((t) => t.status === 'PAID')
    return HttpResponse.json(pagados)
  }),

  http.get('/api/tickets/:ticketCode', ({ params }) => {
    const code = String(params.ticketCode)
    if (code === 'TKT-AJENO') {
      return HttpResponse.json({ status: 403, message: 'Sin permisos', details: {} }, { status: 403 })
    }
    if (code === 'TKT-NUEVO01') {
      // Ticket recién creado por el mock de POST /api/tickets
      return HttpResponse.json({
        id: 50,
        ticketCode: 'TKT-NUEVO01',
        type: 'VIP',
        price: 250000,
        status: 'PAID',
        purchaseDate: '2026-11-08T14:00:00',
        userEmail: 'andrea@pulsepass.test',
        eventCode: 'CMF-2026',
        eventName: 'Caribbean Music Fest 2026',
      })
    }
    const ticket = mockTickets.find((t) => t.ticketCode.toLowerCase() === code.toLowerCase())
    if (!ticket) {
      return HttpResponse.json({ status: 404, message: 'Ticket no disponible', details: {} }, { status: 404 })
    }
    return HttpResponse.json(ticket)
  }),

  http.post('/api/tickets', async ({ request }) => {
    const body = (await request.json()) as { userEmail?: string; eventCode?: string; type?: string }
    if (body.userEmail === 'laura@pulsepass.test') {
      return HttpResponse.json(
        { timestamp: '2026-11-08T12:00:00', status: 409, error: 'Conflict', message: 'El usuario no cumple la edad mínima del evento.', details: {} },
        { status: 409 },
      )
    }
    return HttpResponse.json(
      {
        id: 50,
        ticketCode: 'TKT-NUEVO01',
        type: body.type || 'VIP',
        price: 250000,
        status: 'PAID',
        purchaseDate: '2026-11-08T14:00:00',
        userEmail: body.userEmail || 'andrea@pulsepass.test',
        eventCode: body.eventCode || 'CMF-2026',
        eventName: 'Caribbean Music Fest 2026',
      },
      { status: 201 },
    )
  }),

  http.patch('/api/tickets/:ticketCode/cancel', ({ params }) => {
    const code = String(params.ticketCode)
    if (code === 'TKT-USED01' || code === 'TKT-NOCANCEL') {
      return HttpResponse.json(
        { status: 409, message: 'El ticket no puede cancelarse en su estado actual.', details: {} },
        { status: 409 },
      )
    }
    return HttpResponse.json({
      id: 1,
      ticketCode: code,
      type: 'VIP',
      price: 250000,
      status: 'CANCELLED',
      purchaseDate: '2026-11-05T14:32:00',
      userEmail: 'andrea@pulsepass.test',
      eventCode: 'CMF-2026',
      eventName: 'Caribbean Music Fest 2026',
    })
  }),

  http.patch('/api/tickets/:ticketCode/use', ({ params }) => {
    const code = String(params.ticketCode)
    if (code === 'TKT-USED01' || code === 'YA-USADO') {
      return HttpResponse.json(
        { status: 409, message: 'El ticket ya fue utilizado. (409)', details: {} },
        { status: 409 },
      )
    }
    return HttpResponse.json({
      id: 1,
      ticketCode: code,
      type: 'VIP',
      price: 250000,
      status: 'USED',
      purchaseDate: '2026-11-05T14:32:00',
      userEmail: 'andrea@pulsepass.test',
      eventCode: 'CMF-2026',
      eventName: 'Caribbean Music Fest 2026',
    })
  }),
]

export const server = setupServer(...handlers)
