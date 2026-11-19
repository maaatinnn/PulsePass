import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from './mocks/handlers'
import {
  clienteHttp,
  ApiError,
  registrarTokenGetter,
  registrarOnUnauthorized,
} from '../lib/http'
import { formatearPrecioCOP } from '../lib/formato'

describe('Infraestructura y utilidades', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  // TEST-FE-LIB-001: http: añade Authorization Bearer cuando hay sesión
  it('TEST-FE-LIB-001: http añade Authorization Bearer cuando hay sesión', async () => {
    let cabeceraRecibida: string | null = null

    server.use(
      http.get('/api/test-auth-header', ({ request }) => {
        cabeceraRecibida = request.headers.get('Authorization')
        return HttpResponse.json({ ok: true })
      }),
    )

    registrarTokenGetter(() => 'mi-token-secreto-123')
    await clienteHttp('/test-auth-header')

    expect(cabeceraRecibida).toBe('Bearer mi-token-secreto-123')
  })

  // TEST-FE-LIB-002: http: ErrorResponse válido → ApiError con status y details
  it('TEST-FE-LIB-002: http convierte ErrorResponse válido en ApiError con status y details', async () => {
    server.use(
      http.get('/api/test-error-valido', () => {
        return HttpResponse.json(
          {
            timestamp: '2026-11-08T12:00:00',
            status: 400,
            error: 'Bad Request',
            message: 'Error de validación',
            details: { email: 'Email no válido', nombre: 'Nombre requerido' },
          },
          { status: 400 },
        )
      }),
    )

    try {
      await clienteHttp('/test-error-valido')
      expect.unreachable('Debería haber lanzado ApiError')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      const apiErr = err as ApiError
      expect(apiErr.status).toBe(400)
      expect(apiErr.message).toBe('Error de validación')
      expect(apiErr.details).toEqual({
        email: 'Email no válido',
        nombre: 'Nombre requerido',
      })
    }
  })

  // TEST-FE-LIB-003: http: cuerpo de error inválido → ApiError genérico
  it('TEST-FE-LIB-003: http produce ApiError genérico ante cuerpo de error inválido', async () => {
    server.use(
      http.get('/api/test-error-invalido', () => {
        return new HttpResponse('Internal Error en texto plano', { status: 500 })
      }),
    )

    try {
      await clienteHttp('/test-error-invalido')
      expect.unreachable('Debería haber lanzado ApiError')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      const apiErr = err as ApiError
      expect(apiErr.status).toBe(500)
      expect(apiErr.message).toBe(
        'Ocurrió un error inesperado. Inténtalo más tarde.',
      )
    }
  })

  // TEST-FE-LIB-004: http: 401 → dispara cierre de sesión
  it('TEST-FE-LIB-004: http ante 401 dispara callback de cierre de sesión', async () => {
    server.use(
      http.get('/api/test-401', () => {
        return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
      }),
    )

    const onUnauthorized = vi.fn()
    registrarOnUnauthorized(onUnauthorized)

    try {
      await clienteHttp('/test-401')
    } catch {
      // noop
    }

    expect(onUnauthorized).toHaveBeenCalled()
  })

  // TEST-FE-LIB-005: formato: PrecioCOP formatea 250000 como COP
  it('TEST-FE-LIB-005: PrecioCOP formatea 250000 como moneda COP', () => {
    const formateado = formatearPrecioCOP(250000)
    expect(formateado).toContain('250.000')
    expect(formateado).toContain('$')
  })
})
