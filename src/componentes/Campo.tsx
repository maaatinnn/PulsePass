import { useId, type ComponentProps } from 'react'
import { clsx } from 'clsx'

export interface CampoProps extends ComponentProps<'input'> {
  etiqueta: string
  error?: string
  ayuda?: string
}

export function Campo({
  etiqueta,
  error,
  ayuda,
  id: idProp,
  className,
  ...props
}: CampoProps) {
  const generadoId = useId()
  const inputId = idProp || generadoId
  const errorId = `${inputId}-error`
  const ayudaId = `${inputId}-ayuda`

  const describedBy = clsx(
    error && errorId,
    ayuda && ayudaId,
  ) || undefined

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {etiqueta}
      </label>
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={clsx(
          'w-full min-h-[44px] rounded-lg border px-3.5 py-2 text-base transition-colors',
          'bg-white text-slate-900 placeholder:text-slate-400',
          'dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500',
          'focus-visible:outline-2 focus-visible:outline-offset-2',
          error
            ? 'border-red-500 focus-visible:outline-red-500'
            : 'border-slate-300 dark:border-slate-700 focus-visible:outline-marca-600',
          className,
        )}
        {...props}
      />
      {ayuda && !error && (
        <span
          id={ayudaId}
          className="text-xs text-slate-500 dark:text-slate-400"
        >
          {ayuda}
        </span>
      )}
      {error && (
        <span
          id={errorId}
          role="alert"
          className="text-xs font-medium text-red-600 dark:text-red-400"
        >
          {error}
        </span>
      )}
    </div>
  )
}
