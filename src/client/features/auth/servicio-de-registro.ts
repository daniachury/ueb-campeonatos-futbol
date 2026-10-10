import type { JugadorRegistrado } from '@shared/usuarios/contrato-registro-jugador';
import type { SolicitudRegistroJugador } from '@shared/usuarios/esquema-registro-jugador';
import { REGLAS_CORREO } from '@shared/usuarios/reglas-registro-jugador';

/**
 * Puerto: lo que la pantalla necesita para registrar a un jugador, sin decir CÓMO se hace.
 * Lo cumple ServicioDeRegistroHttp; las pruebas usan uno falso.
 */
export interface ServicioDeRegistro {
  registrarJugador(solicitud: SolicitudRegistroJugador): Promise<JugadorRegistrado>;
}

/** El correo ya pertenece a otra cuenta (la API responde 409, Escenario 2). */
export class ErrorCorreoYaRegistrado extends Error {
  constructor() {
    super(REGLAS_CORREO.mensajeYaRegistrado);
    this.name = 'ErrorCorreoYaRegistrado';
  }
}
