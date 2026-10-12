/** KAN-19 · Escenario 2 y 4: la contraseña actual no coincide. */
export class ErrorContrasenaActualIncorrecta extends Error {
  constructor() {
    super('La contraseña actual no es correcta');
    this.name = 'ErrorContrasenaActualIncorrecta';
  }
}
