import { Link } from 'react-router'
import { RUTAS } from '../lib/rutas'
import { useAuth } from '../funcionalidades/auth/AuthContext'
import { useEventosPublicados } from '../funcionalidades/eventos/hooks'
import { useArtistasActivos } from '../funcionalidades/artistas/hooks'
import { TarjetaEvento } from '../funcionalidades/eventos/componentes/TarjetaEvento'
import { AvatarArtista } from '../funcionalidades/artistas/componentes/AvatarArtista'
import { Cargando } from '../componentes/Cargando'
import { EstadoVacio } from '../componentes/EstadoVacio'
import { EstadoError } from '../componentes/EstadoError'
import { Boton } from '../componentes/Boton'

export default function Inicio() {
  const { sesion } = useAuth()
  const {
    data: eventos,
    isLoading: cargandoEventos,
    isError: errorEventos,
    error: errEventos,
    refetch: reintentarEventos,
  } = useEventosPublicados()

  const {
    data: artistas,
    isLoading: cargandoArtistas,
  } = useArtistasActivos()

  const eventosProximos = eventos?.slice(0, 3) ?? []
  const artistasDestacados = artistas?.slice(0, 6) ?? []

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section
        aria-label="Presentación"
        className="rounded-3xl bg-linear-to-r from-marca-600 to-acento-500 p-8 sm:p-12 text-white shadow-lg overflow-hidden relative"
      >
        <div className="max-w-2xl space-y-4 relative z-10">
          <h1 className="text-3xl sm:text-5xl font-extrabold font-titulo tracking-tight">
            Descubre los mejores eventos
          </h1>
          <p className="text-base sm:text-lg text-white/90 leading-relaxed font-normal">
            Música, cultura, deporte y tecnología en un solo lugar.
          </p>
          <div className="pt-4 flex flex-wrap items-center gap-3">
            <Link to={RUTAS.eventos}>
              <Boton
                variante="secundario"
                className="!bg-white !text-marca-700 hover:!bg-slate-100 font-semibold px-6 border-transparent"
              >
                Ver cartelera
              </Boton>
            </Link>
            {sesion.estado === 'anonimo' && (
              <Link to={RUTAS.registro}>
                <Boton
                  variante="secundario"
                  className="!bg-transparent !text-white !border-white/80 hover:!bg-white/10 font-semibold px-6"
                >
                  Crear cuenta
                </Boton>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Próximos Eventos */}
      <section aria-labelledby="titulo-proximos">
        <div className="flex items-center justify-between mb-6">
          <h2
            id="titulo-proximos"
            className="text-2xl font-bold font-titulo text-slate-900 dark:text-slate-100"
          >
            Próximos eventos
          </h2>
          <Link
            to={RUTAS.eventos}
            className="text-sm font-semibold text-marca-600 hover:text-marca-700 dark:text-marca-400 flex items-center gap-1"
          >
            Ver todos <span>→</span>
          </Link>
        </div>

        {cargandoEventos && <Cargando filas={3} tipo="tarjetas" />}

        {errorEventos && (
          <EstadoError
            mensaje={errEventos?.message || 'No se pudieron cargar los eventos.'}
            onReintentar={() => reintentarEventos()}
          />
        )}

        {!cargandoEventos && !errorEventos && eventosProximos.length === 0 && (
          <EstadoVacio
            mensaje="Aún no hay eventos publicados"
            accion={
              <Link to={RUTAS.artistas}>
                <Boton variante="secundario">Ver artistas</Boton>
              </Link>
            }
          />
        )}

        {!cargandoEventos && !errorEventos && eventosProximos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventosProximos.map((evento) => (
              <TarjetaEvento key={evento.eventCode} evento={evento} />
            ))}
          </div>
        )}
      </section>

      {/* Artistas Destacados */}
      <section aria-labelledby="titulo-artistas-destacados">
        <div className="flex items-center justify-between mb-6">
          <h2
            id="titulo-artistas-destacados"
            className="text-2xl font-bold font-titulo text-slate-900 dark:text-slate-100"
          >
            Artistas destacados
          </h2>
          <Link
            to={RUTAS.artistas}
            className="text-sm font-semibold text-marca-600 hover:text-marca-700 dark:text-marca-400 flex items-center gap-1"
          >
            Ver todos <span>→</span>
          </Link>
        </div>

        {cargandoArtistas && <Cargando filas={3} tipo="lineas" />}

        {!cargandoArtistas && artistasDestacados.length > 0 && (
          <div className="flex flex-wrap gap-4 sm:gap-6 items-center">
            {artistasDestacados.map((artista) => (
              <AvatarArtista key={artista.id} artista={artista} tamano="md" />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
