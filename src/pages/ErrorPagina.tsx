import { useRouteError, isRouteErrorResponse, Link } from 'react-router'
import { RUTAS } from '../lib/rutas'
import { Boton } from '../componentes/Boton'

export default function ErrorPagina({ error: errorProp }: { error?: unknown } = {}) {
  let routeError: unknown = null
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    routeError = useRouteError()
  } catch {
    // Fuera de data router
  }

  const error = errorProp || routeError

  let mensaje = 'Ocurrió un error inesperado. Inténtalo más tarde.'
  let titulo = '¡Ups! Algo salió mal.'
  let codigo = 500

  if (isRouteErrorResponse(error)) {
    codigo = error.status
    if (error.status === 404) {
      titulo = 'Página no encontrada'
      mensaje = 'No encontramos la página que buscas.'
    } else if (error.status === 403) {
      titulo = 'Acceso denegado'
      mensaje = 'No tienes permisos para ver este recurso.'
    } else {
      mensaje = error.statusText || mensaje
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-lg">
        <span className="text-5xl font-extrabold font-titulo text-red-500">
          {codigo}
        </span>
        <h1 className="mt-4 text-2xl font-bold font-titulo text-slate-900 dark:text-slate-100">
          {titulo}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {mensaje}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Boton
            variante="primario"
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto"
          >
            Reintentar
          </Boton>
          <Link to={RUTAS.inicio} className="w-full sm:w-auto">
            <Boton variante="secundario" className="w-full sm:w-auto">
              Volver al inicio
            </Boton>
          </Link>
        </div>
      </div>
    </div>
  )
}
