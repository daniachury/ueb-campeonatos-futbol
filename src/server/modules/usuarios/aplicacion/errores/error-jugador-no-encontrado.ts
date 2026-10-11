/**
 * Error de aplicación cuando no se encuentra el jugador por su ID (KAN-18).
 */
export class ErrorJugadorNoEncontrado extends Error {
  readonly codigo = 'NO_ENCONTRADO';

  constructor(mensaje = 'Jugador no encontrado') {
    super(mensaje);
    this.name = 'ErrorJugadorNoEncontrado';
  }
}
