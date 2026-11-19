import { useState } from 'react'
import { useParams, Link } from 'react-router'
import { RUTAS } from '../lib/rutas'
import { formatearFecha } from '../lib/formato'
import {
  useEvento,
  usePublicarEvento,
  useAsociarArtista,
} from '../funcionalidades/eventos/hooks'
import { useArtistasActivos } from '../funcionalidades/artistas/hooks'
import { Badge } from '../componentes/Badge'
import { Boton } from '../componentes/Boton'
import { Selector } from '../componentes/Selector'
import { Modal } from '../componentes/Modal'
import { Aviso } from '../componentes/Aviso'
import { Cargando } from '../componentes/Cargando'
import { EstadoError } from '../componentes/EstadoError'
import { AvatarArtista } from '../funcionalidades/artistas/componentes/AvatarArtista'
import { ApiError } from '../lib/http'
import { guardarEventoCreadoEnSesion } from '../funcionalidades/admin/utils'

export default function AdminGestionEvento() {
  const { eventCode } = useParams<{ eventCode: string }>()
  const [modalPublicarAbierto, setModalPublicarAbierto] = useState(false)
  const [artistaSeleccionadoId, setArtistaSeleccionadoId] = useState<string>('')
  const [aviso, setAviso] = useState<{ tipo: 'exito' | 'error'; mensaje: string } | null>(null)

  const {
    data: evento,
    isLoading: cargandoEvento,
    isError: errorEvento,
    error: errEvento,
    refetch,
  } = useEvento(eventCode)

  const { data: todosArtistas } = useArtistasActivos()
  const mutacionPublicar = usePublicarEvento()
  const mutacionAsociar = useAsociarArtista()

  if (cargandoEvento) {
    return <Cargando filas={3} tipo="lineas" mensaje="Cargando evento..." />
  }

  if (errorEvento || !evento) {
    return (
      <EstadoError
        mensaje={(errEvento as Error)?.message || 'Evento no encontrado.'}
        onReintentar={() => refetch()}
      />
    )
  }

  const esBorrador = evento.status === 'DRAFT'
  const idsAsociados = new Set(evento.artists?.map((a) => a.id) || [])
  const artistasDisponibles = todosArtistas?.filter((a) => !idsAsociados.has(a.id)) || []

  const handleConfirmarPublicar = async () => {
    setAviso(null)
    try {
      await mutacionPublicar.mutateAsync(evento.eventCode)
      guardarEventoCreadoEnSesion({
        eventCode: evento.eventCode,
        name: evento.name,
        status: 'PUBLISHED',
      })
      setModalPublicarAbierto(false)
      setAviso({ tipo: 'exito', mensaje: 'Evento publicado exitosamente.' })
    } catch (err) {
      if (err instanceof ApiError) {
        setAviso({ tipo: 'error', mensaje: err.message })
      } else {
        setAviso({ tipo: 'error', mensaje: 'No se pudo publicar el evento.' })
      }
      setModalPublicarAbierto(false)
    }
  }

  const handleAsociarArtista = async () => {
    if (!artistaSeleccionadoId) return
    setAviso(null)
    try {
      await mutacionAsociar.mutateAsync({
        eventCode: evento.eventCode,
        artistId: Number(artistaSeleccionadoId),
      })
      setArtistaSeleccionadoId('')
      setAviso({ tipo: 'exito', mensaje: 'Artista asociado con éxito.' })
    } catch (err) {
      if (err instanceof ApiError) {
        setAviso({ tipo: 'error', mensaje: err.message })
      } else {
        setAviso({ tipo: 'error', mensaje: 'No se pudo asociar el artista.' })
      }
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <nav aria-label="Navegación de retorno">
        <Link
          to={RUTAS.adminEventos}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-marca-600 dark:text-slate-400 dark:hover:text-marca-400 transition-colors"
        >
          <span>←</span> Eventos
        </Link>
      </nav>

      {/* Cabecera del evento */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold font-titulo text-slate-900 dark:text-slate-100">
            {evento.name}
          </h1>
          <Badge tono={evento.status} />
        </div>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex flex-wrap gap-2 items-center">
          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
            {evento.eventCode}
          </span>
          <span>·</span>
          <span>{evento.category}</span>
          <span>·</span>
          <span>{formatearFecha(evento.eventDate, true)}</span>
          <span>·</span>
          <span>Mín. {evento.minimumAge} años</span>
          {evento.venueName && (
            <>
              <span>·</span>
              <span>{evento.venueName}</span>
            </>
          )}
        </p>
      </div>

      {aviso && (
        <Aviso
          tipo={aviso.tipo}
          mensaje={aviso.mensaje}
          onCerrar={() => setAviso(null)}
        />
      )}

      {/* Tarjeta 1: Publicación */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold font-titulo text-slate-900 dark:text-slate-100">
            Publicación
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            El evento es visible al público una vez publicado.
          </p>
        </div>

        <Boton
          type="button"
          variante="primario"
          disabled={!esBorrador}
          onClick={() => setModalPublicarAbierto(true)}
          className="w-full sm:w-auto"
        >
          {esBorrador ? 'Publicar evento' : 'Evento publicado'}
        </Boton>
      </div>

      {/* Tarjeta 2: Artistas asociados */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-6">
        <div>
          <h2 className="text-lg font-bold font-titulo text-slate-900 dark:text-slate-100">
            Artistas asociados
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Artistas programados para presentarse en este evento
          </p>
        </div>

        {evento.artists && evento.artists.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {evento.artists.map((artista) => (
              <AvatarArtista key={artista.id} artista={artista} tamano="sm" />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">
            No hay artistas asociados a este evento aún.
          </p>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-end gap-3">
          <div className="flex-1 w-full">
            <Selector
              etiqueta="Agregar artista"
              value={artistaSeleccionadoId}
              onChange={(e) => setArtistaSeleccionadoId(e.target.value)}
            >
              <option value="">Selecciona un artista</option>
              {artistasDisponibles.map((art) => (
                <option key={art.id} value={art.id}>
                  {art.stageName} {art.genre ? `(${art.genre})` : ''}
                </option>
              ))}
            </Selector>
          </div>

          <Boton
            type="button"
            variante="secundario"
            disabled={!artistaSeleccionadoId || mutacionAsociar.isPending}
            cargando={mutacionAsociar.isPending}
            onClick={handleAsociarArtista}
            className="w-full sm:w-auto px-6"
          >
            + Asociar
          </Boton>
        </div>
      </div>

      {/* Enlace hacia tickets pagados */}
      <div className="pt-2 flex justify-end">
        <Link
          to={RUTAS.staffTicketsPagados(evento.eventCode)}
          className="text-sm font-semibold text-marca-600 hover:text-marca-700 dark:text-marca-400 flex items-center gap-1.5"
        >
          Tickets pagados <span>→</span>
        </Link>
      </div>

      {/* Modal Confirmar Publicación */}
      <Modal
        abierto={modalPublicarAbierto}
        titulo="Publicar evento"
        onCerrar={() => setModalPublicarAbierto(false)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            ¿Confirmas la publicación del evento{' '}
            <strong className="text-slate-900 dark:text-slate-100">{evento.name}</strong> (
            <span className="font-mono">{evento.eventCode}</span>)? Una vez publicado,
            estará disponible para compra en la cartelera.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Boton
              type="button"
              variante="secundario"
              onClick={() => setModalPublicarAbierto(false)}
            >
              Cancelar
            </Boton>
            <Boton
              type="button"
              variante="primario"
              cargando={mutacionPublicar.isPending}
              onClick={handleConfirmarPublicar}
            >
              Publicar
            </Boton>
          </div>
        </div>
      </Modal>
    </div>
  )
}
