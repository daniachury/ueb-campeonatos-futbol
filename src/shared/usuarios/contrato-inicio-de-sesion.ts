/**
 * Contrato del inicio y cierre de sesión (KAN-17): qué se envía, a dónde y qué se responde.
 * Lo importan el cliente y el servidor, así nunca discrepan.
 */
import { z } from 'zod';
import type { Rol } from '../constants';
import { normalizarCorreo } from './reglas-registro-jugador';

/** Rutas relativas a /api. */
export const RUTAS_API_SESION = {
  /** POST · 200 con UsuarioAutenticado y la cookie de sesión. */
  INICIAR: '/auth/login',
  /** POST · 204, invalida el token y borra la cookie. */
  CERRAR: '/auth/logout',
  /** GET · 200 con UsuarioAutenticado si la cookie es válida; si no, 401. */
  ACTUAL: '/auth/sesion',
} as const;

/** Códigos propios de las respuestas de error de la sesión. */
export const CODIGOS_ERROR_SESION = {
  /** 401 · Escenario 3. */
  CREDENCIALES_INCORRECTAS: 'CREDENCIALES_INCORRECTAS',
  /** 429 · Escenario 4. */
  DEMASIADOS_INTENTOS: 'DEMASIADOS_INTENTOS',
  /** 403 · Escenario 5. */
  CUENTA_DESACTIVADA: 'CUENTA_DESACTIVADA',
  /** 401 · Escenario 7. */
  SESION_EXPIRADA: 'SESION_EXPIRADA',
  /** 401 · sin cookie o con un token que no existe (por ejemplo, después de cerrar sesión). */
  NO_AUTENTICADO: 'NO_AUTENTICADO',
} as const;

/**
 * Credenciales del formulario Iniciar sesión.
 * Solo se exige que lleguen: decir aquí "correo inválido" revelaría pistas (Escenario 3).
 * El correo no distingue mayúsculas: se normaliza como en el registro.
 */
export const esquemaSolicitudInicioDeSesion = z.object({
  correo: z.string().transform(normalizarCorreo).pipe(z.string().min(1)),
  contrasena: z.string().min(1),
});

export type SolicitudInicioDeSesion = z.output<typeof esquemaSolicitudInicioDeSesion>;

/** Quién tiene la sesión. Nunca incluye la contraseña ni su hash. */
export interface UsuarioAutenticado {
  id: string;
  nombreCompleto: string;
  correo: string;
  telefono: string;
  rol: Rol;
}
