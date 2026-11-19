import { useState, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router'
import { RUTAS } from '../lib/rutas'
import {
  useTicketsPagadosPorEvento,
  useUsarTicket,
} from '../funcionalidades/tickets/hooks'
import type { TicketResponse } from '../funcionalidades/tickets/tipos'
import { Tabla, type Columna } from '../componentes/Tabla'
import { Badge } from '../componentes/Badge'
import { Boton } from '../componentes/Boton'
import { Campo } from '../componentes/Campo'
import { PrecioCOP } from '../componentes/PrecioCOP'
import { Cargando } from '../componentes/Cargando'
import { EstadoVacio } from '../componentes/EstadoVacio'
import { EstadoError } from '../componentes/EstadoError'
import { Aviso } from '../componentes/Aviso'
import { ApiError } from '../lib/http'

export default function TicketsPagadosEvento() {
  const { eventCode = 'CMF-2026' } = useParams<{ eventCode: string }>()
  const navigate = useNavigate()
  const [codigoEventoInput, setCodigoEventoInput] = useState(eventCode)
  const [aviso, setAviso] = useState<{ tipo: 'exito' | 'error'; mensaje: string } | null>(null)

  const {
    data: tickets,
    isLoading,
    isError,
    error,
    refetch,
  } = useTicketsPagadosPorEvento(eventCode)

  const mutacionUsar = useUsarTicket()

  const handleCambiarEvento = (e: FormEvent) => {
    e.preventDefault()
    const nuevo = codigoEventoInput.trim()
    if (nuevo) {
      navigate(RUTAS.staffTicketsPagados(nuevo))
    }
  }

  const handleUsarTicket = async (ticketCode: string) => {
    setAviso(null)
    try {
      await mutacionUsar.mutateAsync(ticketCode)
      setAviso({ tipo: 'exito', mensaje: `Ticket ${ticketCode} marcado como usado.` })
    } catch (err) {
      if (err instanceof ApiError) {
        setAviso({ tipo: 'error', mensaje: err.message })
      } else {
        setAviso({ tipo: 'error', mensaje: 'No se pudo marcar el ticket como usado.' })
      }
    }
  }

  const columnas: Columna<TicketResponse>[] = [
    {
      encabezado: 'Código',
      celda: (t) => <span className="font-mono font-bold">{t.ticketCode}</span>,
    },
    {
      encabezado: 'Tipo',
      celda: (t) => (
        <span className="font-semibold text-marca-600 dark:text-marca-400">
          {t.type}
        </span>
      ),
    },
    {
      encabezado: 'Titular',
      celda: (t) => <span className="font-mono text-xs">{t.userEmail}</span>,
    },
    {
      encabezado: 'Precio',
      celda: (t) => <PrecioCOP valor={Number(t.price)} />,
    },
    {
      encabezado: 'Estado',
      celda: (t) => <Badge tono={t.status} />,
    },
    {
      encabezado: 'Acción',
      celda: (t) => (
        <Boton
          type="button"
          variante="primario"
          className="!py-1.5 !px-3 !min-h-[36px] text-xs"
          onClick={() => handleUsarTicket(t.ticketCode)}
          disabled={mutacionUsar.isPending}
        >
          Usar
        </Boton>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Cabecera y buscador de evento */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-titulo text-slate-900 dark:text-slate-100">
            Tickets pagados · <span className="font-mono">{eventCode}</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Total: {tickets?.length ?? 0}
          </p>
        </div>

        <form onSubmit={handleCambiarEvento} className="flex items-end gap-2">
          <div className="w-36">
            <Campo
              etiqueta="Evento"
              placeholder="CMF-2026"
              className="font-mono uppercase text-sm !min-h-[40px] !py-1.5"
              value={codigoEventoInput}
              onChange={(e) => setCodigoEventoInput(e.target.value)}
            />
          </div>
          <Boton
            type="submit"
            variante="secundario"
            className="!min-h-[40px] !py-1.5 px-3 text-sm"
          >
            Ir
          </Boton>
        </form>
      </div>

      {aviso && (
        <Aviso
          tipo={aviso.tipo}
          mensaje={aviso.mensaje}
          onCerrar={() => setAviso(null)}
        />
      )}

      {isLoading && <Cargando filas={4} tipo="tabla" mensaje="Cargando tickets pagados..." />}

      {isError && (
        <EstadoError
          mensaje={(error as Error)?.message || 'No se pudieron cargar los tickets del evento.'}
          onReintentar={() => refetch()}
        />
      )}

      {!isLoading && !isError && tickets && tickets.length === 0 && (
        <EstadoVacio mensaje="No hay tickets pagados" />
      )}

      {!isLoading && !isError && tickets && tickets.length > 0 && (
        <>
          {/* Vista Escritorio: Tabla */}
          <div className="hidden md:block">
            <Tabla<TicketResponse>
              columnas={columnas}
              filas={tickets}
              keyExtractor={(t) => t.ticketCode}
            />
          </div>

          {/* Vista Móvil: Tarjetas apiladas */}
          <div className="md:hidden space-y-4">
            {tickets.map((t) => (
              <div
                key={t.ticketCode}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {t.ticketCode}
                  </span>
                  <Badge tono={t.status} />
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <p>
                    <span className="font-semibold text-marca-600 dark:text-marca-400">
                      {t.type}
                    </span>{' '}
                    · {t.userEmail} · <PrecioCOP valor={Number(t.price)} />
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <Boton
                    type="button"
                    variante="primario"
                    className="w-full"
                    onClick={() => handleUsarTicket(t.ticketCode)}
                    disabled={mutacionUsar.isPending}
                  >
                    Usar
                  </Boton>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
