export const STORAGE_CREADOS = 'pulsepass_admin_eventos_creados'

export function guardarEventoCreadoEnSesion(evento: {
  eventCode: string
  name: string
  status: 'DRAFT' | 'PUBLISHED'
}) {
  try {
    const prev = JSON.parse(sessionStorage.getItem(STORAGE_CREADOS) || '[]')
    const filtrado = prev.filter(
      (e: { eventCode: string }) => e.eventCode !== evento.eventCode,
    )
    sessionStorage.setItem(
      STORAGE_CREADOS,
      JSON.stringify([evento, ...filtrado]),
    )
  } catch {
    // noop
  }
}
