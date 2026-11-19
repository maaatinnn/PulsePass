import { Link } from 'react-router'
import { clsx } from 'clsx'
import { RUTAS } from '../../../lib/rutas'
import { obtenerIniciales } from '../utils'
import type { ArtistResponse } from '../tipos'

export function AvatarArtista({
  artista,
  tamano = 'md',
  conEnlace = true,
}: {
  artista: ArtistResponse
  tamano?: 'sm' | 'md' | 'lg'
  conEnlace?: boolean
}) {
  const iniciales = obtenerIniciales(artista.stageName)

  const tamanoClases: Record<'sm' | 'md' | 'lg', string> = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-12 w-12 text-sm',
    lg: 'h-20 w-20 text-2xl',
  }

  const contenido = (
    <div className="flex items-center gap-3">
      <div
        className={clsx(
          'flex shrink-0 items-center justify-center rounded-full bg-marca-100 font-bold text-marca-700 dark:bg-marca-950 dark:text-marca-300 ring-2 ring-white dark:ring-slate-900 shadow-xs',
          tamanoClases[tamano],
        )}
      >
        {iniciales}
      </div>
      <div>
        <p className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-marca-600 dark:group-hover:text-marca-400 transition-colors">
          {artista.stageName}
        </p>
        {artista.genre && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{artista.genre}</p>
        )}
      </div>
    </div>
  )

  if (conEnlace) {
    return (
      <Link
        to={RUTAS.detalleArtista(artista.id)}
        className="group inline-flex items-center rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors focus-visible:outline-2 focus-visible:outline-marca-600"
      >
        {contenido}
      </Link>
    )
  }

  return contenido
}
