import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { RUTAS } from '../lib/rutas'
import {
  useEventosPublicados,
  useEventosPorArtista,
} from '../funcionalidades/eventos/hooks'
import { useArtistaPorNombre, useArtistasActivos } from '../funcionalidades/artistas/hooks'
import { TarjetaEvento } from '../funcionalidades/eventos/componentes/TarjetaEvento'
import { Cargando } from '../componentes/Cargando'
import { EstadoVacio } from '../componentes/EstadoVacio'
import { EstadoError } from '../componentes/EstadoError'
import { Boton } from '../componentes/Boton'
import { Campo } from '../componentes/Campo'
import { Selector } from '../componentes/Selector'
import { IconoBuscar } from '../componentes/Iconos'
import type { EventCategory } from '../funcionalidades/eventos/tipos'

const CATEGORIAS: EventCategory[] = [
  'MUSIC',
  'SPORTS',
  'TECHNOLOGY',
  'EDUCATION',
  'CULTURE',
  'ENTERTAINMENT',
]

export default function CatalogoEventos() {
  const [searchParams, setSearchParams] = useSearchParams()

  const q = searchParams.get('q') ?? ''
  const categoria = searchParams.get('categoria') ?? ''
  const artista = searchParams.get('artista') ?? ''

  const {
    data: eventosPublicados,
    isLoading: cargandoPublicados,
    isError: errorPublicados,
    error: errPublicados,
    refetch: reintentarPublicados,
  } = useEventosPublicados()

  const {
    data: eventosPorArtistaData,
    isLoading: cargandoPorArtista,
    isError: errorPorArtista,
    refetch: reintentarPorArtista,
  } = useEventosPorArtista(artista || undefined)

  const { data: listaArtistas } = useArtistasActivos()
  const { data: artistaFiltrado } = useArtistaPorNombre(artista || undefined)

  const cargando = artista ? cargandoPorArtista : cargandoPublicados
  const error = artista ? errorPorArtista : errorPublicados
  const reintentar = artista ? reintentarPorArtista : reintentarPublicados

  const listaBase = useMemo(() => {
    if (artista) {
      return eventosPorArtistaData ?? []
    }
    return eventosPublicados ?? []
  }, [artista, eventosPorArtistaData, eventosPublicados])

  const eventosFiltrados = useMemo(() => {
    return listaBase.filter((evento) => {
      const coincideTexto =
        !q ||
        evento.name.toLowerCase().includes(q.toLowerCase()) ||
        evento.eventCode.toLowerCase().includes(q.toLowerCase())

      const coincideCategoria = !categoria || evento.category === categoria

      return coincideTexto && coincideCategoria
    })
  }, [listaBase, q, categoria])

  const actualizarFiltro = (clave: string, valor: string) => {
    const nuevosParams = new URLSearchParams(searchParams)
    if (valor.trim()) {
      nuevosParams.set(clave, valor)
    } else {
      nuevosParams.delete(clave)
    }
    setSearchParams(nuevosParams)
  }

  const limpiarFiltros = () => {
    setSearchParams({})
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-titulo text-slate-900 dark:text-slate-100">
          Cartelera
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Explora los próximos eventos disponibles en PulsePass
        </p>
      </div>

      {/* Barra de Filtros */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="w-full">
            <Campo
              etiqueta="Buscar por nombre"
              type="search"
              placeholder="Buscar por nombre..."
              value={q}
              onChange={(e) => actualizarFiltro('q', e.target.value)}
            />
          </div>

          <div className="w-full">
            <Selector
              etiqueta="Categoría"
              value={categoria}
              onChange={(e) => actualizarFiltro('categoria', e.target.value)}
            >
              <option value="">Todas</option>
              {CATEGORIAS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Selector>
          </div>

          <div className="w-full">
            <Selector
              etiqueta="Artista"
              value={artista}
              onChange={(e) => actualizarFiltro('artista', e.target.value)}
            >
              <option value="">Todos</option>
              {listaArtistas?.map((art) => (
                <option key={art.id} value={art.stageName}>
                  {art.stageName}
                </option>
              ))}
            </Selector>
          </div>

          <div>
            <Boton
              type="button"
              variante="secundario"
              onClick={limpiarFiltros}
              className="w-full"
            >
              Limpiar
            </Boton>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span>
            {eventosFiltrados.length} {eventosFiltrados.length === 1 ? 'evento' : 'eventos'}
          </span>
          {artistaFiltrado && (
            <Link
              to={RUTAS.detalleArtista(artistaFiltrado.id)}
              className="text-marca-600 hover:underline dark:text-marca-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600"
            >
              Ver perfil de {artistaFiltrado.stageName} →
            </Link>
          )}
        </div>
      </div>

      {/* Listado de Eventos */}
      {cargando && <Cargando filas={6} tipo="tarjetas" />}

      {error && (
        <EstadoError
          mensaje={
            (errPublicados as Error)?.message ||
            'Ocurrió un error al cargar la cartelera de eventos.'
          }
          onReintentar={() => reintentar()}
        />
      )}

      {!cargando && !error && eventosFiltrados.length === 0 && (
        <EstadoVacio
          icono={<IconoBuscar className="h-8 w-8 text-slate-400" />}
          titulo="Sin resultados"
          mensaje="Sin resultados para tu búsqueda"
          accion={
            <Boton variante="secundario" onClick={limpiarFiltros}>
              Restablecer filtros
            </Boton>
          }
        />
      )}

      {!cargando && !error && eventosFiltrados.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventosFiltrados.map((evento) => (
            <TarjetaEvento key={evento.eventCode} evento={evento} />
          ))}
        </div>
      )}
    </div>
  )
}
