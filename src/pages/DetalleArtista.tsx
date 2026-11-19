import { useParams, Link } from 'react-router'
import { RUTAS } from '../lib/rutas'
import { useArtista } from '../funcionalidades/artistas/hooks'
import { useEventosPorArtista } from '../funcionalidades/eventos/hooks'
import { obtenerIniciales } from '../funcionalidades/artistas/utils'
import { TarjetaEvento } from '../funcionalidades/eventos/componentes/TarjetaEvento'
import { Cargando } from '../componentes/Cargando'
import { EstadoVacio } from '../componentes/EstadoVacio'
import { EstadoError } from '../componentes/EstadoError'
import { Badge } from '../componentes/Badge'
import NoEncontrada from './NoEncontrada'

export default function DetalleArtista() {
  const { id } = useParams<{ id: string }>()
  const idNum = Number(id)
  const esIdInvalido = !id || isNaN(idNum)

  const {
    data: artista,
    isLoading: cargandoArtista,
    isError: errorArtista,
    error: errArtista,
    refetch: reintentarArtista,
  } = useArtista(esIdInvalido ? undefined : idNum)

  const stageName = artista?.stageName

  const {
    data: eventosArtista,
    isLoading: cargandoEventos,
  } = useEventosPorArtista(stageName)

  // id no numérico -> 404 de UI sin llamar a la API (TEST-FE-ART-003)
  if (esIdInvalido) {
    return <NoEncontrada />
  }

  if (cargandoArtista) {
    return <Cargando filas={2} tipo="lineas" mensaje="Cargando perfil del artista..." />
  }

  if (errorArtista || !artista) {
    return (
      <EstadoError
        mensaje={(errArtista as Error)?.message || 'Artista no encontrado.'}
        onReintentar={() => reintentarArtista()}
      />
    )
  }

  const iniciales = obtenerIniciales(artista.stageName)

  return (
    <div className="space-y-8">
      <nav aria-label="Navegación de retorno">
        <Link
          to={RUTAS.artistas}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-marca-600 dark:text-slate-400 dark:hover:text-marca-400 transition-colors"
        >
          <span>←</span> Artistas
        </Link>
      </nav>

      {/* Perfil del artista */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-marca-100 text-marca-700 dark:bg-marca-950 dark:text-marca-300 text-3xl font-bold shadow-xs">
          {iniciales}
        </div>
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <h1 className="text-3xl font-extrabold font-titulo text-slate-900 dark:text-slate-100">
              {artista.stageName}
            </h1>
            <Badge tono={artista.active ? 'Activa' : 'Inactiva'} texto={artista.active ? 'Activo' : 'Inactivo'} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Nombre artístico · {artista.genre || 'Género variado'} {artista.country ? `· ${artista.country}` : ''}
          </p>
        </div>
      </div>

      {/* Próximos eventos del artista */}
      <section aria-labelledby="titulo-eventos-artista" className="space-y-4">
        <h2
          id="titulo-eventos-artista"
          className="text-xl font-bold font-titulo text-slate-900 dark:text-slate-100"
        >
          Próximos eventos de {artista.stageName}
        </h2>

        {cargandoEventos && <Cargando filas={3} tipo="tarjetas" />}

        {!cargandoEventos && (!eventosArtista || eventosArtista.length === 0) && (
          <EstadoVacio mensaje="Sin eventos próximos" />
        )}

        {!cargandoEventos && eventosArtista && eventosArtista.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventosArtista.map((evento) => (
              <TarjetaEvento key={evento.eventCode} evento={evento} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
