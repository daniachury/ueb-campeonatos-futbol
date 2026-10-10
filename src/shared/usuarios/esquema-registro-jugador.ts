import { z } from 'zod';
import {
  REGLAS_CONTRASENA,
  REGLAS_CORREO,
  REGLAS_NOMBRE_COMPLETO,
  REGLAS_TELEFONO,
  normalizarCorreo,
  normalizarNombreCompleto,
  normalizarTelefono,
} from './reglas-registro-jugador';

/**
 * Esquema compartido del registro de jugador (KAN-16).
 *
 * - El formulario lo usa para validar en línea y para armar la solicitud.
 * - El servidor lo usará para validar el cuerpo de POST /api/auth/registro (paso 6).
 *
 * No inventa reglas: todas salen de reglas-registro-jugador.ts.
 */

const esquemaNombreCompleto = z
  .string({ message: REGLAS_NOMBRE_COMPLETO.mensajeError })
  .transform(normalizarNombreCompleto)
  .pipe(
    z
      .string()
      .min(REGLAS_NOMBRE_COMPLETO.longitudMinima, REGLAS_NOMBRE_COMPLETO.mensajeError)
      .max(REGLAS_NOMBRE_COMPLETO.longitudMaxima, REGLAS_NOMBRE_COMPLETO.mensajeError)
      .regex(
        REGLAS_NOMBRE_COMPLETO.patronCaracteresPermitidos,
        REGLAS_NOMBRE_COMPLETO.mensajeError,
      ),
  );

const esquemaCorreo = z
  .string({ message: REGLAS_CORREO.mensajeFormatoInvalido })
  .transform(normalizarCorreo)
  .pipe(
    z
      .string()
      .max(REGLAS_CORREO.longitudMaxima, REGLAS_CORREO.mensajeFormatoInvalido)
      .regex(REGLAS_CORREO.patronFormato, REGLAS_CORREO.mensajeFormatoInvalido),
  );

const esquemaTelefono = z
  .string({ message: REGLAS_TELEFONO.mensajeError })
  .transform(normalizarTelefono)
  .pipe(z.string().regex(REGLAS_TELEFONO.patronFormato, REGLAS_TELEFONO.mensajeError));

const esquemaContrasena = z
  .string({ message: REGLAS_CONTRASENA.mensajeError })
  .min(REGLAS_CONTRASENA.longitudMinima, REGLAS_CONTRASENA.mensajeError)
  .regex(REGLAS_CONTRASENA.patronAlMenosUnaLetra, REGLAS_CONTRASENA.mensajeError)
  .regex(REGLAS_CONTRASENA.patronAlMenosUnNumero, REGLAS_CONTRASENA.mensajeError);

/** Lo que el cliente envía al servidor. Los campos que no estén aquí (como "rol") se descartan. */
export const esquemaSolicitudRegistroJugador = z.object({
  nombreCompleto: esquemaNombreCompleto,
  correo: esquemaCorreo,
  telefono: esquemaTelefono,
  contrasena: esquemaContrasena,
});

/** La solicitud ya validada y normalizada: correo en minúsculas, nombre sin espacios sobrantes. */
export type SolicitudRegistroJugador = z.output<typeof esquemaSolicitudRegistroJugador>;

/** Los cinco campos del formulario Crear cuenta, en el orden en que aparecen en pantalla. */
export const CAMPOS_FORMULARIO_REGISTRO = [
  'nombreCompleto',
  'correo',
  'telefono',
  'contrasena',
  'confirmarContrasena',
] as const;

export type CampoFormularioRegistro = (typeof CAMPOS_FORMULARIO_REGISTRO)[number];

/** Lo que la persona escribió, tal cual, antes de validar o normalizar. */
export type ValoresFormularioRegistro = Record<CampoFormularioRegistro, string>;

/** Un mensaje por campo con problema. Un campo sin error no aparece. */
export type ErroresFormularioRegistro = Partial<Record<CampoFormularioRegistro, string>>;

export const VALORES_INICIALES_FORMULARIO_REGISTRO: ValoresFormularioRegistro = {
  nombreCompleto: '',
  correo: '',
  telefono: '',
  contrasena: '',
  confirmarContrasena: '',
};

const CAMPOS_DE_LA_SOLICITUD = ['nombreCompleto', 'correo', 'telefono', 'contrasena'] as const;

/**
 * Valida cada campo por separado y devuelve el primer mensaje de cada uno.
 * Por separado, para que "Las contraseñas no coinciden" aparezca aunque otro campo
 * todavía tenga errores (una regla sobre el objeto completo esperaría a que todo lo demás sea válido).
 */
export function validarFormularioRegistro(
  valores: ValoresFormularioRegistro,
): ErroresFormularioRegistro {
  const errores: ErroresFormularioRegistro = {};

  for (const campo of CAMPOS_DE_LA_SOLICITUD) {
    const resultado = esquemaSolicitudRegistroJugador.shape[campo].safeParse(valores[campo]);
    const primerProblema = resultado.error?.issues[0];
    if (primerProblema) {
      errores[campo] = primerProblema.message;
    }
  }

  if (valores.confirmarContrasena !== valores.contrasena) {
    errores.confirmarContrasena = REGLAS_CONTRASENA.mensajeConfirmacionDistinta;
  }

  return errores;
}
