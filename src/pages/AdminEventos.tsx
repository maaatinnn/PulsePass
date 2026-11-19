import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { RUTAS } from '../lib/rutas'
import { Boton } from '../componentes/Boton'
import { Campo } from '../componentes/Campo'
import { Badge } from '../componentes/Badge'
import { Aviso } from '../componentes/Aviso'
import { STORAGE_CREADOS } from '../funcionalidades/admin/utils'

export default function AdminEventos() {
  const navigate = useNavigate()
  const [codigoBusqueda, setCodigoBusqueda] = useState('')
  const [eventosSesion, setEventosSesion] = useState<
    Array<{ eventCode: string; name: string; status: 'DRAFT' | 'PUBLISHED' }>
  >([])

  useEffect(() => {
    try {
      const guardados = JSON.parse(
        sessionStorage.getItem(STORAGE_CREADOS) || '[]',
      )
      if (Array.isArray(guardados)) {
        setEventosSesion(guardados)
      }
    } catch {
      // noop
    }
  }, [])

  const handleAbrir = (e: FormEvent) => {
    e.preventDefault()
    const codigo = codigoBusqueda.trim()
    if (codigo) {
      navigate(RUTAS.adminGestionEvento(codigo))
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-titulo text-slate-900 dark:text-slate-100">
            Administración de eventos
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Crea, publica y asocia artistas a los eventos de la plataforma
          </p>
        </div>

        <Link to={RUTAS.adminCrearEvento}>
          <Boton variante="primario" className="w-full sm:w-auto">
            + Nuevo evento
          </Boton>
        </Link>
      </div>

      {/* Buscador por código */}
      <form
        onSubmit={handleAbrir}
        className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row items-end gap-3">
          <div className="flex-1 w-full">
            <Campo
              etiqueta="Buscar evento por código"
              placeholder="CMF-2026"
              className="font-mono uppercase text-base"
              value={codigoBusqueda}
              onChange={(e) => setCodigoBusqueda(e.target.value)}
            />
          </div>
          <Boton type="submit" variante="secundario" className="w-full sm:w-auto px-6">
            Abrir
          </Boton>
        </div>
      </form>

      {/* Creados en esta sesión */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold font-titulo text-slate-900 dark:text-slate-100">
          Creados en esta sesión
        </h2>

        {eventosSesion.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No has creado eventos durante esta sesión aún.
          </div>
        ) : (
          <div className="space-y-3">
            {eventosSesion.map((ev) => (
              <div
                key={ev.eventCode}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {ev.eventCode}
                    </span>
                    <span>·</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {ev.name}
                    </span>
                  </div>
                  <Badge tono={ev.status} />
                </div>

                <Link to={RUTAS.adminGestionEvento(ev.eventCode)}>
                  <Boton variante="secundario" className="text-xs">
                    Gestionar
                  </Boton>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nota de brecha GAP-01 */}
      <Aviso
        tipo="info"
        mensaje="Nota: la API no ofrece un listado completo de eventos (GAP-01)."
      />
    </div>
  )
}
