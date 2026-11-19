import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../funcionalidades/auth/AuthContext'
import type { Rol } from '../funcionalidades/auth/tipos'
import { RUTAS } from '../lib/rutas'
import { Cargando } from '../componentes/Cargando'

export interface RutaPorRolProps {
  roles: Rol[]
}

export default function RutaPorRol({ roles }: RutaPorRolProps) {
  const { sesion } = useAuth()
  const location = useLocation()

  if (sesion.estado === 'cargando') {
    return <Cargando mensaje="Verificando permisos..." />
  }

  if (sesion.estado === 'anonimo') {
    return <Navigate to={RUTAS.login} replace state={{ desde: location.pathname }} />
  }

  if (!roles.some((r) => sesion.usuario.roles.includes(r))) {
    return <Navigate to={RUTAS.sinPermisos} replace />
  }

  return <Outlet />
}
