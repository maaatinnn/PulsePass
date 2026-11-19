import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RUTAS } from '../lib/rutas'
import {
  CreateEventSchema,
  type CreateEventForm,
  type EventCategory,
} from '../funcionalidades/eventos/tipos'
import { useCrearEvento } from '../funcionalidades/eventos/hooks'
import { useSedesActivas } from '../funcionalidades/sedes/hooks'
import { guardarEventoCreadoEnSesion } from '../funcionalidades/admin/utils'
import { Boton } from '../componentes/Boton'
import { Campo } from '../componentes/Campo'
import { Selector } from '../componentes/Selector'
import { Aviso } from '../componentes/Aviso'
import { ApiError } from '../lib/http'

const CATEGORIAS: EventCategory[] = [
  'MUSIC',
  'SPORTS',
  'TECHNOLOGY',
  'EDUCATION',
  'CULTURE',
  'ENTERTAINMENT',
]

export default function AdminCrearEvento() {
  const navigate = useNavigate()
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)

  const { data: sedes } = useSedesActivas()
  const mutacionCrear = useCrearEvento()

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<CreateEventForm>({
    resolver: zodResolver(CreateEventSchema),
    defaultValues: {
      eventCode: '',
      name: '',
      description: '',
      category: 'MUSIC',
      eventDate: '',
      minimumAge: 18,
      venueCode: '',
    },
  })

  const descriptionValue = watch('description') || ''

  const onSubmit = async (data: CreateEventForm) => {
    setErrorGeneral(null)
    try {
      // Formatear eventDate si viene de datetime-local a ISO si es necesario
      const payload = {
        ...data,
        eventCode: data.eventCode.trim().toUpperCase(),
      }
      const nuevoEvento = await mutacionCrear.mutateAsync(payload)

      guardarEventoCreadoEnSesion({
        eventCode: nuevoEvento.eventCode,
        name: nuevoEvento.name,
        status: nuevoEvento.status as 'DRAFT' | 'PUBLISHED',
      })

      navigate(RUTAS.adminGestionEvento(nuevoEvento.eventCode))
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) {
          navigate(RUTAS.sinPermisos)
          return
        }
        if (err.status === 400 && err.details) {
          Object.entries(err.details).forEach(([campo, mensaje]) => {
            setError(campo as keyof CreateEventForm, { message: mensaje })
          })
        } else {
          setErrorGeneral(err.message)
        }
      } else {
        setErrorGeneral('Ocurrió un error inesperado al crear el evento.')
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

      <div>
        <h1 className="text-3xl font-bold font-titulo text-slate-900 dark:text-slate-100">
          Nuevo evento
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Ingresa los detalles básicos para registrar un nuevo evento en estado borrador (DRAFT)
        </p>
      </div>

      {errorGeneral && <Aviso tipo="error" mensaje={errorGeneral} />}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-6"
        noValidate
      >
        <Campo
          etiqueta="Código del evento"
          placeholder="CMF-2026"
          className="font-mono uppercase"
          error={errors.eventCode?.message}
          {...register('eventCode')}
        />

        <Campo
          etiqueta="Nombre"
          placeholder="Caribbean Music Fest 2026"
          error={errors.name?.message}
          {...register('name')}
        />

        <div className="flex flex-col gap-1.5 w-full">
          <div className="flex justify-between items-center">
            <label
              htmlFor="description-input"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Descripción
            </label>
            <span className="text-xs text-slate-400">
              {descriptionValue.length}/500
            </span>
          </div>
          <textarea
            id="description-input"
            rows={4}
            placeholder="Tres noches de música caribeña frente a la bahía."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 p-3 text-sm focus-visible:outline-2 focus-visible:outline-marca-600"
            {...register('description')}
          />
          {errors.description && (
            <span role="alert" className="text-xs text-red-600">
              {errors.description.message}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Selector
            etiqueta="Categoría"
            error={errors.category?.message}
            {...register('category')}
          >
            {CATEGORIAS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Selector>

          <Campo
            etiqueta="Edad mínima"
            type="number"
            min={0}
            error={errors.minimumAge?.message}
            {...register('minimumAge')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo
            etiqueta="Fecha y hora"
            type="datetime-local"
            error={errors.eventDate?.message}
            {...register('eventDate')}
          />

          <Selector
            etiqueta="Sede"
            error={errors.venueCode?.message}
            {...register('venueCode')}
          >
            <option value="">Selecciona una sede</option>
            {sedes?.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name} ({s.code})
              </option>
            ))}
          </Selector>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <Link to={RUTAS.adminEventos}>
            <Boton type="button" variante="secundario">
              Cancelar
            </Boton>
          </Link>
          <Boton
            type="submit"
            variante="primario"
            cargando={mutacionCrear.isPending}
          >
            Crear evento
          </Boton>
        </div>
      </form>
    </div>
  )
}
