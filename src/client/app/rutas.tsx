import type { RouteObject } from 'react-router';
import { RUTAS } from '../common/navegacion';
import { GestionDeTorneosPage } from '../features/admin/pages/GestionDeTorneosPage';
import { GestionDeJugadoresPage } from '../features/admin/pages/GestionDeJugadoresPage';
import { GestionSoloDeEquiposPage } from '../features/admin/pages/GestionSoloDeEquiposPage';
import { GestionDeInscripcionesPage } from '../features/admin/pages/GestionDeInscripcionesPage';
import { GestionDePartidosPage } from '../features/admin/pages/GestionDePartidosPage';
import { PanelAdminPage } from '../features/admin/pages/PanelAdminPage';
import { ArranquePage } from '../features/auth/pages/ArranquePage';
import { CrearCuentaPage } from '../features/auth/pages/CrearCuentaPage';
import { IniciarSesionPage } from '../features/auth/pages/IniciarSesionPage';
import { InicioPage } from '../features/inicio/pages/InicioPage';
import { TorneosPage } from '../features/torneos/pages/TorneosPage';
import { DetalleTorneoPage } from '../features/torneos/pages/DetalleTorneoPage';
import { CrearEquipoPage } from '../features/equipos/pages/CrearEquipoPage';
import { MisEquiposPage } from '../features/equipos/pages/MisEquiposPage';
import { CalendarioPage } from '../features/inicio/pages/CalendarioPage';
import { TablaResultadosPage } from '../features/inicio/pages/TablaResultadosPage';
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
    children: [{ path: RUTAS.INICIO_DEL_JUGADOR, element: <InicioPage /> }, { path: RUTAS.MIS_EQUIPOS, element: <MisEquiposPage /> }, { path: RUTAS.CREAR_MI_EQUIPO, element: <CrearEquipoPage /> }, { path: RUTAS.UNIRME_A_UN_EQUIPO, element: <UnirmeAEquipoPage /> }, { path: RUTAS.CALENDARIO, element: <CalendarioPage /> }, { path: RUTAS.TABLA_RESULTADOS, element: <TablaResultadosPage /> }],
  },

  // Administrador (v3 · A01). Provisional hasta la historia de gestión de torneos.
  { path: RUTAS.PANEL_ADMIN, element: <PanelAdminPage /> },
  { path: RUTAS.GESTION_DE_TORNEOS, element: <GestionDeTorneosPage /> },
  { path: RUTAS.GESTION_DE_EQUIPOS, element: <GestionSoloDeEquiposPage /> },
  { path: RUTAS.GESTION_DE_JUGADORES, element: <GestionDeJugadoresPage /> },
  { path: RUTAS.GESTION_DE_INSCRIPCIONES, element: <GestionDeInscripcionesPage /> },
  { path: RUTAS.GESTION_DE_PARTIDOS, element: <GestionDePartidosPage /> },

  // Pantallas anteriores al diseño v3.
  {
    element: <AppLayout />,
    children: [
      { path: RUTAS.TORNEOS, element: <TorneosPage /> },
      { path: '/torneos/:id', element: <DetalleTorneoPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
