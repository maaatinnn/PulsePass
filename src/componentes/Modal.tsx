import { useEffect, useRef, type ReactNode } from 'react'
import { IconoCerrar } from './Iconos'

export interface ModalProps {
  abierto: boolean
  titulo: string
  onCerrar: () => void
  children: ReactNode
}

export function Modal({ abierto, titulo, onCerrar, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function manejarTecla(e: KeyboardEvent) {
      if (e.key === 'Escape' && abierto) {
        onCerrar()
      }
    }

    if (abierto) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', manejarTecla)
    }

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', manejarTecla)
    }
  }, [abierto, onCerrar])

  if (!abierto) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCerrar()
        }
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <h2 id="modal-titulo" className="text-xl font-bold font-titulo text-slate-900 dark:text-slate-100">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 focus-visible:outline-2 focus-visible:outline-marca-600 cursor-pointer"
            aria-label="Cerrar modal"
          >
            <IconoCerrar className="h-5 w-5" />
          </button>
        </div>
        <div className="pt-4">{children}</div>
      </div>
    </div>
  )
}
