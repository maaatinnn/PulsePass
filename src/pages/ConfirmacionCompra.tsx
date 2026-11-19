import { useParams, Link } from 'react-router'
import { RUTAS } from '../lib/rutas'
import { useTicket } from '../funcionalidades/tickets/hooks'
import { Badge } from '../componentes/Badge'
import { Boton } from '../componentes/Boton'
import { PrecioCOP } from '../componentes/PrecioCOP'
import { Cargando } from '../componentes/Cargando'
import { EstadoVacio } from '../componentes/EstadoVacio'
import { EstadoError } from '../componentes/EstadoError'
import { IconoCheck } from '../componentes/Iconos'
import { ApiError } from '../lib/http'

export default function ConfirmacionCompra() {
  const { ticketCode } = useParams<{ ticketCode: string }>()
  const { data: ticket, isLoading, isError, error, refetch } = useTicket(ticketCode)

  if (isLoading) {
    return <Cargando filas={2} tipo="lineas" mensaje="Cargando confirmación..." />
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
              <Link to={RUTAS.eventos}>
                <Boton variante="secundario">Explorar eventos</Boton>
              </Link>
            }
          />
        </div>
      )
    }

    return (
      <EstadoError
        mensaje={(error as Error)?.message || 'No se pudo cargar la confirmación.'}
        onReintentar={() => refetch()}
      />
    )
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-10 text-center shadow-lg space-y-6">
        {/* Check Verde */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
          <IconoCheck className="h-10 w-10 stroke-[2.5]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold font-titulo text-slate-900 dark:text-slate-100">
            ¡Compra realizada con éxito!
          </h1>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-200 font-titulo">
            {ticket.eventName}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 p-4 space-y-2 border border-slate-100 dark:border-slate-800">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Ticket <strong className="font-mono text-slate-900 dark:text-slate-100">{ticket.ticketCode}</strong> ·{' '}
            <span className="font-semibold text-marca-600 dark:text-marca-400">{ticket.type}</span> ·{' '}
            <PrecioCOP valor={Number(ticket.price)} />
          </p>
          <div>
            <Badge tono={ticket.status} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to={RUTAS.misTickets} className="w-full sm:w-auto">
            <Boton variante="primario" className="w-full sm:w-auto px-6">
              Ver mis tickets
            </Boton>
          </Link>
          <Link to={RUTAS.eventos} className="w-full sm:w-auto">
            <Boton variante="secundario" className="w-full sm:w-auto px-6">
              Seguir explorando
            </Boton>
          </Link>
        </div>
      </div>
    </div>
  )
}
