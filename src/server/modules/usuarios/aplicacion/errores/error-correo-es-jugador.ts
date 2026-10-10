/**
 * KAN-18 · Escenario 3: el correo ingresado pertenece a un Jugador existente.
 * El front debe mostrar el diálogo de promoción.
 */
export class ErrorCorreoEsJugador extends Error {
  readonly campo = 'correo';
  readonly codigo = 'CORREO_ES_JUGADOR';
  readonly jugadorId: string;
  readonly nombreJugador: string;

  constructor(jugadorId: string, nombreJugador: string) {
    super(`Este correo pertenece al jugador ${nombreJugador}. ¿Deseas promoverlo a administrador?`);
    this.name = 'ErrorCorreoEsJugador';
    this.jugadorId = jugadorId;
    this.nombreJugador = nombreJugador;
  }
}
