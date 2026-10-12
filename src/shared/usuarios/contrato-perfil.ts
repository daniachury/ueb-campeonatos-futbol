import { z } from 'zod';
import type { Rol } from '../constants';
import {
  REGLAS_CORREO,
  REGLAS_CONTRASENA,
  REGLAS_NOMBRE_COMPLETO,
  REGLAS_TELEFONO,
  normalizarCorreo,
  normalizarNombreCompleto,
  normalizarTelefono,
} from './reglas-registro-jugador';

/** Rutas relativas a /api para la gestión del perfil (KAN-19 · UEB-Proyect-06). */
export const RUTAS_API_PERFIL = {
  PERFIL: '/me',
  CAMBIAR_CONTRASENA: '/me/contrasena',
  CAMBIAR_CONTRASENA_ALIAS: '/me/contraseña',
} as const;

/** Códigos de error específicos para el perfil de usuario. */
export const CODIGOS_ERROR_PERFIL = {
  CREDENCIALES_INCORRECTAS: 'CREDENCIALES_INCORRECTAS',
  CORREO_YA_REGISTRADO: 'CORREO_YA_REGISTRADO',
  CONTRASENA_ACTUAL_REQUERIDA: 'CONTRASENA_ACTUAL_REQUERIDA',
} as const;

/** Perfil del usuario autenticado devuelto por GET y PATCH /api/me. */
export interface PerfilUsuario {
  id: string;
  nombreCompleto: string;
  correo: string;
  telefono: string;
  rol: Rol;
}

/** Esquema para actualizar datos de perfil (PATCH /api/me). */
export const esquemaActualizarPerfil = z
  .object({
    nombreCompleto: z
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
      )
      .optional(),
    correo: z
      .string({ message: REGLAS_CORREO.mensajeFormatoInvalido })
      .transform(normalizarCorreo)
      .pipe(
        z
          .string()
          .max(REGLAS_CORREO.longitudMaxima, REGLAS_CORREO.mensajeFormatoInvalido)
          .regex(REGLAS_CORREO.patronFormato, REGLAS_CORREO.mensajeFormatoInvalido),
      )
      .optional(),
    telefono: z
      .string({ message: REGLAS_TELEFONO.mensajeError })
      .transform(normalizarTelefono)
      .pipe(z.string().regex(REGLAS_TELEFONO.patronFormato, REGLAS_TELEFONO.mensajeError))
      .optional(),
    contrasenaActual: z.string().optional(),
  })
  // Campos prohibidos como rol e id son ignorados silenciosamente (strip por defecto en Zod).
  .strip();

export type SolicitudActualizarPerfil = z.infer<typeof esquemaActualizarPerfil>;

/** Esquema para cambiar contraseña desde el perfil (POST /api/me/contrasena). */
export const esquemaCambiarContrasenaPerfil = z
  .object({
    contrasenaActual: z.string().min(1, 'Ingresa tu contraseña actual'),
    nuevaContrasena: z
      .string({ message: REGLAS_CONTRASENA.mensajeError })
      .min(REGLAS_CONTRASENA.longitudMinima, REGLAS_CONTRASENA.mensajeError)
      .regex(REGLAS_CONTRASENA.patronAlMenosUnaLetra, REGLAS_CONTRASENA.mensajeError)
      .regex(REGLAS_CONTRASENA.patronAlMenosUnNumero, REGLAS_CONTRASENA.mensajeError),
    confirmarContrasena: z.string().min(1, 'Confirma tu nueva contraseña'),
  })
  .refine((datos) => datos.nuevaContrasena === datos.confirmarContrasena, {
    message: REGLAS_CONTRASENA.mensajeConfirmacionDistinta,
    path: ['confirmarContrasena'],
  });

export type SolicitudCambiarContrasenaPerfil = z.infer<typeof esquemaCambiarContrasenaPerfil>;

/** Respuesta exitosa al cambiar la contraseña. */
export interface RespuestaCambioContrasena {
  mensaje: string;
}
