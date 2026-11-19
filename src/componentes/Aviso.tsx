import type { ReactNode } from 'react'
import { clsx } from 'clsx'
import { IconoAlerta, IconoCheck, IconoCerrar } from './Iconos'

export type AvisoTipo = 'exito' | 'error' | 'advertencia' | 'info'

export interface AvisoProps {
  tipo?: AvisoTipo
  titulo?: string
  mensaje?: string
  children?: ReactNode
  onCerrar?: () => void
  className?: string
}

const TIPO_ESTILOS: Record<
  AvisoTipo,
  { contenedor: string; texto: string; icono: string }
> = {
  exito: {
    contenedor: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800',
    texto: 'text-emerald-800 dark:text-emerald-200',
    icono: 'text-emerald-600 dark:text-emerald-400',
  },
  error: {
    contenedor: 'bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-800',
    texto: 'text-red-800 dark:text-red-200',
    icono: 'text-red-600 dark:text-red-400',
  },
  advertencia: {
    contenedor: 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800',
    texto: 'text-amber-800 dark:text-amber-200',
    icono: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    contenedor: 'bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:border-sky-800',
    texto: 'text-sky-800 dark:text-sky-200',
    icono: 'text-sky-600 dark:text-sky-400',
  },
}

export function Aviso({
  tipo = 'info',
  titulo,
  mensaje,
  children,
  onCerrar,
  className,
}: AvisoProps) {
  const estilos = TIPO_ESTILOS[tipo]
  const esAlerta = tipo === 'error' || tipo === 'advertencia'

  return (
    <div
      role={esAlerta ? 'alert' : 'status'}
      aria-live={tipo === 'error' ? 'assertive' : 'polite'}
      className={clsx(
        'flex items-start gap-3 rounded-xl border p-4 text-sm transition-all',
        estilos.contenedor,
        className,
      )}
    >
      <div className={clsx('mt-0.5 shrink-0', estilos.icono)}>
        {tipo === 'exito' && <IconoCheck className="h-5 w-5" />}
        {(tipo === 'error' || tipo === 'advertencia') && <IconoAlerta className="h-5 w-5" />}
        {tipo === 'info' && <span className="text-base font-bold">ℹ</span>}
      </div>
      <div className={clsx('flex-1 leading-relaxed', estilos.texto)}>
        {titulo && <h4 className="font-semibold mb-0.5">{titulo}</h4>}
        {mensaje && <p>{mensaje}</p>}
        {children}
      </div>
      {onCerrar && (
        <button
          type="button"
          onClick={onCerrar}
          className="ml-auto rounded-lg p-1 text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
          aria-label="Cerrar aviso"
        >
          <IconoCerrar className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
