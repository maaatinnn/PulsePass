export function formatearPrecioCOP(valor: number): string {
  // es-CO COP sin decimales
  const formateador = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  })
  return formateador.format(valor).replace(/\u00a0/g, ' ')
}

export function formatearFecha(
  fechaIso: string | Date,
  incluirHora = false,
): string {
  if (!fechaIso) return ''
  const fecha = typeof fechaIso === 'string' ? new Date(fechaIso) : fechaIso
  if (isNaN(fecha.getTime())) return ''

  const dia = fecha.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  if (!incluirHora) {
    return dia
  }

  const hora = fecha.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  return `${dia} · ${hora}`
}

export function formatearFechaHoraTexto(fechaIso: string | Date): string {
  if (!fechaIso) return ''
  const fecha = typeof fechaIso === 'string' ? new Date(fechaIso) : fechaIso
  if (isNaN(fecha.getTime())) return ''

  const dia = fecha.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const hora = fecha.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  return `${dia} ${hora}`
}
