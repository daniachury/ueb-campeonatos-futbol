/**
 * KAN-18 · Escenario 4: el correo ingresado ya pertenece a un administrador.
 * No se hace ningún cambio.
 */
export class ErrorCorreoYaEsAdmin extends Error {
  readonly campo = 'correo';
  readonly codigo = 'CORREO_YA_ES_ADMIN';

  constructor() {
    super('Este correo ya es administrador');
    this.name = 'ErrorCorreoYaEsAdmin';
  }
}
