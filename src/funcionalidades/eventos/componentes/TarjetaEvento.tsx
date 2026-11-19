import { Link } from 'react-router'
import { clsx } from 'clsx'
import { RUTAS } from '../../../lib/rutas'
import { formatearFecha } from '../../../lib/formato'
import { Badge } from '../../../componentes/Badge'
import {
  IconoNota,
  IconoTemplo,
  IconoEstrella,
  IconoMonitor,
  IconoTrofeo,
  IconoBirrete,
  IconoCalendario,
  IconoUbicacion,
} from '../../../componentes/Iconos'
import type { EventCategory, EventSummaryResponse } from '../tipos'

const CATEGORIA_INFO: Record<
  EventCategory,
  { fondo: string; texto: string; icono: typeof IconoNota; label: string }
> = {
  MUSIC: {
    fondo: 'bg-indigo-100 dark:bg-indigo-950/60',
    texto: 'text-indigo-600 dark:text-indigo-400',
    icono: IconoNota,
    label: 'MUSIC',
  },
  CULTURE: {
    fondo: 'bg-rose-100 dark:bg-rose-950/60',
    texto: 'text-rose-700 dark:text-rose-400',
    icono: IconoTemplo,
    label: 'CULTURE',
  },
  ENTERTAINMENT: {
    fondo: 'bg-purple-100 dark:bg-purple-950/60',
    texto: 'text-purple-600 dark:text-purple-400',
    icono: IconoEstrella,
    label: 'ENTERTAINMENT',
  },
  TECHNOLOGY: {
    fondo: 'bg-sky-100 dark:bg-sky-950/60',
    texto: 'text-sky-600 dark:text-sky-400',
    icono: IconoMonitor,
    label: 'TECHNOLOGY',
  },
  SPORTS: {
    fondo: 'bg-emerald-100 dark:bg-emerald-950/60',
    texto: 'text-emerald-600 dark:text-emerald-400',
    icono: IconoTrofeo,
    label: 'SPORTS',
  },
  EDUCATION: {
    fondo: 'bg-amber-100 dark:bg-amber-950/60',
    texto: 'text-amber-700 dark:text-amber-400',
    icono: IconoBirrete,
    label: 'EDUCATION',
  },
}

export function TarjetaEvento({ evento }: { evento: EventSummaryResponse }) {
  const cat = CATEGORIA_INFO[evento.category] || CATEGORIA_INFO.MUSIC
  const Icono = cat.icono

  return (
    <Link
      to={RUTAS.detalleEvento(evento.eventCode)}
      className="group block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden focus-visible:outline-2 focus-visible:outline-marca-600"
    >
      {/* Panel visual con icono de categoría */}
      <div
        className={clsx(
          'h-40 w-full flex items-center justify-center transition-transform group-hover:scale-105 duration-300',
          cat.fondo,
        )}
      >
        <Icono className={clsx('h-14 w-14', cat.texto)} />
      </div>

      <div className="p-5 flex flex-col gap-2.5">
        <span className={clsx('text-xs font-bold uppercase tracking-wider', cat.texto)}>
          {cat.label}
        </span>

        <h3 className="font-bold font-titulo text-lg text-slate-900 dark:text-slate-100 group-hover:text-marca-600 dark:group-hover:text-marca-400 transition-colors line-clamp-1">
          {evento.name}
        </h3>

        <div className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <IconoCalendario className="h-4 w-4 shrink-0 text-slate-400" />
            <span>{formatearFecha(evento.eventDate)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <IconoUbicacion className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate">{evento.venueName || evento.venueCode || 'Por definir'}</span>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <Badge tono={evento.status} />
          <span className="text-xs font-mono text-slate-400">{evento.eventCode}</span>
        </div>
      </div>
    </Link>
  )
}
