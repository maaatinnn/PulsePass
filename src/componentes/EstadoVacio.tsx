import type { ReactNode } from 'react'
import { clsx } from 'clsx'

export interface EstadoVacioProps {
  titulo?: string
  mensaje: string
  icono?: ReactNode
  accion?: ReactNode
  className?: string
}

export function EstadoVacio({
  titulo,
  mensaje,
  icono,
  accion,
  className,
}: EstadoVacioProps) {
  return (
    <div
      role="status"
      className={clsx(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-10 text-center',
        className,
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 text-3xl">
        {icono || '📭'}
      </div>
      {titulo && (
        <h3 className="mb-1 text-lg font-bold font-titulo text-slate-800 dark:text-slate-200">
          {titulo}
        </h3>
      )}
      <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
        {mensaje}
      </p>
      {accion && <div className="mt-6">{accion}</div>}
    </div>
  )
}
