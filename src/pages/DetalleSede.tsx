import { useParams, Link } from 'react-router'
import { RUTAS } from '../lib/rutas'
import { useSede } from '../funcionalidades/sedes/hooks'
import { Badge } from '../componentes/Badge'
import { Cargando } from '../componentes/Cargando'
import { EstadoError } from '../componentes/EstadoError'
import NoEncontrada from './NoEncontrada'
import { ApiError } from '../lib/http'

export default function DetalleSede() {
  const { code } = useParams<{ code: string }>()

  const { data: sede, isLoading, isError, error, refetch } = useSede(code)

  if (isLoading) {
    return <Cargando filas={3} tipo="lineas" mensaje="Cargando información de la sede..." />
  }

  if (isError || !sede) {
    if (error instanceof ApiError && error.status === 404) {
      return <NoEncontrada />
    }
    return (
      <EstadoError
        mensaje={(error as Error)?.message || 'No se pudo cargar la sede.'}
        onReintentar={() => refetch()}
      />
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <nav aria-label="Navegación de retorno">
        <Link
          to={RUTAS.sedes}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-marca-600 dark:text-slate-400 dark:hover:text-marca-400 transition-colors"
        >
          <span>←</span> Sedes
        </Link>
      </nav>

      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-3xl font-extrabold font-titulo text-slate-900 dark:text-slate-100">
              {sede.name}
            </h1>
            <p className="mt-1 font-mono text-xs text-slate-400">{sede.code}</p>
          </div>
          <Badge tono={sede.active ? 'Activa' : 'Inactiva'} />
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-100 dark:border-slate-800">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Código
            </dt>
            <dd className="font-mono text-slate-900 dark:text-slate-100 font-medium">
              {sede.code}
            </dd>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-100 dark:border-slate-800">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Ciudad
            </dt>
            <dd className="text-slate-900 dark:text-slate-100 font-medium">
              {sede.city}
            </dd>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-100 dark:border-slate-800">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Capacidad
            </dt>
            <dd className="text-slate-900 dark:text-slate-100 font-medium">
              {sede.capacity} personas
            </dd>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-100 dark:border-slate-800">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Estado
            </dt>
            <dd className="text-slate-900 dark:text-slate-100 font-medium">
              {sede.active ? 'Activa' : 'Inactiva'}
            </dd>
          </div>

          {sede.address && (
            <div className="sm:col-span-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-100 dark:border-slate-800">
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Dirección
              </dt>
              <dd className="text-slate-900 dark:text-slate-100 font-medium">
                {sede.address}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  )
}
