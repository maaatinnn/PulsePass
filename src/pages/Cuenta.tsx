import { Link, useNavigate } from 'react-router'
import { RUTAS } from '../lib/rutas'
import { formatearFecha } from '../lib/formato'
import { useAuth } from '../funcionalidades/auth/AuthContext'
import { useUsuarioPorEmail, useUsuarioPorUsername } from '../funcionalidades/usuarios/hooks'
import { Badge } from '../componentes/Badge'
import { Boton } from '../componentes/Boton'
import { Cargando } from '../componentes/Cargando'
import { EstadoError } from '../componentes/EstadoError'

export default function Cuenta() {
  const { sesion, cerrarSesion, tieneRol } = useAuth()
  const navigate = useNavigate()

  const email = sesion.estado === 'autenticado' ? sesion.usuario.email : undefined

  const username = sesion.estado === 'autenticado' ? sesion.usuario.username : undefined

  const porEmail = useUsuarioPorEmail(email)
  // Respaldo: si la consulta por email falla se intenta por username (solo la identidad propia).
  const porUsername = useUsuarioPorUsername(porEmail.isError ? username : undefined)

  const usuarioDetalle = porEmail.data ?? porUsername.data
  const isLoading = porEmail.isLoading || (porEmail.isError && porUsername.isLoading)
  const isError = porEmail.isError && porUsername.isError
  const error = porUsername.error ?? porEmail.error
  const refetch = () => {
    void porEmail.refetch()
  }

  if (sesion.estado !== 'autenticado') {
    return null
  }

  const inicial = sesion.usuario.username.charAt(0).toUpperCase()
  const rolPrincipal = sesion.usuario.roles[0] || 'USER'

  const handleCerrarSesion = () => {
    cerrarSesion()
    navigate(RUTAS.inicio)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6">
      <h1 className="text-3xl font-bold font-titulo text-slate-900 dark:text-slate-100">
        Mi cuenta
      </h1>

      {isLoading && <Cargando filas={2} tipo="lineas" mensaje="Cargando perfil..." />}

      {isError && (
        <EstadoError
          mensaje={(error as Error)?.message || 'No se pudo cargar la información del usuario.'}
          onReintentar={() => refetch()}
        />
      )}

      {!isLoading && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xs space-y-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-marca-600 text-white text-3xl font-bold font-titulo shadow-xs">
              {inicial}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <h2 className="text-2xl font-bold font-titulo text-slate-900 dark:text-slate-100">
                  {usuarioDetalle
                    ? `${usuarioDetalle.firstName} ${usuarioDetalle.lastName}`
                    : sesion.usuario.username}
                </h2>
                <Badge tono={rolPrincipal} />
                <Badge tono="Activa" />
              </div>

              <p className="text-sm font-mono text-slate-500 dark:text-slate-400">
                @{sesion.usuario.username} · {sesion.usuario.email}
              </p>

              {usuarioDetalle?.birthDate && (
                <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                  Nacimiento: {formatearFecha(usuarioDetalle.birthDate)}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            {tieneRol('USER') && (
              <Link to={RUTAS.misTickets}>
                <Boton variante="primario">Ver mis tickets</Boton>
              </Link>
            )}

            <Boton
              type="button"
              variante="secundario"
              onClick={handleCerrarSesion}
              className="ml-auto"
            >
              Cerrar sesión
            </Boton>
          </div>
        </div>
      )}
    </div>
  )
}
