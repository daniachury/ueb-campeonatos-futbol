import { REGLAS_CORREO } from '../../../../../shared/usuarios/reglas-registro-jugador';

/**
 * El correo ya pertenece a otra cuenta (KAN-16 · Escenario 2).
 * No es un error de formato: el dato es válido, pero choca con lo que ya existe.
 * La ruta HTTP lo convierte en una respuesta 409 (conflicto).
 */
export class ErrorCorreoYaRegistrado extends Error {
  readonly campo = 'correo';

  constructor() {
    super(REGLAS_CORREO.mensajeYaRegistrado);
    this.name = 'ErrorCorreoYaRegistrado';
  }
}
