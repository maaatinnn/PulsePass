export function obtenerIniciales(nombre: string): string {
  if (!nombre) return 'A'
  const partes = nombre.trim().split(/\s+/)
  if (partes.length >= 2 && partes[0] && partes[1]) {
    return (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase()
  }
  return nombre.slice(0, 2).toUpperCase()
}
