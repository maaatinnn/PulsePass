import { useState, useRef, type FormEvent } from 'react'
import { ticketsApi } from '../funcionalidades/tickets/api'
import { useUsarTicket } from '../funcionalidades/tickets/hooks'
import type { TicketResponse } from '../funcionalidades/tickets/tipos'
import { Boton } from '../componentes/Boton'
import { Campo } from '../componentes/Campo'
import { Badge } from '../componentes/Badge'
import { Aviso } from '../componentes/Aviso'
import { ApiError } from '../lib/http'

export default function ValidacionIngreso() {
  const [codigoBusqueda, setCodigoBusqueda] = useState('')
  const [ticketEncontrado, setTicketEncontrado] = useState<TicketResponse | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [mensajeError, setMensajeError] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const mutacionUsar = useUsarTicket()

  const handleBuscar = async (e?: FormEvent) => {
    if (e) e.preventDefault()
    const codigo = codigoBusqueda.trim()
    if (!codigo) return

    setBuscando(true)
    setMensajeExito(null)
    setMensajeError(null)

    try {
      const ticket = await ticketsApi.porCodigo(codigo)
      setTicketEncontrado(ticket)
    } catch (err) {
      setTicketEncontrado(null)
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setMensajeError('Ticket no encontrado')
        } else if (err.status === 403) {
          setMensajeError('Sin permisos')
        } else {
          setMensajeError(err.message)
        }
      } else {
        setMensajeError('Error al consultar el ticket.')
      }
    } finally {
      setBuscando(false)
    }
  }

  const handleMarcarComoUsado = async () => {
    if (!ticketEncontrado) return
    setMensajeExito(null)
    setMensajeError(null)

    try {
      const actualizado = await mutacionUsar.mutateAsync(ticketEncontrado.ticketCode)
      setTicketEncontrado(actualizado)
      setMensajeExito('Ingreso registrado.')
      setCodigoBusqueda('')
      inputRef.current?.focus()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setMensajeError(err.message || 'El ticket ya fue utilizado. (409)')
          setTicketEncontrado((prev) => (prev ? { ...prev, status: 'USED' } : null))
        } else {
          setMensajeError(err.message)
        }
      } else {
        setMensajeError('No se pudo marcar el ticket como usado.')
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-titulo text-slate-900 dark:text-slate-100">
          Validación de ingreso
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Escanea o busca el código del ticket para autorizar el acceso en puerta
        </p>
      </div>

      {/* Formulario de búsqueda rápida */}
      <form
        onSubmit={handleBuscar}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row items-end gap-3">
          <div className="flex-1 w-full">
            <Campo
              ref={inputRef}
              etiqueta="Código de ticket"
              placeholder="TKT-8F2A1C"
              autoFocus
              className="font-mono uppercase text-lg tracking-wider"
              value={codigoBusqueda}
              onChange={(e) => setCodigoBusqueda(e.target.value)}
            />
          </div>
          <Boton
            type="submit"
            variante="primario"
            cargando={buscando}
            className="w-full sm:w-auto px-8"
          >
            Buscar
          </Boton>
        </div>
      </form>

      {/* Mensajes de resultado global */}
      {mensajeExito && (
        <Aviso tipo="exito" mensaje={mensajeExito} />
      )}

      {mensajeError && (
        <Aviso tipo="error" mensaje={mensajeError} />
      )}

      {/* Tarjeta del Ticket Encontrado */}
      {ticketEncontrado && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-titulo text-slate-900 dark:text-slate-100">
                {ticketEncontrado.eventName}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-marca-600 dark:text-marca-400">
                  {ticketEncontrado.type}
                </span>{' '}
                · Titular: {ticketEncontrado.userEmail}
              </p>
            </div>
            <Badge tono={ticketEncontrado.status} />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold">
                Código
              </span>
              <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {ticketEncontrado.ticketCode}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold">
                Evento
              </span>
              <p className="font-mono text-slate-800 dark:text-slate-200">
                {ticketEncontrado.eventCode}
              </p>
            </div>
          </div>

          {ticketEncontrado.status === 'PAID' && (
            <div className="pt-2">
              <Boton
                type="button"
                variante="primario"
                cargando={mutacionUsar.isPending}
                onClick={handleMarcarComoUsado}
                className="w-full text-base py-3"
              >
                Marcar como usado
              </Boton>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
