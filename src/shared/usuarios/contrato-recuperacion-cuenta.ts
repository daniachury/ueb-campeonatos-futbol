import { z } from 'zod';
import { normalizarCorreo, REGLAS_CONTRASENA } from './reglas-registro-jugador';

/**
 * Rutas relativas a /api para el flujo de recuperación de cuenta (KAN-50).
 */
export const RUTAS_API_RECUPERACION = {
  SOLICITAR: '/auth/recuperar-cuenta',
  VALIDAR_TOKEN: '/auth/validar-token-recuperacion',
  RESTABLECER: '/auth/restablecer-contrasena',
} as const;

/** Códigos de error específicos para el flujo de recuperación. */
export const CODIGOS_ERROR_RECUPERACION = {
  CORREO_NO_ENCONTRADO: 'CORREO_NO_ENCONTRADO',
  TOKEN_INVALIDO_O_EXPIRADO: 'TOKEN_INVALIDO_O_EXPIRADO',
  CONTRASENAS_NO_COINCIDEN: 'CONTRASENAS_NO_COINCIDEN',
} as const;

/** Textos oficiales exigidos en los criterios de aceptación de KAN-50. */
export const MENSAJES_RECUPERACION = {
  CORREO_INVALIDO: 'Ingresa un correo válido',
  CORREO_NO_ENCONTRADO:
    'No se encontró una cuenta de jugador, capitán o administrador asociada a este correo',
  TOKEN_INVALIDO_O_EXPIRADO:
    'El enlace de recuperación es inválido o ha expirado. Genera uno nuevo.',
  CONTRASENAS_NO_COINCIDEN: 'Las contraseñas no coinciden',
  EXITO_RESTABLECIMIENTO: 'Contraseña restablecida con éxito',
} as const;

/** Esquema para solicitar la recuperación de cuenta (Escenarios 1 y 2). */
export const esquemaSolicitudRecuperacionCuenta = z.object({
  correo: z
    .string({ message: MENSAJES_RECUPERACION.CORREO_INVALIDO })
    .transform(normalizarCorreo)
    .pipe(z.string().email(MENSAJES_RECUPERACION.CORREO_INVALIDO)),
});

export type SolicitudRecuperacionCuenta = z.output<typeof esquemaSolicitudRecuperacionCuenta>;

export interface RespuestaRecuperacionCuenta {
  mensaje: string;
  token: string;
  enlace: string;
}

/** Esquema para validar el token vía GET /api/auth/validar-token-recuperacion?token=... */
export const esquemaConsultaTokenRecuperacion = z.object({
  token: z.string().min(1, 'El token es requerido'),
});

export type ConsultaTokenRecuperacion = z.output<typeof esquemaConsultaTokenRecuperacion>;

export interface RespuestaValidacionTokenRecuperacion {
  valido: boolean;
  correo?: string;
  mensaje?: string;
}

/** Esquema para restablecer la contraseña con el token (Escenarios 3, 4 y 5). */
export const esquemaSolicitudRestablecerContrasena = z
  .object({
    token: z.string().min(1, 'El token es requerido'),
    nuevaContrasena: z
      .string({ message: REGLAS_CONTRASENA.mensajeError })
      .min(REGLAS_CONTRASENA.longitudMinima, REGLAS_CONTRASENA.mensajeError)
      .regex(REGLAS_CONTRASENA.patronAlMenosUnaLetra, REGLAS_CONTRASENA.mensajeError)
      .regex(REGLAS_CONTRASENA.patronAlMenosUnNumero, REGLAS_CONTRASENA.mensajeError),
    confirmarContrasena: z.string().min(1, MENSAJES_RECUPERACION.CONTRASENAS_NO_COINCIDEN),
  })
  .refine((d) => d.nuevaContrasena === d.confirmarContrasena, {
    message: MENSAJES_RECUPERACION.CONTRASENAS_NO_COINCIDEN,
    path: ['confirmarContrasena'],
  });

export type SolicitudRestablecerContrasena = z.output<
  typeof esquemaSolicitudRestablecerContrasena
>;

export interface RespuestaRestablecerContrasena {
  mensaje: string;
}
