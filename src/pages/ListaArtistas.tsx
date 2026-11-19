import { Link } from 'react-router'
import { RUTAS } from '../lib/rutas'
import { useArtistasActivos } from '../funcionalidades/artistas/hooks'
import { obtenerIniciales } from '../funcionalidades/artistas/utils'
import { Cargando } from '../componentes/Cargando'
import { EstadoVacio } from '../componentes/EstadoVacio'
import { EstadoError } from '../componentes/EstadoError'

export default function ListaArtistas() {
  const { data: artistas, isLoading, isError, error, refetch } = useArtistasActivos()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-titulo text-slate-900 dark:text-slate-100">
          Artistas
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Conoce a los artistas participantes en la plataforma
        </p>
      </div>

      {isLoading && <Cargando filas={6} tipo="tarjetas" />}

      {isError && (
        <EstadoError
          mensaje={(error as Error)?.message || 'No se pudieron cargar los artistas.'}
          onReintentar={() => refetch()}
        />
      )}

      {!isLoading && !isError && artistas && artistas.length === 0 && (
        <EstadoVacio mensaje="No hay artistas activos disponibles actualmente." />
      )}

      {!isLoading && !isError && artistas && artistas.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {artistas.map((artista) => {
            const iniciales = obtenerIniciales(artista.stageName)
            return (
              <Link
                key={artista.id}
                to={RUTAS.detalleArtista(artista.id)}
                className="group flex flex-col items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-xs hover:shadow-md hover:border-marca-300 dark:hover:border-marca-700 transition-all focus-visible:outline-2 focus-visible:outline-marca-600"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-marca-100 text-marca-700 dark:bg-marca-950 dark:text-marca-300 text-2xl font-bold group-hover:scale-105 transition-transform">
                  {iniciales}
                </div>
                <h3 className="mt-4 text-lg font-bold font-titulo text-slate-900 dark:text-slate-100 group-hover:text-marca-600 dark:group-hover:text-marca-400 transition-colors">
                  {artista.stageName}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {artista.genre || 'Género variado'}
                </p>
                {artista.country && (
                  <span className="mt-3 text-xs text-slate-400">
                    {artista.country}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
