import { REGLAS_INICIO_DE_SESION } from '@shared/usuarios/reglas-inicio-de-sesion';

/**
 * Cookie que lleva el token de sesión (KAN-16 la emite al registrarse; KAN-17 la valida).
 * HttpOnly: JavaScript del navegador no la puede leer, así un script inyectado no roba la sesión.
 */
export const COOKIE_DE_SESION = {
  nombre: 'sesion',
  /** Vigencia de 24 h (UEB-Proyect-04). */
  duracionEnSegundos: REGLAS_INICIO_DE_SESION.horasDeVigencia * 60 * 60,
} as const;
