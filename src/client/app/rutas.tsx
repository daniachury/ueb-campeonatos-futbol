import { Navigate, type RouteObject } from 'react-router';
import { TorneosPage } from '../features/torneos/pages/TorneosPage';
import { AppLayout } from './layout/AppLayout';
import { NotFoundPage } from './NotFoundPage';

/**
 * Mapa de pantallas de la aplicación.
 * Cada feature nueva agrega aquí su ruta (y, cuando exista la sesión, la protege por rol).
 */
export const rutas: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/torneos" replace /> },
      { path: 'torneos', element: <TorneosPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
