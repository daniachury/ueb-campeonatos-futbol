/**
 * KAN-18 · Escenario 3: no se puede promover al jugador porque pertenece
 * a un equipo cuyo torneo está EN_CURSO.
 */
export class ErrorJugadorEnTorneoEnCurso extends Error {
  readonly codigo = 'JUGADOR_EN_TORNEO_EN_CURSO';

  constructor() {
    super('No se puede promover al jugador: pertenece a un equipo con un torneo en curso.');
    this.name = 'ErrorJugadorEnTorneoEnCurso';
  }
}
