import type { ComponentProps } from 'react'
import { clsx } from 'clsx'

export type BotonVariante = 'primario' | 'secundario' | 'peligro' | 'fantasma'

export interface BotonProps extends ComponentProps<'button'> {
  variante?: BotonVariante
  cargando?: boolean
}

const VARIANTE_CLASES: Record<BotonVariante, string> = {
  primario:
    'bg-marca-600 hover:bg-marca-700 text-white shadow-xs focus-visible:outline-marca-600',
  secundario:
    'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700',
  peligro:
    'bg-red-600 hover:bg-red-700 text-white shadow-xs focus-visible:outline-red-600',
  fantasma:
    'text-marca-600 hover:bg-marca-50 dark:text-marca-400 dark:hover:bg-slate-800',
}

export function Boton({
  variante = 'primario',
  cargando = false,
  disabled,
  className,
  children,
  ...props
}: BotonProps) {
  return (
    <button
      disabled={disabled || cargando}
      className={clsx(
        'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-medium transition-colors cursor-pointer',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTE_CLASES[variante],
        className,
      )}
      {...props}
    >
      {cargando ? (
        <>
          <span
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
          <span>Cargando...</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}
