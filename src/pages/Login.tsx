import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RUTAS } from '../lib/rutas'
import { LoginSchema, type LoginForm } from '../funcionalidades/auth/tipos'
import { useLogin } from '../funcionalidades/auth/hooks'
import { Boton } from '../componentes/Boton'
import { Campo } from '../componentes/Campo'
import { Aviso } from '../componentes/Aviso'
import { IconoNota, IconoOjo, IconoOjoCerrado } from '../componentes/Iconos'
import { ApiError } from '../lib/http'

export default function Login() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [errorLogin, setErrorLogin] = useState<string | null>(null)

  const estadoOrigen = location.state as { registrado?: boolean; motivo?: string; desde?: string } | null
  const avisoRegistrado = estadoOrigen?.registrado
  const avisoExpirada = estadoOrigen?.motivo === 'expirada'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  })

  const mutacionLogin = useLogin()

  const onSubmit = async (data: LoginForm) => {
    setErrorLogin(null)
    try {
      await mutacionLogin.mutateAsync(data)
      const rutaDestino = estadoOrigen?.desde || RUTAS.inicio
      navigate(rutaDestino, { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setErrorLogin('Credenciales inválidas.')
      } else if (err instanceof ApiError) {
        setErrorLogin(err.message)
      } else {
        setErrorLogin('Inténtalo más tarde.')
      }
    }
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-marca-600 text-white shadow-xs">
            <IconoNota className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold font-titulo text-slate-900 dark:text-slate-100">
            Inicia sesión
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ingresa a tu cuenta de PulsePass
          </p>
        </div>

        {avisoRegistrado && (
          <Aviso
            tipo="exito"
            mensaje="Cuenta creada, inicia sesión."
          />
        )}

        {avisoExpirada && (
          <Aviso
            tipo="advertencia"
            mensaje="Tu sesión expiró. Inicia sesión de nuevo."
          />
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Campo
            etiqueta="Usuario o correo"
            autoComplete="username"
            placeholder="andrea o tu@email.com"
            error={errors.identifier?.message}
            {...register('identifier')}
          />

          <div className="relative">
            <Campo
              etiqueta="Contraseña"
              type={mostrarPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••••••"
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

          {errorLogin && (
            <Aviso tipo="error" mensaje={errorLogin} />
          )}

          <div className="pt-2">
            <Boton
              type="submit"
              variante="primario"
              cargando={mutacionLogin.isPending}
              className="w-full"
            >
              Ingresar
            </Boton>
          </div>
        </form>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          ¿No tienes cuenta?{' '}
          <Link
            to={RUTAS.registro}
            className="font-semibold text-marca-600 hover:text-marca-700 dark:text-marca-400"
          >
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}
