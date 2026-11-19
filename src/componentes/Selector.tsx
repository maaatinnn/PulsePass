import { useId, type ComponentProps } from 'react'
import { clsx } from 'clsx'

export interface SelectorProps extends ComponentProps<'select'> {
  etiqueta: string
  error?: string
}

export function Selector({
  etiqueta,
  error,
  id: idProp,
  className,
  children,
  ...props
}: SelectorProps) {
  const generadoId = useId()
  const selectId = idProp || generadoId
  const errorId = `${selectId}-error`

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label
        htmlFor={selectId}
        className="text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {etiqueta}
      </label>
      <select
        id={selectId}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={clsx(
          'w-full min-h-[44px] rounded-lg border px-3.5 py-2 text-base transition-colors bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100',
          'focus-visible:outline-2 focus-visible:outline-offset-2',
          error
            ? 'border-red-500 focus-visible:outline-red-500'
            : 'border-slate-300 dark:border-slate-700 focus-visible:outline-marca-600',
          className,
        )}
        {...props}
      >
        {children}
      </select>
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
