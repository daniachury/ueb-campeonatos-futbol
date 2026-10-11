/**
 * Constantes del dominio compartidas por el frontend y el backend.
 * Si una regla cambia, se cambia aquí y ambos lados quedan alineados.
 */

/** Roles del sistema (UEB-Proyect-02). */
export const ROLES = ['jugador', 'admin'] as const;
export type Rol = (typeof ROLES)[number];

/** Ciclo de vida de un torneo (épica E3). */
export const ESTADOS_TORNEO = [
  'BORRADOR',
  'INSCRIPCIONES_ABIERTAS',
  'EN_CURSO',
  'FINALIZADO',
  'CANCELADO',
] as const;
export type EstadoTorneo = (typeof ESTADOS_TORNEO)[number];

/** Estados que un jugador puede ver en el listado de torneos (UEB-Proyect-10). */
export const ESTADOS_TORNEO_PUBLICOS = [
  'INSCRIPCIONES_ABIERTAS',
  'EN_CURSO',
  'FINALIZADO',
] as const satisfies readonly EstadoTorneo[];
export type EstadoTorneoPublico = (typeof ESTADOS_TORNEO_PUBLICOS)[number];

export const ETIQUETAS_ESTADO_TORNEO: Record<EstadoTorneo, string> = {
  BORRADOR: 'Borrador',
  INSCRIPCIONES_ABIERTAS: 'Inscripciones abiertas',
  EN_CURSO: 'En curso',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
};

/**
 * Reglas de negocio del MVP definidas en el backlog de Jira.
 * Pendiente validarlas con el docente (ver hoja "Pendientes" del backlog).
 */
export const REGLAS = {
  JUGADORES_POR_EQUIPO_MIN: 11,
  JUGADORES_POR_EQUIPO_MAX: 25,
  EQUIPOS_POR_TORNEO_MIN: 3,
  EQUIPOS_POR_TORNEO_MAX: 20,
  PUNTOS_VICTORIA: 3,
  PUNTOS_EMPATE: 1,
  PUNTOS_DERROTA: 0,
  DURACION_PARTIDO_MINUTOS: 120,
  ZONA_HORARIA: 'America/Bogota',
  MOTIVO_RECHAZO_MIN: 10,
  MOTIVO_RECHAZO_MAX: 300,
} as const;

/** Ciclo de vida de una inscripción a un torneo (épica E6). */
export const ESTADOS_INSCRIPCION = [
  'PENDIENTE',
  'APROBADO',
  'RECHAZADO',
  'RETIRADO',
  'CANCELADO',
] as const;
export type EstadoInscripcion = (typeof ESTADOS_INSCRIPCION)[number];

export const ETIQUETAS_ESTADO_INSCRIPCION: Record<EstadoInscripcion, string> = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  RETIRADO: 'Retirado',
  CANCELADO: 'Cancelado',
};
