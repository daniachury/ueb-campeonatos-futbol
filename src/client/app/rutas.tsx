import type { RouteObject } from 'react-router';
import { RUTAS } from '../common/navegacion';
import { GestionDeTorneosPage } from '../features/admin/pages/GestionDeTorneosPage';
import { InscripcionesPage } from '../features/admin/pages/InscripcionesPage';
import { RegistrarAdminPage } from '../features/admin/pages/RegistrarAdminPage';
import { SedesPage } from '../features/admin/pages/SedesPage';
import { ArranquePage } from '../features/auth/pages/ArranquePage';
import { CambiarContrasenaPage } from '../features/auth/pages/CambiarContrasenaPage';
import { CrearCuentaPage } from '../features/auth/pages/CrearCuentaPage';
import { IniciarSesionPage } from '../features/auth/pages/IniciarSesionPage';
import { InicioPage } from '../features/inicio/pages/InicioPage';
import { RutaMiPerfil } from '../features/perfil/pages/RutaMiPerfil';
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
    ],
  },

  // Perfil de usuario (KAN-19 · rol-todos: accesible para jugador y administrador).
  { path: RUTAS.MI_PERFIL, element: <RutaMiPerfil /> },

  // Administrador (v3 · A01, A02 y A07).
  { path: RUTAS.GESTION_DE_TORNEOS, element: <GestionDeTorneosPage /> },
  { path: RUTAS.ADMIN_INSCRIPCIONES, element: <InscripcionesPage /> },
  { path: RUTAS.REGISTRAR_ADMIN, element: <RegistrarAdminPage /> },
  { path: RUTAS.ADMIN_SEDES, element: <SedesPage /> },
  { path: RUTAS.CAMBIAR_CONTRASENA, element: <CambiarContrasenaPage /> },

  // Pantallas anteriores al diseño v3.
  {
    element: <AppLayout />,
    children: [
      { path: RUTAS.TORNEOS, element: <TorneosPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
