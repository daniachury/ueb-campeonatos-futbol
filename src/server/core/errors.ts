import type { ErrorHandler, NotFoundHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { ErrorApi } from '@shared/api';

/**
 * Error de negocio con código y estado HTTP.
 * Los servicios lanzan AppError y el manejador global lo convierte en `{ codigo, mensaje, detalles? }`.
 */
export class AppError extends Error {
  readonly status: ContentfulStatusCode;
  readonly codigo: string;
  readonly detalles?: unknown;

  constructor(status: ContentfulStatusCode, codigo: string, mensaje: string, detalles?: unknown) {
    super(mensaje);
    this.name = 'AppError';
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

/** Errores frecuentes, con los códigos acordados en UEB-Proyect-02. */
export const errores = {
  validacion: (detalles: unknown) =>
    new AppError(400, 'VALIDACION', 'Los datos enviados no son válidos', detalles),
  noAutenticado: () => new AppError(401, 'NO_AUTENTICADO', 'Debes iniciar sesión'),
  sinPermiso: () => new AppError(403, 'SIN_PERMISO', 'No tienes permiso para realizar esta acción'),
  noEncontrado: (recurso: string) => new AppError(404, 'NO_ENCONTRADO', `${recurso} no encontrado`),
  conflicto: (codigo: string, mensaje: string, detalles?: unknown) =>
    new AppError(409, codigo, mensaje, detalles),
};

/** Manejador global de errores: formato uniforme y sin filtrar detalles internos en los 500. */
export const manejarError: ErrorHandler = (error, c) => {
  if (error instanceof AppError) {
    const cuerpo: ErrorApi = { codigo: error.codigo, mensaje: error.message };
    if (error.detalles !== undefined) cuerpo.detalles = error.detalles;
    return c.json(cuerpo, error.status);
  }

  if (error instanceof HTTPException) {
    const cuerpo: ErrorApi = {
      codigo: `HTTP_${error.status}`,
      mensaje: error.message || 'La petición no se pudo procesar',
    };
    return c.json(cuerpo, error.status);
  }

  console.error('Error no controlado', error);
  const cuerpo: ErrorApi = {
    codigo: 'ERROR_INTERNO',
    mensaje: 'Ocurrió un error inesperado. Intenta de nuevo.',
  };
  return c.json(cuerpo, 500);
};

/** Respuesta para rutas /api que no existen. */
export const rutaNoEncontrada: NotFoundHandler = (c) => {
  const cuerpo: ErrorApi = { codigo: 'NO_ENCONTRADO', mensaje: 'Ruta no encontrada' };
  return c.json(cuerpo, 404);
};
