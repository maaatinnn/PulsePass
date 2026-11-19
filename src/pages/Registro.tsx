import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clsx } from 'clsx'
import { RUTAS } from '../lib/rutas'
import { RegisterSchema, type RegisterForm } from '../funcionalidades/auth/tipos'
import { useRegistrarUsuario } from '../funcionalidades/auth/hooks'
import { Boton } from '../componentes/Boton'
import { Campo } from '../componentes/Campo'
import { Aviso } from '../componentes/Aviso'
import { IconoNota, IconoOjo, IconoOjoCerrado } from '../componentes/Iconos'
import { ApiError } from '../lib/http'

export default function Registro() {
  const navigate = useNavigate()
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      birthDate: '',
      password: '',
    },
  })

  const passwordValue = watch('password') || ''

  const fortaleza = useMemo(() => {
    if (!passwordValue) return { nivel: 0, etiqueta: '' }
    let puntos = 0
    if (passwordValue.length >= 12) puntos += 1
    if (/[A-Z]/.test(passwordValue) && /[a-z]/.test(passwordValue)) puntos += 1
    if (/[0-9]/.test(passwordValue)) puntos += 1
    if (/[^A-Za-z0-9]/.test(passwordValue)) puntos += 1

    if (puntos <= 1) return { nivel: 1, etiqueta: 'débil', color: 'bg-red-500' }
    if (puntos <= 3) return { nivel: 2, etiqueta: 'media', color: 'bg-amber-500' }
    return { nivel: 3, etiqueta: 'fuerte', color: 'bg-emerald-500' }
  }, [passwordValue])

  const mutacionRegistro = useRegistrarUsuario()

  const onSubmit = async (data: RegisterForm) => {
    setErrorGeneral(null)
    try {
      await mutacionRegistro.mutateAsync(data)
      navigate(RUTAS.login, { state: { registrado: true } })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setErrorGeneral('El usuario o correo ya está registrado.')
        } else if (err.status === 400 && err.details) {
          Object.entries(err.details).forEach(([campo, mensaje]) => {
            setError(campo as keyof RegisterForm, { message: mensaje })
          })
        } else {
          setErrorGeneral(err.message)
        }
      } else {
        setErrorGeneral('Ocurrió un error inesperado al crear la cuenta.')
      }
    }
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-marca-600 text-white shadow-xs">
            <IconoNota className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold font-titulo text-slate-900 dark:text-slate-100">
            Crea tu cuenta
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Regístrate para comprar entradas y vivir la música
          </p>
        </div>

        {errorGeneral && <Aviso tipo="error" mensaje={errorGeneral} />}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Campo
            etiqueta="Nombre de usuario"
            placeholder="andrea"
            autoComplete="username"
            error={errors.username?.message}
            {...register('username')}
          />

          <Campo
            etiqueta="Correo electrónico"
            type="email"
            placeholder="andrea@pulsepass.test"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo
              etiqueta="Nombres"
              placeholder="Andrea"
              autoComplete="given-name"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Campo
              etiqueta="Apellidos"
              placeholder="Ruiz"
              autoComplete="family-name"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <Campo
            etiqueta="Fecha de nacimiento"
            type="date"
            error={errors.birthDate?.message}
            {...register('birthDate')}
          />

          <div className="space-y-2">
            <div className="relative">
              <Campo
                etiqueta="Contraseña (mín. 12 caracteres)"
                type={mostrarPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Mínimo 12 caracteres"
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setMostrarPassword((prev) => !prev)}
                className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {mostrarPassword ? (
                  <IconoOjoCerrado className="h-5 w-5" />
                ) : (
                  <IconoOjo className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Indicador de Fortaleza */}
            {passwordValue && (
              <div className="space-y-1.5 pt-1">
                <div className="flex gap-1.5 h-1.5">
                  <div
                    className={clsx(
                      'flex-1 rounded-full transition-colors',
                      fortaleza.nivel >= 1 ? fortaleza.color : 'bg-slate-200 dark:bg-slate-700',
                    )}
                  />
                  <div
                    className={clsx(
                      'flex-1 rounded-full transition-colors',
                      fortaleza.nivel >= 2 ? fortaleza.color : 'bg-slate-200 dark:bg-slate-700',
                    )}
                  />
                  <div
                    className={clsx(
                      'flex-1 rounded-full transition-colors',
                      fortaleza.nivel >= 3 ? fortaleza.color : 'bg-slate-200 dark:bg-slate-700',
                    )}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Fortaleza: <span className="font-medium">{fortaleza.etiqueta}</span>
                </p>
              </div>
            )}
          </div>

          <div className="pt-3">
            <Boton
              type="submit"
              variante="primario"
              cargando={mutacionRegistro.isPending}
              className="w-full"
            >
              Crear cuenta
            </Boton>
          </div>
        </form>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          ¿Ya tienes cuenta?{' '}
          <Link
            to={RUTAS.login}
            className="font-semibold text-marca-600 hover:text-marca-700 dark:text-marca-400"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
