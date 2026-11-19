import { z } from 'zod'

export const ErrorResponseSchema = z.object({
  timestamp: z.string().optional(),
  status: z.number(),
  error: z.string().optional(),
  message: z.string(),
  details: z.record(z.string(), z.string()).optional().default({}),
})

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>

export class ApiError extends Error {
  public status: number
  public details: Record<string, string>

  constructor(status: number, message: string, details: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

type OnUnauthorizedCallback = () => void

let tokenGetter: (() => string | null) | null = null
let onUnauthorizedHandler: OnUnauthorizedCallback | null = null

export function registrarTokenGetter(getter: () => string | null) {
  tokenGetter = getter
}

export function registrarOnUnauthorized(callback: OnUnauthorizedCallback) {
  onUnauthorizedHandler = callback
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

export async function clienteHttp<T>(
  endpoint: string,
  options: RequestOptions = {},
  schema?: z.ZodType<T, z.ZodTypeDef, unknown>,
): Promise<T> {
  const { params, headers: customHeaders, ...customOptions } = options

  let url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString
    }
  }

  const headers = new Headers(customHeaders)
  if (!headers.has('Content-Type') && !(customOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const token = tokenGetter ? tokenGetter() : sessionStorage.getItem('pulsepass_token')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(url, {
      ...customOptions,
      headers,
    })
  } catch {
    throw new ApiError(0, 'No pudimos conectar con el servidor.')
  }

  // Un 401 solo significa "sesión expirada" si se envió un token y no es el propio login
  // (en el login, un 401 es "Credenciales inválidas" y no debe cerrar sesión ni redirigir).
  const esLogin = endpoint.includes('/auth/login')
  if (response.status === 401 && token && !esLogin) {
    if (onUnauthorizedHandler) {
      onUnauthorizedHandler()
    }
  }

  if (!response.ok) {
    let rawJson: unknown = null
    try {
      rawJson = await response.json()
    } catch {
      // no es JSON válido
    }

    if (rawJson && typeof rawJson === 'object') {
      const parsed = ErrorResponseSchema.safeParse(rawJson)
      if (parsed.success) {
        throw new ApiError(
          parsed.data.status || response.status,
          parsed.data.message,
          parsed.data.details || {},
        )
      }
    }

    // Mensajes genéricos por status según PRD sección 13
    let mensaje = 'Ocurrió un error inesperado. Inténtalo más tarde.'
    if (response.status === 401) {
      mensaje = 'Credenciales inválidas.'
    } else if (response.status === 403) {
      mensaje = 'No tienes permisos para realizar esta acción.'
    } else if (response.status === 404) {
      mensaje = 'Recurso no encontrado.'
    } else if (response.status === 409) {
      mensaje = 'Conflicto con el estado actual del recurso.'
    }

    throw new ApiError(response.status, mensaje)
  }

  if (response.status === 204) {
    return {} as T
  }

  const data = await response.json()
  if (schema) {
    const validado = schema.safeParse(data)
    if (!validado.success) {
      console.error('Error de validación Zod en respuesta de API:', validado.error)
      return data as T
    }
    return validado.data
  }

  return data as T
}

export const http = {
  get: <T>(
    url: string,
    options?: RequestOptions,
    schema?: z.ZodType<T, z.ZodTypeDef, unknown>,
  ) => clienteHttp<T>(url, { ...options, method: 'GET' }, schema),
  post: <T>(
    url: string,
    body?: unknown,
    options?: RequestOptions,
    schema?: z.ZodType<T, z.ZodTypeDef, unknown>,
  ) =>
    clienteHttp<T>(
      url,
      {
        ...options,
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      },
      schema,
    ),
  delete: <T = void>(
    url: string,
    options?: RequestOptions,
    schema?: z.ZodType<T, z.ZodTypeDef, unknown>,
  ) => clienteHttp<T>(url, { ...options, method: 'DELETE' }, schema),
  patch: <T>(
    url: string,
    body?: unknown,
    options?: RequestOptions,
    schema?: z.ZodType<T, z.ZodTypeDef, unknown>,
  ) =>
    clienteHttp<T>(
      url,
      {
        ...options,
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
      },
      schema,
    ),
}
