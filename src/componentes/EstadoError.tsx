import { clsx } from 'clsx'
import { IconoAlerta } from './Iconos'
import { Boton } from './Boton'

export interface EstadoErrorProps {
  titulo?: string
  mensaje: string
  onReintentar?: () => void
  className?: string
}

export function EstadoError({
  titulo = 'Error al cargar los datos',
  mensaje,
  onReintentar,
  className,
}: EstadoErrorProps) {
  return (
    <div
      role="alert"
      className={clsx(
        'rounded-2xl border border-red-200 bg-red-50/80 p-8 text-center dark:border-red-900/40 dark:bg-red-950/20',
        className,
      )}
    >
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400">
        <IconoAlerta className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-red-900 dark:text-red-200 mb-1">
        {titulo}
      </h3>
      <p className="mx-auto max-w-md text-sm text-red-700 dark:text-red-300">
        {mensaje}
      </p>
      {onReintentar && (
        <div className="mt-5">
          <Boton
            type="button"
            variante="primario"
            onClick={onReintentar}
            className="!bg-red-600 hover:!bg-red-700"
          >
            Reintentar
          </Boton>
        </div>
      )}
    </div>
  )
}
