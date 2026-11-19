import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RUTAS } from '../lib/rutas'
import { ApiError } from '../lib/http'
import {
  CreateVenueSchema,
  type CreateVenueForm,
  type VenueResponse,
} from '../funcionalidades/sedes/tipos'
import {
  useSedesAdmin,
  useCrearSede,
  useEliminarSede,
} from '../funcionalidades/sedes/hooks'
import { Boton } from '../componentes/Boton'
import { Campo } from '../componentes/Campo'
import { Badge } from '../componentes/Badge'
import { Aviso } from '../componentes/Aviso'
import { Modal } from '../componentes/Modal'
import { Tabla, type Columna } from '../componentes/Tabla'
import { Cargando } from '../componentes/Cargando'
import { EstadoVacio } from '../componentes/EstadoVacio'
import { EstadoError } from '../componentes/EstadoError'

type AvisoEstado = { tipo: 'exito' | 'error'; mensaje: string }

export default function AdminSedes() {
  const navigate = useNavigate()
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false)
  const [errorCrear, setErrorCrear] = useState<string | null>(null)
  const [sedeAEliminar, setSedeAEliminar] = useState<VenueResponse | null>(null)
  const [aviso, setAviso] = useState<AvisoEstado | null>(null)

  const { data: sedes, isLoading, isError, error, refetch } = useSedesAdmin()
  const mutacionCrear = useCrearSede()
  const mutacionEliminar = useEliminarSede()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateVenueForm>({
    resolver: zodResolver(CreateVenueSchema),
    defaultValues: { code: '', name: '', city: '', address: '', capacity: undefined },
  })

  const abrirModalCrear = () => {
    reset()
    setErrorCrear(null)
    setModalCrearAbierto(true)
  }

  const cerrarModalCrear = () => {
    setModalCrearAbierto(false)
  }

  const onSubmit = async (data: CreateVenueForm) => {
    setErrorCrear(null)
    setAviso(null)
    const payload = { ...data, code: data.code.trim().toUpperCase() }
    try {
      const nueva = await mutacionCrear.mutateAsync(payload)
      setModalCrearAbierto(false)
      setAviso({ tipo: 'exito', mensaje: `Sede «${nueva.name}» creada con éxito.` })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) {
          navigate(RUTAS.sinPermisos)
          return
        }
        if (err.status === 400 && Object.keys(err.details).length > 0) {
          Object.entries(err.details).forEach(([campo, mensaje]) => {
            setError(campo as keyof CreateVenueForm, { message: mensaje })
          })
        } else if (err.status === 409) {
          setErrorCrear(`Ya existe una sede con el código «${payload.code}».`)
        } else {
          setErrorCrear(err.message)
        }
      } else {
        setErrorCrear('Ocurrió un error inesperado al crear la sede.')
      }
    }
  }

  const handleConfirmarEliminar = async () => {
    if (!sedeAEliminar) return
    const objetivo = sedeAEliminar
    setAviso(null)
    try {
      await mutacionEliminar.mutateAsync(objetivo.code)
      setAviso({ tipo: 'exito', mensaje: `Sede «${objetivo.name}» eliminada.` })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) {
          navigate(RUTAS.sinPermisos)
          return
        }
        if (err.status === 409) {
          setAviso({
            tipo: 'error',
            mensaje: `No se puede eliminar la sede «${objetivo.name}» porque tiene eventos asociados.`,
          })
        } else if (err.status === 404) {
          setAviso({ tipo: 'error', mensaje: `La sede «${objetivo.name}» ya no existe.` })
          refetch()
        } else {
          setAviso({ tipo: 'error', mensaje: err.message })
        }
      } else {
        setAviso({ tipo: 'error', mensaje: 'No se pudo eliminar la sede.' })
      }
    } finally {
      setSedeAEliminar(null)
    }
  }

  const columnas: Columna<VenueResponse>[] = [
    {
      encabezado: 'Código',
      celda: (s) => <span className="font-mono font-semibold">{s.code}</span>,
    },
    {
      encabezado: 'Sede',
      celda: (s) => (
        <Link
          to={RUTAS.detalleSede(s.code)}
          className="font-semibold text-slate-900 dark:text-slate-100 hover:text-marca-600 dark:hover:text-marca-400 transition-colors"
        >
          {s.name}
        </Link>
      ),
    },
    { encabezado: 'Ciudad', celda: (s) => s.city },
    {
      encabezado: 'Capacidad',
      celda: (s) => s.capacity.toLocaleString('es-CO'),
    },
    {
      encabezado: 'Estado',
      celda: (s) => <Badge tono={s.active ? 'Activa' : 'Inactiva'} />,
    },
    {
      encabezado: 'Acciones',
      className: 'text-right',
      celda: (s) => (
        <Boton
          type="button"
          variante="peligro"
          className="text-xs"
          aria-label={`Eliminar ${s.name}`}
          onClick={() => setSedeAEliminar(s)}
        >
          Eliminar
        </Boton>
      ),
    },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-titulo text-slate-900 dark:text-slate-100">
            Administración de sedes
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Crea y elimina los recintos donde se realizan los eventos
          </p>
        </div>

        <Boton type="button" variante="primario" className="w-full sm:w-auto" onClick={abrirModalCrear}>
          + Nueva sede
        </Boton>
      </div>

      {aviso && (
        <Aviso tipo={aviso.tipo} mensaje={aviso.mensaje} onCerrar={() => setAviso(null)} />
      )}

      {isLoading && <Cargando filas={5} tipo="tabla" mensaje="Cargando sedes..." />}

      {isError && (
        <EstadoError
          mensaje={(error as Error)?.message || 'No se pudieron cargar las sedes.'}
          onReintentar={() => refetch()}
        />
      )}

      {!isLoading && !isError && sedes && sedes.length === 0 && (
        <EstadoVacio
          icono="🏟️"
          titulo="Aún no hay sedes"
          mensaje="Crea la primera sede para poder programar eventos."
          accion={
            <Boton type="button" variante="primario" onClick={abrirModalCrear}>
              + Nueva sede
            </Boton>
          }
        />
      )}

      {!isLoading && !isError && sedes && sedes.length > 0 && (
        <>
          {/* Vista Escritorio: Tabla */}
          <div className="hidden md:block">
            <Tabla<VenueResponse>
              columnas={columnas}
              filas={sedes}
              keyExtractor={(s) => s.id}
            />
          </div>

          {/* Vista Móvil: Tarjetas */}
          <div className="md:hidden space-y-4">
            {sedes.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      to={RUTAS.detalleSede(s.code)}
                      className="font-semibold text-slate-900 dark:text-slate-100"
                    >
                      {s.name}
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono">{s.code}</span> · {s.city} ·{' '}
                      {s.capacity.toLocaleString('es-CO')} personas
                    </p>
                  </div>
                  <Badge tono={s.active ? 'Activa' : 'Inactiva'} />
                </div>
                <Boton
                  type="button"
                  variante="peligro"
                  className="w-full text-xs"
                  aria-label={`Eliminar ${s.name}`}
                  onClick={() => setSedeAEliminar(s)}
                >
                  Eliminar
                </Boton>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal Crear sede */}
      <Modal abierto={modalCrearAbierto} titulo="Nueva sede" onCerrar={cerrarModalCrear}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {errorCrear && <Aviso tipo="error" mensaje={errorCrear} />}

          <Campo
            etiqueta="Código de la sede"
            placeholder="VEN-SMR-01"
            className="font-mono uppercase"
            error={errors.code?.message}
            {...register('code')}
          />

          <Campo
            etiqueta="Nombre"
            placeholder="Marina Convention Center"
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo
              etiqueta="Ciudad"
              placeholder="Santa Marta"
              error={errors.city?.message}
              {...register('city')}
            />
            <Campo
              etiqueta="Capacidad"
              type="number"
              min={1}
              placeholder="500"
              error={errors.capacity?.message}
              {...register('capacity')}
            />
          </div>

          <Campo
            etiqueta="Dirección (opcional)"
            placeholder="Carrera 1 # 22-10"
            error={errors.address?.message}
            {...register('address')}
          />

          <div className="flex items-center justify-end gap-3 pt-3">
            <Boton type="button" variante="secundario" onClick={cerrarModalCrear}>
              Cancelar
            </Boton>
            <Boton type="submit" variante="primario" cargando={mutacionCrear.isPending}>
              Crear sede
            </Boton>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmar eliminación */}
      <Modal
        abierto={sedeAEliminar !== null}
        titulo="Eliminar sede"
        onCerrar={() => setSedeAEliminar(null)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            ¿Confirmas la eliminación de la sede{' '}
            <strong className="text-slate-900 dark:text-slate-100">{sedeAEliminar?.name}</strong>{' '}
            (<span className="font-mono">{sedeAEliminar?.code}</span>)? Esta acción no se puede
            deshacer. Si la sede tiene eventos asociados, no podrá eliminarse.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Boton type="button" variante="secundario" onClick={() => setSedeAEliminar(null)}>
              Cancelar
            </Boton>
            <Boton
              type="button"
              variante="peligro"
              cargando={mutacionEliminar.isPending}
              onClick={handleConfirmarEliminar}
            >
              Eliminar
            </Boton>
          </div>
        </div>
      </Modal>
    </div>
  )
}
