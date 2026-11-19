import { Link } from 'react-router'
import { RUTAS } from '../lib/rutas'
import { Boton } from '../componentes/Boton'

export default function NoEncontrada() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 md:p-12 shadow-sm max-w-md w-full">
        <span className="text-6xl font-extrabold font-titulo text-marca-600 dark:text-marca-400">
          404
        </span>
        <h1 className="mt-4 text-2xl font-bold font-titulo text-slate-900 dark:text-slate-100">
          Página no encontrada
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          No encontramos esta página.
        </p>
        <div className="mt-8">
          <Link to={RUTAS.inicio}>
            <Boton variante="primario" className="w-full">
              Volver al inicio
            </Boton>
          </Link>
        </div>
      </div>
    </div>
  )
}
