import { clsx } from 'clsx'

export type BadgeTono =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'SOLD_OUT'
  | 'CANCELLED'
  | 'FINISHED'
  | 'RESERVED'
  | 'PAID'
  | 'USED'
  | 'Activa'
  | 'Inactiva'
  | 'USER'
  | 'STAFF'
  | 'ADMIN'

const TONO_CLASES: Record<BadgeTono, string> = {
  DRAFT: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  PUBLISHED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  SOLD_OUT: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  FINISHED: 'bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
  RESERVED: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  PAID: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  USED: 'bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
  Activa: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  Inactiva: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  USER: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
  STAFF: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
}

export interface BadgeProps {
  tono: BadgeTono
  texto?: string
  className?: string
}

export function Badge({ tono, texto, className }: BadgeProps) {
  const contenido = texto ?? tono
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider',
        TONO_CLASES[tono] || 'bg-slate-100 text-slate-800',
        className,
      )}
    >
      {contenido}
    </span>
  )
}
