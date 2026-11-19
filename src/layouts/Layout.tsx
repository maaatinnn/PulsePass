import { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { clsx } from 'clsx'
import { useAuth } from '../funcionalidades/auth/AuthContext'
import { RUTAS } from '../lib/rutas'
import { IconoNota, IconoMenu, IconoCerrar } from '../componentes/Iconos'
import { Aviso } from '../componentes/Aviso'

export default function Layout() {
  const { sesion, cerrarSesion, tieneRol } = useAuth()
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false)
  const [menuAdminAbierto, setMenuAdminAbierto] = useState(false)
  const [toastExpirado, setToastExpirado] = useState(false)
  const [modoOscuro, setModoOscuro] = useState(() => {
    try {
      const temaGuardado = typeof localStorage !== 'undefined' ? localStorage.getItem('pulsepass_theme') : null
      if (temaGuardado) return temaGuardado === 'dark'
      return typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
    } catch {
      return false
    }
  })

  const usuarioMenuRef = useRef<HTMLDivElement>(null)
  const adminMenuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const enRutaAdmin = pathname.startsWith('/admin')

  useEffect(() => {
    try {
      if (modoOscuro) {
        document.documentElement.classList.add('dark')
        if (typeof localStorage !== 'undefined') localStorage.setItem('pulsepass_theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        if (typeof localStorage !== 'undefined') localStorage.setItem('pulsepass_theme', 'light')
      }
    } catch {
      // noop
    }
  }, [modoOscuro])

  useEffect(() => {
    const handleExpirada = () => {
      setToastExpirado(true)
      navigate(RUTAS.login, { state: { motivo: 'expirada' } })
    }
    window.addEventListener('pulsepass_sesion_expirada', handleExpirada)
    return () => {
      window.removeEventListener('pulsepass_sesion_expirada', handleExpirada)
    }
  }, [navigate])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        usuarioMenuRef.current &&
        !usuarioMenuRef.current.contains(e.target as Node)
      ) {
        setMenuUsuarioAbierto(false)
      }
      if (
        adminMenuRef.current &&
        !adminMenuRef.current.contains(e.target as Node)
      ) {
        setMenuAdminAbierto(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuAdminAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
      isActive
        ? 'text-marca-600 bg-marca-50 dark:bg-marca-950/50 dark:text-marca-400 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800',
    )

  const inicial =
    sesion.estado === 'autenticado'
      ? sesion.usuario.username.charAt(0).toUpperCase()
      : 'U'

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Enlace accesible de salto al contenido */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-marca-600 focus:px-4 focus:py-2 focus:text-white focus:outline-none"
      >
        Saltar al contenido
      </a>

      {/* Header Sticky */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo y Enlaces Base */}
          <div className="flex items-center gap-6 md:gap-8">
            <NavLink
              to={RUTAS.inicio}
              end
              className="flex items-center gap-2.5 font-bold font-titulo text-xl text-slate-900 dark:text-slate-100 focus-visible:outline-2 focus-visible:outline-marca-600 rounded-lg"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-marca-600 text-white shadow-xs">
                <IconoNota className="h-5 w-5" />
              </div>
              <span>PulsePass</span>
            </NavLink>

            <nav
              aria-label="Principal"
              className="hidden md:flex items-center gap-1"
            >
              <NavLink to={RUTAS.eventos} className={navLinkClass}>
                Eventos
              </NavLink>
              <NavLink to={RUTAS.artistas} className={navLinkClass}>
                Artistas
              </NavLink>
              <NavLink to={RUTAS.sedes} className={navLinkClass}>
                Sedes
              </NavLink>

              {/* Enlaces según rol */}
              {sesion.estado === 'autenticado' && tieneRol('USER') && (
                <NavLink to={RUTAS.misTickets} className={navLinkClass}>
                  Mis tickets
                </NavLink>
              )}

              {sesion.estado === 'autenticado' && (tieneRol('STAFF') || tieneRol('ADMIN')) && (
                <>
                  <NavLink to={RUTAS.staffValidacion} className={navLinkClass}>
                    Validar ingreso
                  </NavLink>
                  <NavLink
                    to={RUTAS.staffTicketsPagados('CMF-2026')}
                    className={navLinkClass}
                  >
                    Tickets pagados
                  </NavLink>
                </>
              )}

              {sesion.estado === 'autenticado' && tieneRol('ADMIN') && (
                <div className="relative" ref={adminMenuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuAdminAbierto((prev) => !prev)}
                    aria-expanded={menuAdminAbierto}
                    aria-haspopup="true"
                    className={clsx(
                      navLinkClass({ isActive: enRutaAdmin }),
                      'inline-flex items-center gap-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-marca-600',
                    )}
                  >
                    Administrar
                    <span aria-hidden="true" className="text-xs">▾</span>
                  </button>

                  {menuAdminAbierto && (
                    <div
                      role="menu"
                      className="absolute left-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 p-1 shadow-lg border border-slate-200 dark:border-slate-800"
                    >
                      {[
                        { to: RUTAS.adminEventos, texto: 'Administrar eventos' },
                        { to: RUTAS.adminArtistas, texto: 'Administrar artistas' },
                        { to: RUTAS.adminSedes, texto: 'Administrar sedes' },
                      ].map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          role="menuitem"
                          onClick={() => setMenuAdminAbierto(false)}
                          className={({ isActive }) =>
                            clsx(
                              'block px-4 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800',
                              isActive
                                ? 'font-semibold text-marca-600 dark:text-marca-400'
                                : 'text-slate-700 dark:text-slate-200',
                            )
                          }
                        >
                          {item.texto}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </nav>
          </div>

          {/* Extremo derecho: Switch tema + Acciones de usuario */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModoOscuro((prev) => !prev)}
              aria-label={modoOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-marca-600 cursor-pointer"
            >
              {modoOscuro ? '☀️' : '🌙'}
            </button>

            {/* Anónimo */}
            {sesion.estado === 'anonimo' && (
              <div className="hidden md:flex items-center gap-2">
                <NavLink
                  to={RUTAS.login}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                >
                  Ingresar
                </NavLink>
                <NavLink
                  to={RUTAS.registro}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-marca-600 hover:bg-marca-700 text-white shadow-xs transition-colors"
                >
                  Registrarse
                </NavLink>
              </div>
            )}

            {/* Autenticado: Menú de usuario con Avatar */}
            {sesion.estado === 'autenticado' && (
              <div className="relative hidden md:block" ref={usuarioMenuRef}>
                <button
                  type="button"
                  onClick={() => setMenuUsuarioAbierto((prev) => !prev)}
                  aria-expanded={menuUsuarioAbierto}
                  aria-haspopup="true"
                  className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 p-1.5 pr-3 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-marca-600 cursor-pointer"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-marca-100 text-marca-700 dark:bg-marca-950 dark:text-marca-300 text-xs font-bold">
                    {inicial}
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {sesion.usuario.username}
                  </span>
                  <span className="text-xs text-slate-400">▾</span>
                </button>

                {menuUsuarioAbierto && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 p-1 shadow-lg border border-slate-200 dark:border-slate-800 py-1"
                  >
                    <NavLink
                      to={RUTAS.cuenta}
                      role="menuitem"
                      onClick={() => setMenuUsuarioAbierto(false)}
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                      Mi cuenta
                    </NavLink>
                    {tieneRol('USER') && (
                      <NavLink
                        to={RUTAS.misTickets}
                        role="menuitem"
                        onClick={() => setMenuUsuarioAbierto(false)}
                        className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                      >
                        Mis tickets
                      </NavLink>
                    )}
                    <hr className="my-1 border-slate-100 dark:border-slate-800" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuUsuarioAbierto(false)
                        cerrarSesion()
                        navigate(RUTAS.inicio)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer"
                    >
                      Salir
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Botón hamburguesa móvil */}
            <button
              type="button"
              onClick={() => setMenuMovilAbierto((prev) => !prev)}
              aria-expanded={menuMovilAbierto}
              aria-label={menuMovilAbierto ? 'Cerrar menú' : 'Abrir menú principal'}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              {menuMovilAbierto ? (
                <IconoCerrar className="h-6 w-6" />
              ) : (
                <IconoMenu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Menú móvil desplegable */}
        {menuMovilAbierto && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-3">
            <nav className="flex flex-col gap-1">
              <NavLink
                to={RUTAS.eventos}
                onClick={() => setMenuMovilAbierto(false)}
                className={navLinkClass}
              >
                Eventos
              </NavLink>
              <NavLink
                to={RUTAS.artistas}
                onClick={() => setMenuMovilAbierto(false)}
                className={navLinkClass}
              >
                Artistas
              </NavLink>
              <NavLink
                to={RUTAS.sedes}
                onClick={() => setMenuMovilAbierto(false)}
                className={navLinkClass}
              >
                Sedes
              </NavLink>

              {sesion.estado === 'autenticado' && tieneRol('USER') && (
                <NavLink
                  to={RUTAS.misTickets}
                  onClick={() => setMenuMovilAbierto(false)}
                  className={navLinkClass}
                >
                  Mis tickets
                </NavLink>
              )}

              {sesion.estado === 'autenticado' && (tieneRol('STAFF') || tieneRol('ADMIN')) && (
                <>
                  <NavLink
                    to={RUTAS.staffValidacion}
                    onClick={() => setMenuMovilAbierto(false)}
                    className={navLinkClass}
                  >
                    Validar ingreso
                  </NavLink>
                  <NavLink
                    to={RUTAS.staffTicketsPagados('CMF-2026')}
                    onClick={() => setMenuMovilAbierto(false)}
                    className={navLinkClass}
                  >
                    Tickets pagados
                  </NavLink>
                </>
              )}

              {sesion.estado === 'autenticado' && tieneRol('ADMIN') && (
                <>
                  <NavLink
                    to={RUTAS.adminEventos}
                    onClick={() => setMenuMovilAbierto(false)}
                    className={navLinkClass}
                  >
                    Administrar eventos
                  </NavLink>
                  <NavLink
                    to={RUTAS.adminArtistas}
                    onClick={() => setMenuMovilAbierto(false)}
                    className={navLinkClass}
                  >
                    Administrar artistas
                  </NavLink>
                  <NavLink
                    to={RUTAS.adminSedes}
                    onClick={() => setMenuMovilAbierto(false)}
                    className={navLinkClass}
                  >
                    Administrar sedes
                  </NavLink>
                </>
              )}
            </nav>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              {sesion.estado === 'anonimo' ? (
                <div className="flex flex-col gap-2">
                  <NavLink
                    to={RUTAS.login}
                    onClick={() => setMenuMovilAbierto(false)}
                    className="w-full text-center py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium"
                  >
                    Ingresar
                  </NavLink>
                  <NavLink
                    to={RUTAS.registro}
                    onClick={() => setMenuMovilAbierto(false)}
                    className="w-full text-center py-2.5 rounded-lg bg-marca-600 text-white text-sm font-medium shadow-xs"
                  >
                    Registrarse
                  </NavLink>
                </div>
              ) : sesion.estado === 'autenticado' ? (
                <div className="flex flex-col gap-2">
                  <NavLink
                    to={RUTAS.cuenta}
                    onClick={() => setMenuMovilAbierto(false)}
                    className="py-2 text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Mi cuenta ({sesion.usuario.username})
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuMovilAbierto(false)
                      cerrarSesion()
                      navigate(RUTAS.inicio)
                    }}
                    className="w-full text-left py-2 text-sm font-medium text-red-600"
                  >
                    Cerrar sesión
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </header>

      {/* Alerta de sesión expirada flotante */}
      {toastExpirado && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
          <Aviso
            tipo="advertencia"
            titulo="Sesión expirada"
            mensaje="Tu sesión expiró. Inicia sesión de nuevo."
            onCerrar={() => setToastExpirado(false)}
          />
        </div>
      )}

      {/* Contenido Principal */}
      <main id="contenido" className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-sm text-slate-500 dark:text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 PulsePass · Caso de estudio académico</p>
          <div className="flex items-center gap-6">
            <NavLink to={RUTAS.sedes} className="hover:text-slate-900 dark:hover:text-slate-100">
              Sedes
            </NavLink>
            <NavLink to={RUTAS.artistas} className="hover:text-slate-900 dark:hover:text-slate-100">
              Artistas
            </NavLink>
          </div>
        </div>
      </footer>
    </div>
  )
}
