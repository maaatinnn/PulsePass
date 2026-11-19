import { useState } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router'
import { clsx } from 'clsx'
import { RUTAS } from '../lib/rutas'
import { formatearFecha } from '../lib/formato'
import { useAuth } from '../funcionalidades/auth/AuthContext'
import { useEvento } from '../funcionalidades/eventos/hooks'
import { useComprarTicket } from '../funcionalidades/tickets/hooks'
import type { TicketType } from '../funcionalidades/tickets/tipos'
import type { EventCategory } from '../funcionalidades/eventos/tipos'
import { Badge } from '../componentes/Badge'
import { Boton } from '../componentes/Boton'
import { Modal } from '../componentes/Modal'
import { Aviso } from '../componentes/Aviso'
import { Cargando } from '../componentes/Cargando'
import { EstadoVacio } from '../componentes/EstadoVacio'
import { AvatarArtista } from '../funcionalidades/artistas/componentes/AvatarArtista'
import { ApiError } from '../lib/http'
import {
  IconoNota,
  IconoTemplo,
  IconoEstrella,
  IconoMonitor,
  IconoTrofeo,
  IconoBirrete,
  IconoCalendario,
  IconoUsuario,
  IconoUbicacion,
} from '../componentes/Iconos'

const CATEGORIA_ICONO: Record<
  EventCategory,
  { fondo: string; texto: string; icono: typeof IconoNota }
> = {
  MUSIC: {
    fondo: 'bg-indigo-100 dark:bg-indigo-950/60',
    texto: 'text-indigo-600 dark:text-indigo-400',
    icono: IconoNota,
  },
  CULTURE: {
    fondo: 'bg-rose-100 dark:bg-rose-950/60',
    texto: 'text-rose-700 dark:text-rose-400',
    icono: IconoTemplo,
  },
  ENTERTAINMENT: {
    fondo: 'bg-purple-100 dark:bg-purple-950/60',
    texto: 'text-purple-600 dark:text-purple-400',
    icono: IconoEstrella,
  },
  TECHNOLOGY: {
    fondo: 'bg-sky-100 dark:bg-sky-950/60',
    texto: 'text-sky-600 dark:text-sky-400',
    icono: IconoMonitor,
  },
  SPORTS: {
    fondo: 'bg-emerald-100 dark:bg-emerald-950/60',
    texto: 'text-emerald-600 dark:text-emerald-400',
    icono: IconoTrofeo,
  },
  EDUCATION: {
    fondo: 'bg-amber-100 dark:bg-amber-950/60',
    texto: 'text-amber-700 dark:text-amber-400',
    icono: IconoBirrete,
  },
}

const TIPOS_ENTRADA: TicketType[] = ['GENERAL', 'VIP', 'BACKSTAGE', 'STUDENT']

