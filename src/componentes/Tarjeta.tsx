import type { ComponentProps } from 'react'
import { clsx } from 'clsx'

export type TarjetaProps = ComponentProps<'div'>

export function Tarjeta({ className, children, ...props }: TarjetaProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
