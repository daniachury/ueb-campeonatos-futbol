import {
  CODIGOS_ERROR_SESION,
  type SolicitudInicioDeSesion,
} from '@shared/usuarios/contrato-inicio-de-sesion';
import { ApiError } from '../../common/api/client';
import {
  ErrorDeInicioDeSesion,
  type MotivoDelRechazo,
  type ResultadoDeConsultaDeSesion,
  type ServicioDeSesion,
} from '../../common/sesion/servicio-de-sesion';
import { cerrarSesion, consultarSesion, iniciarSesion } from './api';

const MOTIVO_POR_CODIGO: Record<string, MotivoDelRechazo> = {
  [CODIGOS_ERROR_SESION.CREDENCIALES_INCORRECTAS]: 'credenciales-incorrectas',
  [CODIGOS_ERROR_SESION.DEMASIADOS_INTENTOS]: 'demasiados-intentos',
  [CODIGOS_ERROR_SESION.CUENTA_DESACTIVADA]: 'cuenta-desactivada',
};

/** Adaptador del puerto ServicioDeSesion sobre la API real (KAN-17). */
export class ServicioDeSesionHttp implements ServicioDeSesion {
  async consultarSesionActual(): Promise<ResultadoDeConsultaDeSesion> {
    try {
      return { estado: 'activa', usuario: await consultarSesion() };
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return error.codigo === CODIGOS_ERROR_SESION.SESION_EXPIRADA
          ? { estado: 'expirada' }
          : { estado: 'sin-sesion' };
      }
      throw error;
    }
  }

  async iniciarSesion(credenciales: SolicitudInicioDeSesion) {
    try {
      return await iniciarSesion(credenciales);
    } catch (error) {
      const motivo = error instanceof ApiError ? MOTIVO_POR_CODIGO[error.codigo] : undefined;
      if (motivo && error instanceof ApiError)
        throw new ErrorDeInicioDeSesion(motivo, error.message);
      throw error;
    }
  }

  async cerrarSesion(): Promise<void> {
    await cerrarSesion();
  }
}
