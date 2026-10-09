/**
 * Contrato HTTP entre el frontend y el backend.
 */

/** Cuerpo de toda respuesta de error de la API (UEB-Proyect-02, escenario 6). */
export interface ErrorApi {
  codigo: string;
  mensaje: string;
  detalles?: unknown;
}

/** Detalle de un campo que no pasó la validación (respuestas 400 con código VALIDACION). */
export interface ErrorDeCampo {
  campo: string;
  mensaje: string;
}

/** Respuesta estándar de los endpoints que devuelven listas. */
export interface RespuestaLista<T> {
  datos: T[];
}
