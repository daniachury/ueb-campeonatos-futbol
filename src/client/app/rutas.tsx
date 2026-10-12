import type { RouteObject } from 'react-router';
import { RUTAS } from '../common/navegacion';
import { GestionDeTorneosPage } from '../features/admin/pages/GestionDeTorneosPage';
import { PanelAdminPage } from '../features/admin/pages/PanelAdminPage';
import { GestionDeJugadoresPage } from '../features/admin/pages/GestionDeJugadoresPage';
import { GestionDeInscripcionesPage } from '../features/admin/pages/GestionDeInscripcionesPage';
import { GestionDePartidosPage } from '../features/admin/pages/GestionDePartidosPage';
import { GestionSoloDeEquiposPage } from '../features/admin/pages/GestionSoloDeEquiposPage';
import { InscripcionesPage } from '../features/admin/pages/InscripcionesPage';
import { RegistrarAdminPage } from '../features/admin/pages/RegistrarAdminPage';
import { SedesPage } from '../features/admin/pages/SedesPage';
import { ArranquePage } from '../features/auth/pages/ArranquePage';
import { CambiarContrasenaPage } from '../features/auth/pages/CambiarContrasenaPage';
import { CrearCuentaPage } from '../features/auth/pages/CrearCuentaPage';
import { IniciarSesionPage } from '../features/auth/pages/IniciarSesionPage';
import { InicioPage } from '../features/inicio/pages/InicioPage';
import { CalendarioPage } from '../features/inicio/pages/CalendarioPage';
import { TablaResultadosPage } from '../features/inicio/pages/TablaResultadosPage';
import { RutaMiPerfil } from '../features/perfil/pages/RutaMiPerfil';
import { TorneosPage } from '../features/torneos/pages/TorneosPage';
import { CrearEquipoPage } from '../features/equipos/pages/CrearEquipoPage';
import { MisEquiposPage } from '../features/equipos/pages/MisEquiposPage';
import { UnirmeAEquipoPage } from '../features/equipos/pages/UnirmeAEquipoPage';
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
      { path: RUTAS.CALENDARIO, element: <CalendarioPage /> },
      { path: RUTAS.TABLA_RESULTADOS, element: <TablaResultadosPage /> },
      { path: RUTAS.MIS_EQUIPOS, element: <MisEquiposPage /> },
      { path: RUTAS.CREAR_MI_EQUIPO, element: <CrearEquipoPage /> },
      { path: RUTAS.UNIRME_A_UN_EQUIPO, element: <UnirmeAEquipoPage /> },
    ],
  },

  // Perfil de usuario (KAN-19 · rol-todos: accesible para jugador y administrador).
  { path: RUTAS.MI_PERFIL, element: <RutaMiPerfil /> },

  // Administrador (v3 · A01, A02 y A07).
  { path: RUTAS.PANEL_ADMIN, element: <PanelAdminPage /> },
  { path: RUTAS.GESTION_DE_TORNEOS, element: <GestionDeTorneosPage /> },
  { path: RUTAS.GESTION_DE_EQUIPOS, element: <GestionSoloDeEquiposPage /> },
  { path: RUTAS.GESTION_DE_JUGADORES, element: <GestionDeJugadoresPage /> },
  { path: RUTAS.GESTION_DE_INSCRIPCIONES, element: <GestionDeInscripcionesPage /> },
  { path: RUTAS.GESTION_DE_PARTIDOS, element: <GestionDePartidosPage /> },
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
