/**
 * Kernel compartido · Reglas del inicio de sesión (KAN-17 · UEB-Proyect-04).
 * Fuente única de las cifras y mensajes que usan el caso de uso, la API y la pantalla.
 */
export const REGLAS_INICIO_DE_SESION = {
  /** Escenario 4: el quinto fallo seguido para un mismo correo lo bloquea. */
  fallosSeguidosAntesDelBloqueo: 5,
  minutosDeBloqueo: 15,
  /** Vigencia de la sesión. */
  horasDeVigencia: 24,
} as const;

export const MENSAJES_INICIO_DE_SESION = {
  /** Escenario 3: no dice si falló el correo o la contraseña. */
  credencialesIncorrectas: 'Correo o contraseña incorrectos',
  demasiadosIntentos: 'Demasiados intentos. Intenta de nuevo en 15 minutos',
  cuentaDesactivada: 'Tu cuenta está desactivada. Contacta al administrador',
  sesionExpirada: 'Tu sesión expiró, ingresa de nuevo',
} as const;
