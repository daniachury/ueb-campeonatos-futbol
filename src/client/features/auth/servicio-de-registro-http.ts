import { CODIGOS_ERROR_REGISTRO } from '@shared/usuarios/contrato-registro-jugador';
import type { SolicitudRegistroJugador } from '@shared/usuarios/esquema-registro-jugador';
import { ApiError } from '../../common/api/client';
import { registrarJugador } from './api';
import { ErrorCorreoYaRegistrado, type ServicioDeRegistro } from './servicio-de-registro';

/**
 * Adaptador del puerto ServicioDeRegistro sobre la API real.
 * Traduce el 409 de correo duplicado al error del puerto; cualquier otro error sigue su camino
 * y la pantalla muestra el mensaje genérico.
 */
export class ServicioDeRegistroHttp implements ServicioDeRegistro {
  async registrarJugador(solicitud: SolicitudRegistroJugador) {
    try {
      return await registrarJugador(solicitud);
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.codigo === CODIGOS_ERROR_REGISTRO.CORREO_YA_REGISTRADO
      ) {
        throw new ErrorCorreoYaRegistrado();
      }
      throw error;
    }
  }
}
