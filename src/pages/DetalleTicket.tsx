import { useState } from 'react'
import { useParams, Link } from 'react-router'
import { RUTAS } from '../lib/rutas'
import { formatearFechaHoraTexto } from '../lib/formato'
import { useTicket, useCancelarTicket } from '../funcionalidades/tickets/hooks'
import { Badge } from '../componentes/Badge'
import { Boton } from '../componentes/Boton'
import { PrecioCOP } from '../componentes/PrecioCOP'
import { Modal } from '../componentes/Modal'
import { Aviso } from '../componentes/Aviso'
import { Cargando } from '../componentes/Cargando'
import { EstadoVacio } from '../componentes/EstadoVacio'
import { EstadoError } from '../componentes/EstadoError'
import { IconoCopiar, IconoCheck } from '../componentes/Iconos'
import { ApiError } from '../lib/http'

export default function DetalleTicket() {
  const { ticketCode } = useParams<{ ticketCode: string }>()
  const [copiado, setCopiado] = useState(false)
  const [modalCancelarAbierto, setModalCancelarAbierto] = useState(false)
  const [errorModal, setErrorModal] = useState<string | null>(null)

  const { data: ticket, isLoading, isError, error, refetch } = useTicket(ticketCode)
  const mutacionCancelar = useCancelarTicket()

  const handleCopiar = async () => {
    if (!ticket?.ticketCode) return
    try {
      await navigator.clipboard.writeText(ticket.ticketCode)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // noop
    }
  }

  const handleConfirmarCancelacion = async () => {
    if (!ticket) return
    setErrorModal(null)
    try {
      await mutacionCancelar.mutateAsync(ticket.ticketCode)
      setModalCancelarAbierto(false)
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorModal(err.message)
      } else {
        setErrorModal('No se pudo cancelar el ticket.')
      }
    }
  }

  if (isLoading) {
    return <Cargando filas={3} tipo="lineas" mensaje="Cargando ticket..." />
  }

  if (isError || !ticket) {
    const status = error instanceof ApiError ? error.status : 404
    if (status === 403 || status === 404) {
      return (
        <div className="py-12">
          <EstadoVacio
            titulo="Ticket no disponible"
            mensaje="El ticket solicitado no se encuentra disponible o no existe."
            accion={
              <Link to={RUTAS.misTickets}>
                <Boton variante="secundario">Volver a mis tickets</Boton>
              </Link>
            }
          />
        </div>
      )
    }

    return (
      <EstadoError
        mensaje={(error as Error)?.message || 'No se pudo cargar el ticket.'}
        onReintentar={() => refetch()}
      />
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <nav aria-label="Navegación de retorno">
        <Link
          to={RUTAS.misTickets}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-marca-600 dark:text-slate-400 dark:hover:text-marca-400 transition-colors"
        >
          <span>←</span> Mis tickets
        </Link>
      </nav>

      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-titulo text-slate-900 dark:text-slate-100">
              {ticket.eventName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Evento: {ticket.eventCode}
            </p>
          </div>
          <Badge tono={ticket.status} />
        </div>

        <div className="space-y-4 text-sm divide-y divide-slate-100 dark:divide-slate-800">
          <div className="flex items-center justify-between pt-2">
            <span className="text-slate-500 dark:text-slate-400">Código</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-base text-slate-900 dark:text-slate-100">
                {ticket.ticketCode}
              </span>
              <button
                type="button"
                onClick={handleCopiar}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Copiar código del ticket"
              >
                {copiado ? (
                  <>
                    <IconoCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-semibold">Copiado</span>
                  </>
                ) : (
                  <>
                    <IconoCopiar className="h-3.5 w-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3">
            <span className="text-slate-500 dark:text-slate-400">Tipo</span>
            <span className="font-semibold text-marca-600 dark:text-marca-400">
              {ticket.type}
            </span>
          </div>

          <div className="flex items-center justify-between pt-3">
            <span className="text-slate-500 dark:text-slate-400">Precio</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              <PrecioCOP valor={Number(ticket.price)} />
            </span>
          </div>

          <div className="flex items-center justify-between pt-3">
            <span className="text-slate-500 dark:text-slate-400">Comprado el</span>
            <span className="text-slate-800 dark:text-slate-200">
              {formatearFechaHoraTexto(ticket.purchaseDate)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-3">
            <span className="text-slate-500 dark:text-slate-400">Titular</span>
            <span className="text-slate-800 dark:text-slate-200 font-mono text-xs">
              {ticket.userEmail}
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-4 text-xs text-slate-500 dark:text-slate-400 text-center">
          Presenta este código en el ingreso.
        </div>
      </div>

      {/* Botón cancelar alineado a la derecha fuera de la tarjeta */}
      {ticket.status === 'PAID' && (
        <div className="flex justify-end pt-2">
          <Boton
            type="button"
            variante="peligro"
            onClick={() => {
              setErrorModal(null)
              setModalCancelarAbierto(true)
            }}
          >
            Cancelar ticket
          </Boton>
        </div>
      )}

      {/* Modal Cancelación */}
      <Modal
        abierto={modalCancelarAbierto}
        titulo="Cancelar ticket"
        onCerrar={() => setModalCancelarAbierto(false)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            ¿Quieres cancelar el ticket{' '}
            <strong className="font-mono">{ticket.ticketCode}</strong> ({ticket.type})
            de <strong>{ticket.eventName}</strong>?
          </p>

          {errorModal && <Aviso tipo="error" mensaje={errorModal} />}

          <div className="flex items-center justify-end gap-3 pt-3">
            <Boton
              type="button"
              variante="secundario"
              onClick={() => setModalCancelarAbierto(false)}
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
