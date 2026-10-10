/**
 * Kernel compartido · Reglas del registro de jugador (KAN-16 · UEB-Proyect-03)
 *
 * Fuente única de verdad de las reglas y mensajes del registro. La usan:
 *   - el dominio del backend (objetos de valor), y
 *   - el esquema Zod que compartirán frontend y backend (Paso 2).
 *
 * Este archivo NO depende de ninguna librería: solo datos y funciones puras.
 * Si mañana cambia una regla, se cambia aquí y se actualiza en todo el sistema.
 */

const LETRAS_CON_TILDES_Y_ENIE = 'A-Za-zÁÉÍÓÚÜÑáéíóúüñ';

export const REGLAS_NOMBRE_COMPLETO = {
  longitudMinima: 3,
  longitudMaxima: 80,
  patronCaracteresPermitidos: new RegExp(`^[${LETRAS_CON_TILDES_Y_ENIE} ]+$`),
  mensajeError: 'Ingresa tu nombre completo (3 a 80 caracteres)',
} as const;

export const REGLAS_CORREO = {
  longitudMaxima: 254,
  patronFormato: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  mensajeFormatoInvalido: 'Ingresa un correo válido',
  mensajeYaRegistrado: 'Este correo ya está registrado',
} as const;

export const REGLAS_TELEFONO = {
  /** "+" opcional al inicio (indicativo) seguido de 7 a 15 dígitos. */
  patronFormato: /^\+?\d{7,15}$/,
  mensajeError: 'Ingresa un teléfono válido (7 a 15 dígitos)',
} as const;

export const REGLAS_CONTRASENA = {
  longitudMinima: 8,
  patronAlMenosUnaLetra: new RegExp(`[${LETRAS_CON_TILDES_Y_ENIE}]`),
  patronAlMenosUnNumero: /\d/,
  mensajeError: 'La contraseña debe tener mínimo 8 caracteres, con letras y números',
  mensajeConfirmacionDistinta: 'Las contraseñas no coinciden',
} as const;

/** "  Laura   Gómez " → "Laura Gómez". NFC unifica las tildes que algunos teclados envían separadas. */
export function normalizarNombreCompleto(nombreIngresado: string): string {
  return nombreIngresado.normalize('NFC').trim().replace(/\s+/g, ' ');
}

/** "Laura@Mail.com " → "laura@mail.com" (criterio del Escenario 1). */
export function normalizarCorreo(correoIngresado: string): string {
  return correoIngresado.trim().toLowerCase();
}

/** " 3001234567 " → "3001234567". */
export function normalizarTelefono(telefonoIngresado: string): string {
  return telefonoIngresado.trim();
}
