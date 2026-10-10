/**
 * Contrato del registro de jugador: qué se envía, a dónde y qué responde el servidor.
 * Lo importan el cliente y el servidor, así nunca discrepan.
 * La petición la describe el esquema Zod (esquema-registro-jugador.ts).
 */

/** POST, relativa a /api. */
export const RUTA_API_REGISTRO_JUGADOR = '/auth/registro';

/** Códigos propios de las respuestas de error del registro (además de VALIDACION). */
export const CODIGOS_ERROR_REGISTRO = {
  /** 409 · Escenario 2. */
  CORREO_YA_REGISTRADO: 'CORREO_YA_REGISTRADO',
} as const;

/** Respuesta 201 del registro. Nunca incluye la contraseña ni su hash (Escenario 5). */
export interface JugadorRegistrado {
  id: string;
  nombreCompleto: string;
  correo: string;
  telefono: string;
  /** Siempre "jugador": el registro público no puede crear administradores (Escenario 4). */
  rol: 'jugador';
}
