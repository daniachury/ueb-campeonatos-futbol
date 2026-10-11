import type { RouteObject } from 'react-router';
import { RUTAS } from '../common/navegacion';
import { GestionDeTorneosPage } from '../features/admin/pages/GestionDeTorneosPage';
import { ArranquePage } from '../features/auth/pages/ArranquePage';
import { CrearCuentaPage } from '../features/auth/pages/CrearCuentaPage';
import { IniciarSesionPage } from '../features/auth/pages/IniciarSesionPage';
import { InicioPage } from '../features/inicio/pages/InicioPage';
import { MiPerfilPage } from '../features/perfil/pages/MiPerfilPage';
import { TorneosPage } from '../features/torneos/pages/TorneosPage';
import { AppLayout } from './layout/AppLayout';
import { LayoutDelJugador } from './layout/LayoutDelJugador';
import { NotFoundPage } from './NotFoundPage';

/**
 * Mapa de pantallas de la aplicación.
 * Cada feature nueva agrega aquí su ruta dentro del layout que le corresponde.
 */
export const rutas: RouteObject[] = [
  // Acceso (v3 · S01, M01, M02 y W03): pantallas completas, sin menú.
  { path: RUTAS.INICIO, element: <ArranquePage /> },
  { path: RUTAS.INICIAR_SESION, element: <IniciarSesionPage /> },
  { path: RUTAS.CREAR_CUENTA, element: <CrearCuentaPage /> },

  // Jugador con sesión (v3 · M11, M12 y W04).
  {
    element: <LayoutDelJugador />,
    children: [
      { path: RUTAS.INICIO_DEL_JUGADOR, element: <InicioPage /> },
      { path: RUTAS.MI_PERFIL, element: <MiPerfilPage /> },
    ],
  },

  // Administrador (v3 · A01). Provisional hasta la historia de gestión de torneos.
  { path: RUTAS.GESTION_DE_TORNEOS, element: <GestionDeTorneosPage /> },

  // Pantallas anteriores al diseño v3.
  {
    element: <AppLayout />,
    children: [
      { path: RUTAS.TORNEOS, element: <TorneosPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
