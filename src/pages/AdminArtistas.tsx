import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RUTAS } from '../lib/rutas'
import { ApiError } from '../lib/http'
import {
  CreateArtistSchema,
  type ArtistResponse,
  type CreateArtistForm,
} from '../funcionalidades/artistas/tipos'
import {
  useArtistasAdmin,
  useCrearArtista,
  useEliminarArtista,
} from '../funcionalidades/artistas/hooks'
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

export default function AdminArtistas() {
  const navigate = useNavigate()
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false)
  const [errorCrear, setErrorCrear] = useState<string | null>(null)
  const [artistaAEliminar, setArtistaAEliminar] = useState<ArtistResponse | null>(null)
  const [aviso, setAviso] = useState<AvisoEstado | null>(null)

  const { data: artistas, isLoading, isError, error, refetch } = useArtistasAdmin()
  const mutacionCrear = useCrearArtista()
  const mutacionEliminar = useEliminarArtista()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateArtistForm>({
    resolver: zodResolver(CreateArtistSchema),
    defaultValues: { stageName: '', country: '', genre: '' },
  })

  const abrirModalCrear = () => {
    reset()
    setErrorCrear(null)
    setModalCrearAbierto(true)
  }

  const cerrarModalCrear = () => {
    setModalCrearAbierto(false)
  }

  const onSubmit = async (data: CreateArtistForm) => {
    setErrorCrear(null)
    setAviso(null)
    try {
      const nuevo = await mutacionCrear.mutateAsync(data)
      setModalCrearAbierto(false)
      setAviso({ tipo: 'exito', mensaje: `Artista «${nuevo.stageName}» creado con éxito.` })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) {
          navigate(RUTAS.sinPermisos)
          return
        }
        if (err.status === 400 && Object.keys(err.details).length > 0) {
          Object.entries(err.details).forEach(([campo, mensaje]) => {
            setError(campo as keyof CreateArtistForm, { message: mensaje })
          })
        } else if (err.status === 409) {
          setErrorCrear(`Ya existe un artista con el nombre «${data.stageName.trim()}».`)
        } else {
          setErrorCrear(err.message)
        }
      } else {
        setErrorCrear('Ocurrió un error inesperado al crear el artista.')
      }
    }
  }

  const handleConfirmarEliminar = async () => {
    if (!artistaAEliminar) return
    const objetivo = artistaAEliminar
    setAviso(null)
    try {
      await mutacionEliminar.mutateAsync(objetivo.id)
      setAviso({ tipo: 'exito', mensaje: `Artista «${objetivo.stageName}» eliminado.` })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) {
          navigate(RUTAS.sinPermisos)
          return
        }
        if (err.status === 409) {
          setAviso({
            tipo: 'error',
            mensaje: `No se puede eliminar a «${objetivo.stageName}» porque está asociado a uno o más eventos.`,
          })
        } else if (err.status === 404) {
          setAviso({ tipo: 'error', mensaje: `El artista «${objetivo.stageName}» ya no existe.` })
          refetch()
        } else {
          setAviso({ tipo: 'error', mensaje: err.message })
        }
      } else {
        setAviso({ tipo: 'error', mensaje: 'No se pudo eliminar el artista.' })
      }
    } finally {
      setArtistaAEliminar(null)
    }
  }

  const columnas: Columna<ArtistResponse>[] = [
    {
      encabezado: 'Artista',
      celda: (a) => (
        <Link
          to={RUTAS.detalleArtista(a.id)}
          className="font-semibold text-slate-900 dark:text-slate-100 hover:text-marca-600 dark:hover:text-marca-400 transition-colors"
        >
          {a.stageName}
        </Link>
      ),
    },
    { encabezado: 'País', celda: (a) => a.country || '—' },
    { encabezado: 'Género', celda: (a) => a.genre || '—' },
    {
      encabezado: 'Estado',
      celda: (a) => <Badge tono={a.active ? 'Activa' : 'Inactiva'} texto={a.active ? 'Activo' : 'Inactivo'} />,
    },
    {
      encabezado: 'Acciones',
      className: 'text-right',
      celda: (a) => (
        <Boton
          type="button"
          variante="peligro"
          className="text-xs"
          aria-label={`Eliminar ${a.stageName}`}
          onClick={() => setArtistaAEliminar(a)}
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
            Administración de artistas
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Crea y elimina los artistas que pueden asociarse a los eventos
          </p>
        </div>

        <Boton type="button" variante="primario" className="w-full sm:w-auto" onClick={abrirModalCrear}>
          + Nuevo artista
        </Boton>
      </div>

      {aviso && (
        <Aviso tipo={aviso.tipo} mensaje={aviso.mensaje} onCerrar={() => setAviso(null)} />
      )}

      {isLoading && <Cargando filas={5} tipo="tabla" mensaje="Cargando artistas..." />}

      {isError && (
        <EstadoError
          mensaje={(error as Error)?.message || 'No se pudieron cargar los artistas.'}
          onReintentar={() => refetch()}
        />
      )}

      {!isLoading && !isError && artistas && artistas.length === 0 && (
        <EstadoVacio
          icono="🎤"
          titulo="Aún no hay artistas"
          mensaje="Crea el primer artista para poder asociarlo a un evento."
          accion={
            <Boton type="button" variante="primario" onClick={abrirModalCrear}>
              + Nuevo artista
            </Boton>
          }
        />
      )}

      {!isLoading && !isError && artistas && artistas.length > 0 && (
        <>
          {/* Vista Escritorio: Tabla */}
          <div className="hidden md:block">
            <Tabla<ArtistResponse>
              columnas={columnas}
              filas={artistas}
              keyExtractor={(a) => a.id}
            />
          </div>

          {/* Vista Móvil: Tarjetas */}
          <div className="md:hidden space-y-4">
            {artistas.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      to={RUTAS.detalleArtista(a.id)}
                      className="font-semibold text-slate-900 dark:text-slate-100"
                    >
                      {a.stageName}
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {[a.genre, a.country].filter(Boolean).join(' · ') || 'Sin género ni país'}
                    </p>
                  </div>
                  <Badge tono={a.active ? 'Activa' : 'Inactiva'} texto={a.active ? 'Activo' : 'Inactivo'} />
                </div>
                <Boton
                  type="button"
                  variante="peligro"
                  className="w-full text-xs"
                  aria-label={`Eliminar ${a.stageName}`}
                  onClick={() => setArtistaAEliminar(a)}
                >
                  Eliminar
                </Boton>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal Crear artista */}
      <Modal abierto={modalCrearAbierto} titulo="Nuevo artista" onCerrar={cerrarModalCrear}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {errorCrear && <Aviso tipo="error" mensaje={errorCrear} />}

          <Campo
            etiqueta="Nombre artístico"
            placeholder="Solar Beat"
            error={errors.stageName?.message}
            {...register('stageName')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo
              etiqueta="País (opcional)"
              placeholder="Colombia"
              error={errors.country?.message}
              {...register('country')}
            />
            <Campo
              etiqueta="Género (opcional)"
              placeholder="Electrónica"
              error={errors.genre?.message}
              {...register('genre')}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Boton type="button" variante="secundario" onClick={cerrarModalCrear}>
              Cancelar
            </Boton>
            <Boton type="submit" variante="primario" cargando={mutacionCrear.isPending}>
              Crear artista
            </Boton>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmar eliminación */}
      <Modal
        abierto={artistaAEliminar !== null}
        titulo="Eliminar artista"
        onCerrar={() => setArtistaAEliminar(null)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            ¿Confirmas la eliminación del artista{' '}
            <strong className="text-slate-900 dark:text-slate-100">
              {artistaAEliminar?.stageName}
            </strong>
            ? Esta acción no se puede deshacer. Si el artista está asociado a algún evento, no
            podrá eliminarse.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Boton type="button" variante="secundario" onClick={() => setArtistaAEliminar(null)}>
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
