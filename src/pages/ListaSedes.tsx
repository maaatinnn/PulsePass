import { Link } from 'react-router'
import { RUTAS } from '../lib/rutas'
import { useSedesActivas } from '../funcionalidades/sedes/hooks'
import { Badge } from '../componentes/Badge'
import { Cargando } from '../componentes/Cargando'
import { EstadoVacio } from '../componentes/EstadoVacio'
import { EstadoError } from '../componentes/EstadoError'
import { IconoUbicacion } from '../componentes/Iconos'

export default function ListaSedes() {
  const { data: sedes, isLoading, isError, error, refetch } = useSedesActivas()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-titulo text-slate-900 dark:text-slate-100">
          Sedes
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Descubre los escenarios y recintos disponibles para eventos
        </p>
      </div>

      {isLoading && <Cargando filas={4} tipo="tarjetas" />}

      {isError && (
        <EstadoError
          mensaje={(error as Error)?.message || 'No se pudieron cargar las sedes.'}
          onReintentar={() => refetch()}
        />
      )}

      {!isLoading && !isError && sedes && sedes.length === 0 && (
        <EstadoVacio mensaje="No hay sedes activas registradas." />
      )}

      {!isLoading && !isError && sedes && sedes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sedes.map((sede) => (
            <Link
              key={sede.code}
              to={RUTAS.detalleSede(sede.code)}
              className="group block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs hover:shadow-md hover:border-marca-300 dark:hover:border-marca-700 transition-all focus-visible:outline-2 focus-visible:outline-marca-600"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-bold font-titulo text-lg text-slate-900 dark:text-slate-100 group-hover:text-marca-600 dark:group-hover:text-marca-400 transition-colors">
                  {sede.name}
                </h3>
                <Badge tono={sede.active ? 'Activa' : 'Inactiva'} />
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                <IconoUbicacion className="h-4 w-4 shrink-0 text-slate-400" />
                <span>
                  {sede.city} · Cap. {sede.capacity}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-400">
                <span className="font-mono">{sede.code}</span>
                {sede.address && <span className="truncate max-w-[160px]">{sede.address}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
