import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../funcionalidades/auth/AuthContext'
import { RUTAS } from '../lib/rutas'
import { Cargando } from '../componentes/Cargando'

export default function SoloAnonimo() {
  const { sesion } = useAuth()

  if (sesion.estado === 'cargando') {
    return <Cargando mensaje="Comprobando sesión..." />
  }

  if (sesion.estado === 'autenticado') {
    return <Navigate to={RUTAS.inicio} replace />
  }

  return <Outlet />
}
