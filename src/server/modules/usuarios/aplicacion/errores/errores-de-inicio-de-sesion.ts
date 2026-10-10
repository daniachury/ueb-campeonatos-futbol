import { MENSAJES_INICIO_DE_SESION } from '../../../../../shared/usuarios/reglas-inicio-de-sesion';

/** Escenario 3: correo inexistente o contraseña incorrecta. No dice cuál de los dos (401). */
export class ErrorCredencialesIncorrectas extends Error {
  constructor() {
    super(MENSAJES_INICIO_DE_SESION.credencialesIncorrectas);
    this.name = 'ErrorCredencialesIncorrectas';
  }
}

/** Escenario 4: el correo está bloqueado 15 minutos por fallos seguidos (429). */
export class ErrorDemasiadosIntentos extends Error {
  constructor() {
    super(MENSAJES_INICIO_DE_SESION.demasiadosIntentos);
    this.name = 'ErrorDemasiadosIntentos';
  }
}

/** Escenario 5: credenciales correctas, pero un administrador desactivó la cuenta (403). */
export class ErrorCuentaDesactivada extends Error {
  constructor() {
    super(MENSAJES_INICIO_DE_SESION.cuentaDesactivada);
    this.name = 'ErrorCuentaDesactivada';
  }
}
