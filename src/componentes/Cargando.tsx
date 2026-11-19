import { clsx } from 'clsx'

export interface CargandoProps {
  filas?: number
  tipo?: 'tarjetas' | 'tabla' | 'lineas'
  mensaje?: string
}

export function Cargando({
  filas = 3,
  tipo = 'tarjetas',
  mensaje = 'Cargando información...',
}: CargandoProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={mensaje}
      className="w-full space-y-4 py-6"
    >
      <span className="sr-only">{mensaje}</span>

      {tipo === 'tarjetas' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: filas }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs animate-pulse space-y-4"
            >
              <div className="h-40 w-full rounded-lg bg-slate-200 dark:bg-slate-800" />
              <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      )}

      {tipo === 'tabla' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 animate-pulse space-y-4">
          <div className="h-6 w-1/4 rounded bg-slate-200 dark:bg-slate-800" />
          {Array.from({ length: filas }).map((_, i) => (
            <div key={i} className="h-10 w-full rounded bg-slate-100 dark:bg-slate-800/60" />
          ))}
        </div>
      )}

      {tipo === 'lineas' && (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: filas }).map((_, i) => (
            <div
              key={i}
              className={clsx(
                'h-4 rounded bg-slate-200 dark:bg-slate-800',
                i % 2 === 0 ? 'w-full' : 'w-4/5',
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
