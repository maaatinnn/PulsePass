import { createBrowserRouter } from 'react-router'
import Layout from './layouts/Layout'
import RutaProtegida from './layouts/RutaProtegida'
import RutaPorRol from './layouts/RutaPorRol'
import SoloAnonimo from './layouts/SoloAnonimo'
import Inicio from './pages/Inicio'
import ErrorPagina from './pages/ErrorPagina'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPagina />,
    children: [
      {
        index: true,
        element: <Inicio />,
      },
      {
        path: 'eventos',
        children: [
          {
            index: true,
            lazy: async () => ({
              Component: (await import('./pages/CatalogoEventos')).default,
            }),
          },
          {
            path: ':eventCode',
            lazy: async () => ({
              Component: (await import('./pages/DetalleEvento')).default,
            }),
          },
        ],
      },
      {
        path: 'artistas',
        children: [
          {
            index: true,
            lazy: async () => ({
              Component: (await import('./pages/ListaArtistas')).default,
            }),
          },
          {
            path: ':id',
            lazy: async () => ({
              Component: (await import('./pages/DetalleArtista')).default,
            }),
          },
        ],
      },
      {
        path: 'sedes',
        children: [
          {
            index: true,
            lazy: async () => ({
              Component: (await import('./pages/ListaSedes')).default,
            }),
          },
          {
            path: ':code',
            lazy: async () => ({
              Component: (await import('./pages/DetalleSede')).default,
            }),
          },
        ],
      },
      {
        element: <SoloAnonimo />,
        children: [
          {
            path: 'login',
            lazy: async () => ({
              Component: (await import('./pages/Login')).default,
            }),
          },
          {
            path: 'registro',
            lazy: async () => ({
              Component: (await import('./pages/Registro')).default,
            }),
          },
        ],
      },
      {
        element: <RutaProtegida />,
        children: [
          {
            path: 'cuenta',
            lazy: async () => ({
              Component: (await import('./pages/Cuenta')).default,
            }),
          },
          {
            element: <RutaPorRol roles={['USER']} />,
            children: [
              {
                path: 'mis-tickets',
                lazy: async () => ({
                  Component: (await import('./pages/MisTickets')).default,
                }),
              },
              {
                path: 'mis-tickets/:ticketCode',
                lazy: async () => ({
                  Component: (await import('./pages/DetalleTicket')).default,
                }),
              },
              {
                path: 'compra/confirmacion/:ticketCode',
                lazy: async () => ({
                  Component: (await import('./pages/ConfirmacionCompra')).default,
                }),
              },
            ],
          },
          {
            element: <RutaPorRol roles={['STAFF', 'ADMIN']} />,
            children: [
              {
                path: 'staff/validacion',
                lazy: async () => ({
                  Component: (await import('./pages/ValidacionIngreso')).default,
                }),
              },
              {
                path: 'staff/eventos/:eventCode/tickets',
                lazy: async () => ({
                  Component: (await import('./pages/TicketsPagadosEvento')).default,
                }),
              },
            ],
          },
          {
            element: <RutaPorRol roles={['ADMIN']} />,
            children: [
              {
                path: 'admin/eventos',
                lazy: async () => ({
                  Component: (await import('./pages/AdminEventos')).default,
                }),
              },
              {
                path: 'admin/eventos/nuevo',
                lazy: async () => ({
                  Component: (await import('./pages/AdminCrearEvento')).default,
                }),
              },
              {
                path: 'admin/eventos/:eventCode',
                lazy: async () => ({
                  Component: (await import('./pages/AdminGestionEvento')).default,
                }),
              },
              {
                path: 'admin/artistas',
                lazy: async () => ({
                  Component: (await import('./pages/AdminArtistas')).default,
                }),
              },
              {
                path: 'admin/sedes',
                lazy: async () => ({
                  Component: (await import('./pages/AdminSedes')).default,
                }),
              },
            ],
          },
        ],
      },
      {
        path: '403',
        lazy: async () => ({
          Component: (await import('./pages/SinPermisos')).default,
        }),
      },
      {
        path: '*',
        lazy: async () => ({
          Component: (await import('./pages/NoEncontrada')).default,
        }),
      },
    ],
  },
])
