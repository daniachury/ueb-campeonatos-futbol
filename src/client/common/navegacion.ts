import type { Rol } from '@shared/constants';
import type { NombreDeIcono } from './components/Icono';

/** Direcciones de las pantallas. Si una URL cambia, se cambia solo aquí. */
export const RUTAS = {
  /** v3 · S01 · SignIn: arranque de la app y estado de la sesión. */
  INICIO: '/',
  INICIAR_SESION: '/iniciar-sesion',
  CREAR_CUENTA: '/crear-cuenta',
  /** v3 · M11 / W04 · Inicio del jugador (la pestaña «Torneos» del menú). */
  INICIO_DEL_JUGADOR: '/inicio',
  TORNEOS: '/torneos',
  DETALLE_TORNEO: '/torneos/:id',
  MIS_EQUIPOS: '/mis-equipos',
  UNIRME_A_UN_EQUIPO: '/mis-equipos/unirme',
  CREAR_MI_EQUIPO: '/mis-equipos/nuevo',
  CALENDARIO: '/calendario',
  MI_PERFIL: '/mi-perfil',
  TABLA_RESULTADOS: '/tabla-resultados',
  /** v3 · A01 · Gestión de torneos: a donde entra el administrador (KAN-17, Escenario 2). */
  GESTION_DE_TORNEOS: '/admin/torneos',
  GESTION_DE_EQUIPOS: '/admin/equipos',
  GESTION_DE_JUGADORES: '/admin/jugadores',
  GESTION_DE_INSCRIPCIONES: '/admin/inscripciones',
  GESTION_DE_PARTIDOS: '/admin/partidos',
  PANEL_ADMIN: '/admin',
} as const;

/** KAN-17 · Escenarios 1 y 2: cada rol entra a su propia pantalla de inicio. */
export function rutaDeInicioSegunRol(rol: Rol): string {
  return rol === 'admin' ? RUTAS.PANEL_ADMIN : RUTAS.INICIO_DEL_JUGADOR;
}

/** Lo que una pantalla protegida le envía a Iniciar sesión: a dónde volver después. */
export interface EstadoAlPedirInicioDeSesion {
  desde?: string;
}

/**
 * Lo que una pantalla puede enviarle al Inicio del jugador al navegar hacia allí
 * (KAN-16, Escenario 1: el mensaje de bienvenida después de crear la cuenta).
 */
export interface EstadoAlLlegarAlInicio {
  mensajeDeBienvenida?: string;
}

export interface OpcionDelMenu {
  ruta: string;
  texto: string;
  icono: NombreDeIcono;
}

/** Menú del jugador (v3 · M11 barra inferior, M12 menú hamburguesa y W04 barra lateral). */
export const MENU_DEL_JUGADOR: readonly OpcionDelMenu[] = [
  { ruta: RUTAS.INICIO_DEL_JUGADOR, texto: 'Torneos', icono: 'copa' },
  { ruta: RUTAS.MIS_EQUIPOS, texto: 'Mis equipos', icono: 'escudo' },
  { ruta: RUTAS.CALENDARIO, texto: 'Calendario', icono: 'calendario' },
  { ruta: RUTAS.TABLA_RESULTADOS, texto: 'Tabla de resultados', icono: 'perfil' },
];
