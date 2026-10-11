import { REGLAS, type EstadoTorneo } from '@shared/constants';
import { errores } from '../../../core/errors';

export interface ConflictoJugador {
  jugadorId: string;
  nombreJugador: string;
  otroEquipoId: string;
  otroEquipoNombre: string;
}

export interface ParametrosValidacionInscripcion {
  torneoEstado: EstadoTorneo;
  equiposAprobados: number;
  cupo: number;
  cantidadJugadores: number;
  conflictos: ConflictoJugador[];
}

/**
 * Valida las 4 condiciones requeridas para aprobar o inscribir directamente un equipo (KAN-32).
 */
export function validarCondicionesDeInscripcion({
  torneoEstado,
  equiposAprobados,
  cupo,
  cantidadJugadores,
  conflictos,
}: ParametrosValidacionInscripcion): void {
  // 1. Torneo en inscripciones abiertas
  if (torneoEstado !== 'INSCRIPCIONES_ABIERTAS') {
    throw errores.conflicto(
      'INSCRIPCIONES_CERRADAS',
      'Las inscripciones de este torneo están cerradas',
    );
  }

  // 2. Cupo disponible
  if (equiposAprobados >= cupo) {
    throw errores.conflicto(
      'CUPO_COMPLETO',
      `El torneo ya completó su cupo (${equiposAprobados}/${cupo})`,
    );
  }

  // 3. Plantilla de 11 a 25 integrantes
  if (cantidadJugadores < REGLAS.JUGADORES_POR_EQUIPO_MIN) {
    throw errores.conflicto(
      'PLANTILLA_INCOMPLETA',
      `El equipo tiene ${cantidadJugadores} jugadores; se necesitan al menos ${REGLAS.JUGADORES_POR_EQUIPO_MIN}`,
    );
  }

  if (cantidadJugadores > REGLAS.JUGADORES_POR_EQUIPO_MAX) {
    throw errores.conflicto(
      'PLANTILLA_EXCEDIDA',
      `El equipo tiene ${cantidadJugadores} jugadores; el máximo permitido es ${REGLAS.JUGADORES_POR_EQUIPO_MAX}`,
    );
  }

  // 4. Regla UEB-Proyect-15: sin conflicto de jugadores en el mismo torneo
  if (conflictos.length > 0) {
    const detalleConflictos = conflictos
      .map((c) => `${c.nombreJugador} (${c.otroEquipoNombre})`)
      .join(', ');
    throw errores.conflicto(
      'JUGADORES_EN_CONFLICTO',
      `Jugadores en conflicto: ${detalleConflictos}`,
      { conflictos },
    );
  }
}

/**
 * Valida que el torneo permita mutaciones (no esté en curso ni finalizado).
 */
export function validarTorneoPermiteModificacion(torneoEstado: EstadoTorneo): void {
  if (torneoEstado === 'EN_CURSO' || torneoEstado === 'FINALIZADO' || torneoEstado === 'CANCELADO') {
    throw errores.conflicto(
      'TORNEO_EN_CURSO',
      'No se pueden modificar inscripciones cuando el torneo está en curso o finalizado',
    );
  }
}