export default function DetalleEvento() {
  const { eventCode } = useParams<{ eventCode: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { sesion, tieneRol } = useAuth()

  const [tipoSeleccionado, setTipoSeleccionado] = useState<TicketType>('GENERAL')
  const [modalCompraAbierto, setModalCompraAbierto] = useState(false)
  const [errorModal, setErrorModal] = useState<string | null>(null)

  const {
    data: evento,
    isLoading,
    isError,
    error,
  } = useEvento(eventCode)

  const mutacionCompra = useComprarTicket()

  if (isLoading) {
    return <Cargando filas={4} tipo="lineas" mensaje="Cargando evento..." />
  }

  // 404 o no publicado para usuario anónimo
  if (isError || !evento) {
    const status = error instanceof ApiError ? error.status : 404
    return (
      <div className="py-12">
        <EstadoVacio
          titulo={status === 404 || status === 403 ? 'Evento no disponible' : 'Error al cargar'}
          mensaje="El evento solicitado no se encuentra disponible o no existe en la cartelera."
          accion={
            <Link to={RUTAS.eventos}>
              <Boton variante="secundario">Volver a la cartelera</Boton>
            </Link>
          }
        />
      </div>
    )
  }

  const cat = CATEGORIA_ICONO[evento.category] || CATEGORIA_ICONO.MUSIC
  const IconoCat = cat.icono
  const estaPublicado = evento.status === 'PUBLISHED'
  const esStaffOAdmin =
    sesion.estado === 'autenticado' && (tieneRol('STAFF') || tieneRol('ADMIN'))

  const handleIniciarCompra = () => {
    if (sesion.estado === 'cargando') return
    if (sesion.estado === 'anonimo') {
      navigate(RUTAS.login, { state: { desde: location.pathname } })
      return
    }
    setErrorModal(null)
    setModalCompraAbierto(true)
  }

  const handleConfirmarCompra = async () => {
    if (sesion.estado !== 'autenticado') return

    setErrorModal(null)
    try {
      const ticketCreado = await mutacionCompra.mutateAsync({
        userEmail: sesion.usuario.email,
        eventCode: evento.eventCode,
        type: tipoSeleccionado,
      })
      setModalCompraAbierto(false)
      navigate(RUTAS.confirmacionCompra(ticketCreado.ticketCode))
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorModal(err.message)
      } else {
        setErrorModal('No se pudo procesar la compra. Inténtalo de nuevo.')
      }
    }
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Volver */}
      <nav aria-label="Navegación de retorno">
        <Link
          to={RUTAS.eventos}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-marca-600 dark:text-slate-400 dark:hover:text-marca-400 transition-colors"
        >
          <span>←</span> Volver a la cartelera
        </Link>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Detalle Principal */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            {/* Banner decorativo */}
            <div
              className={clsx(
                'h-56 sm:h-72 w-full flex items-center justify-center transition-colors',
                cat.fondo,
              )}
            >
              <IconoCat className={clsx('h-24 w-24 sm:h-32 sm:w-32', cat.texto)} />
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tono={evento.category as never} texto={evento.category} />
                <Badge tono={evento.status} />
              </div>

              <div>
                <h1 className="text-2xl sm:text-4xl font-extrabold font-titulo text-slate-900 dark:text-slate-100">
                  {evento.name}
                </h1>
                <p className="mt-1 text-xs font-mono text-slate-400">
                  Código: {evento.eventCode}
                </p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <IconoCalendario className="h-4 w-4 text-slate-400" />
                  <span>{formatearFecha(evento.eventDate, true)}</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <IconoUsuario className="h-4 w-4 text-slate-400" />
                  <span>Edad mínima: {evento.minimumAge}</span>
                </div>
              </div>

              {evento.description && (
                <div className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base border-t border-slate-100 dark:border-slate-800 pt-6">
                  {evento.description}
                </div>
              )}

              {/* Artistas */}
              {evento.artists && evento.artists.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-3">
                  <h2 className="text-base font-bold font-titulo text-slate-900 dark:text-slate-100">
                    Artistas
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {evento.artists.map((artista) => (
                      <AvatarArtista key={artista.id} artista={artista} tamano="sm" />
                    ))}
                  </div>
                </div>
              )}

              {/* Sede */}
              {(evento.venueCode || evento.venueName) && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-3">
                  <h2 className="text-base font-bold font-titulo text-slate-900 dark:text-slate-100">
                    Sede
                  </h2>
                  <Link
                    to={RUTAS.detalleSede(evento.venueCode || '')}
                    className="block rounded-2xl border border-slate-200 dark:border-slate-800 p-4 hover:border-marca-300 dark:hover:border-marca-800 bg-slate-50/50 dark:bg-slate-800/30 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-marca-50 text-marca-600 dark:bg-marca-950 dark:text-marca-400">
                        <IconoUbicacion className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          {evento.venueName || evento.venueCode}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          Código: {evento.venueCode}
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Panel de Compra */}
        {!esStaffOAdmin && (
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-bold font-titulo text-slate-900 dark:text-slate-100">
                  Entradas
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Selecciona el tipo de entrada para este evento
                </p>
              </div>

              {/* Selector de tipos de entrada */}
              <div className="space-y-3" role="radiogroup" aria-label="Tipo de entrada">
                {TIPOS_ENTRADA.map((tipo) => {
                  const seleccionada = tipoSeleccionado === tipo
                  return (
                    <button
                      type="button"
                      role="radio"
                      key={tipo}
                      aria-checked={seleccionada}
                      onClick={() => setTipoSeleccionado(tipo)}
                      className={clsx(
                        'w-full flex items-center justify-between p-4 rounded-xl border text-sm font-medium transition-all text-left cursor-pointer',
                        seleccionada
                          ? 'border-marca-600 bg-marca-50/70 text-marca-900 dark:border-marca-500 dark:bg-marca-950/40 dark:text-marca-200 ring-2 ring-marca-600 dark:ring-marca-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={clsx(
                            'h-4 w-4 rounded-full border flex items-center justify-center',
                            seleccionada
                              ? 'border-marca-600 bg-marca-600'
                              : 'border-slate-300 dark:border-slate-600',
                          )}
                        >
                          {seleccionada && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="font-semibold">{tipo}</span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Botón de compra / login */}
              <div>
                {sesion.estado === 'anonimo' ? (
                  <Boton
                    type="button"
                    variante="primario"
                    onClick={handleIniciarCompra}
                    className="w-full"
                  >
                    Inicia sesión para comprar
                  </Boton>
                ) : (
                  <Boton
                    type="button"
                    variante="primario"
                    disabled={sesion.estado === 'cargando' || !estaPublicado}
                    onClick={handleIniciarCompra}
                    className="w-full"
                  >
                    {sesion.estado === 'cargando'
                      ? 'Cargando sesión...'
                      : estaPublicado
                        ? 'Comprar entrada'
                        : 'Entradas no disponibles'}
                  </Boton>
                )}
                <p className="mt-3 text-center text-xs text-slate-400">
                  El precio lo define el sistema al confirmar.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Móvil: Barra inferior fija */}
      {!esStaffOAdmin && (
        <div className="fixed bottom-0 inset-x-0 z-30 md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 shadow-lg flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Tipo</span>
            <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
              {tipoSeleccionado}
            </p>
          </div>
          <Boton
            type="button"
            variante="primario"
            disabled={
              sesion.estado === 'cargando' ||
              (sesion.estado === 'autenticado' && !estaPublicado)
            }
            onClick={handleIniciarCompra}
            className="flex-1 max-w-xs"
          >
            {sesion.estado === 'anonimo'
              ? 'Iniciar sesión'
              : sesion.estado === 'cargando'
                ? 'Cargando sesión...'
                : estaPublicado
                  ? 'Comprar entrada'
                  : 'No disponible'}
          </Boton>
        </div>
      )}

      {/* Modal Confirmar Compra */}
      <Modal
        abierto={modalCompraAbierto}
        titulo="Confirmar compra"
        onCerrar={() => setModalCompraAbierto(false)}
      >
        <div className="space-y-4">
          <div className="space-y-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Evento:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 text-right">
                {evento.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Tipo:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {tipoSeleccionado}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Cuenta:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono text-xs">
                {sesion.estado === 'autenticado' ? sesion.usuario.email : ''}
              </span>
            </div>
          </div>

          {errorModal && (
            <Aviso tipo="error" mensaje={errorModal} />
          )}

          <div className="flex items-center justify-end gap-3 pt-3">
            <Boton
              type="button"
              variante="secundario"
              onClick={() => setModalCompraAbierto(false)}
            >
              Cancelar
            </Boton>
            <Boton
              type="button"
              variante="primario"
              cargando={mutacionCompra.isPending}
              onClick={handleConfirmarCompra}
            >
              Confirmar
            </Boton>
          </div>
        </div>
      </Modal>
    </div>
  )
}
