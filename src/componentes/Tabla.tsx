import type { ReactNode } from 'react'
import { clsx } from 'clsx'

export interface Columna<T> {
  encabezado: string
  celda: (fila: T) => ReactNode
  className?: string
}

export interface TablaProps<T> {
  columnas: Columna<T>[]
  filas: T[]
  keyExtractor?: (fila: T, index: number) => string | number
  className?: string
}

export function Tabla<T>({
  columnas,
  filas,
  keyExtractor,
  className,
}: TablaProps<T>) {
  return (
    <div className={clsx('w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900', className)}>
      <table className="w-full text-left border-collapse text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <tr>
            {columnas.map((col, index) => (
              <th
                key={index}
                scope="col"
                className={clsx('px-6 py-3.5 font-semibold', col.className)}
              >
                {col.encabezado}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {filas.map((fila, filaIdx) => {
            const key = keyExtractor ? keyExtractor(fila, filaIdx) : filaIdx
            return (
              <tr
                key={key}
                className="hover:bg-slate-50/75 dark:hover:bg-slate-800/40 transition-colors"
              >
                {columnas.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    className={clsx('px-6 py-4 text-slate-700 dark:text-slate-300', col.className)}
                  >
                    {col.celda(fila)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
