import { useState, useMemo } from 'react'
import { Link } from 'react-router'
import { clsx } from 'clsx'
import { RUTAS } from '../lib/rutas'
import { formatearFecha } from '../lib/formato'
import { useMisTickets, useCancelarTicket } from '../funcionalidades/tickets/hooks'
import type { TicketResponse, TicketStatus } from '../funcionalidades/tickets/tipos'
import { Badge } from '../componentes/Badge'
import { Boton } from '../componentes/Boton'
import { PrecioCOP } from '../componentes/PrecioCOP'
import { Modal } from '../componentes/Modal'
import { Aviso } from '../componentes/Aviso'
import { Cargando } from '../componentes/Cargando'
import { EstadoVacio } from '../componentes/EstadoVacio'
import { EstadoError } from '../componentes/EstadoError'
import { IconoTicket } from '../componentes/Iconos'
import { ApiError } from '../lib/http'

type FiltroEstado = 'TODOS' | TicketStatus

export default function MisTickets() {
  const [filtro, setFiltro] = useState<FiltroEstado>('TODOS')
  const [ticketACancelar, setTicketACancelar] = useState<TicketResponse | null>(null)
  const [errorModal, setErrorModal] = useState<string | null>(null)

  const { data: tickets, isLoading, isError, error, refetch } = useMisTickets()
  const mutacionCancelar = useCancelarTicket()

  const ticketsFiltrados = useMemo(() => {
    if (!tickets) return []
    if (filtro === 'TODOS') return tickets
    return tickets.filter((t) => t.status === filtro)
  }, [tickets, filtro])

  const handleAbrirModalCancelar = (ticket: TicketResponse) => {
    setErrorModal(null)
    setTicketACancelar(ticket)
  }

  const handleConfirmarCancelacion = async () => {
    if (!ticketACancelar) return

    setErrorModal(null)
    try {
      await mutacionCancelar.mutateAsync(ticketACancelar.ticketCode)
      setTicketACancelar(null)
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorModal(err.message)
      } else {
        setErrorModal('No se pudo cancelar el ticket.')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-titulo text-slate-900 dark:text-slate-100">
          Mis tickets
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Consulta y gestiona las entradas que has comprado
        </p>
      </div>

      {/* Chips de Filtro */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
        {(
          [
            { id: 'TODOS', label: 'Todos' },
            { id: 'PAID', label: 'Pagados' },
            { id: 'USED', label: 'Usados' },
            { id: 'CANCELLED', label: 'Cancelados' },
          ] as const
        ).map((chip) => {
          const activo = filtro === chip.id
          return (
            <button
              key={chip.id}
              type="button"
              aria-pressed={activo}
              onClick={() => setFiltro(chip.id)}
              className={clsx(
                'min-h-[40px] px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer',
                activo
                  ? 'bg-marca-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800',
              )}
            >
              {chip.label}
            </button>
          )
        })}
      </div>

      {isLoading && <Cargando filas={3} tipo="lineas" mensaje="Cargando tus tickets..." />}

      {isError && (
        <EstadoError
          mensaje={(error as Error)?.message || 'No se pudieron cargar tus tickets.'}
          onReintentar={() => refetch()}
        />
      )}

      {!isLoading && !isError && tickets && tickets.length === 0 && (
        <EstadoVacio
          icono={<IconoTicket className="h-10 w-10 text-slate-400" />}
          titulo="Aún no tienes tickets"
          mensaje="Aún no tienes tickets comprados. ¡Explora los eventos disponibles y vive la experiencia!"
          accion={
            <Link to={RUTAS.eventos}>
              <Boton variante="primario">Ver cartelera</Boton>
            </Link>
          }
        />
      )}

      {!isLoading && !isError && tickets && tickets.length > 0 && ticketsFiltrados.length === 0 && (
        <EstadoVacio
          mensaje={`No tienes tickets en estado "${filtro.toLowerCase()}".`}
          accion={
            <Boton variante="secundario" onClick={() => setFiltro('TODOS')}>
              Ver todos los tickets
            </Boton>
          }
        />
      )}

      {!isLoading && !isError && ticketsFiltrados.length > 0 && (
        <div className="space-y-4">
          {ticketsFiltrados.map((ticket) => (
            <div
              key={ticket.ticketCode}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-bold font-titulo text-lg text-slate-900 dark:text-slate-100">
                    {ticket.eventName}
                  </h3>
                  <Badge tono={ticket.status} />
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    {ticket.ticketCode}
                  </span>
                  <span>·</span>
                  <span className="font-semibold text-marca-600 dark:text-marca-400">
                    {ticket.type}
                  </span>
                  <span>·</span>
                  <PrecioCOP valor={Number(ticket.price)} />
                  <span>·</span>
                  <span>{formatearFecha(ticket.purchaseDate)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2 sm:pt-0">
                <Link to={RUTAS.detalleTicket(ticket.ticketCode)}>
                  <Boton variante="secundario" className="text-xs sm:text-sm">
                    Ver detalle
                  </Boton>
                </Link>

                {ticket.status === 'PAID' && (
                  <Boton
                    type="button"
                    variante="peligro"
                    onClick={() => handleAbrirModalCancelar(ticket)}
                    className="text-xs sm:text-sm"
                  >
                    Cancelar
                  </Boton>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Cancelación */}
      <Modal
        abierto={!!ticketACancelar}
        titulo="Cancelar ticket"
        onCerrar={() => setTicketACancelar(null)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            ¿Quieres cancelar el ticket{' '}
            <strong className="font-mono text-slate-900 dark:text-slate-100">
              {ticketACancelar?.ticketCode}
            </strong>{' '}
            ({ticketACancelar?.type}) de{' '}
            <strong>{ticketACancelar?.eventName}</strong>?
          </p>

          {errorModal && (
            <Aviso tipo="error" mensaje={errorModal} />
          )}

          <div className="flex items-center justify-end gap-3 pt-3">
            <Boton
              type="button"
              variante="secundario"
              onClick={() => setTicketACancelar(null)}
            >
              Volver
            </Boton>
            <Boton
              type="button"
              variante="peligro"
              cargando={mutacionCancelar.isPending}
              onClick={handleConfirmarCancelacion}
            >
              Cancelar ticket
            </Boton>
          </div>
        </div>
      </Modal>
    </div>
  )
}
