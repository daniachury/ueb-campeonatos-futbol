import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import {
  CODIGOS_ERROR_ADMIN,
  type AdminPromovido,
  type AdminRegistrado,
} from '@shared/usuarios/contrato-registro-admin';
import type { AppEnv } from '../../core/env';
import { AppError, errores } from '../../core/errors';
import { siFallaLaValidacion } from '../../core/validacion';
import { ErrorCorreoEsJugador } from './aplicacion/errores/error-correo-es-jugador';
import { ErrorCorreoYaEsAdmin } from './aplicacion/errores/error-correo-ya-es-admin';
import { ErrorJugadorEnTorneoEnCurso } from './aplicacion/errores/error-jugador-en-torneo-en-curso';
import { ErrorJugadorNoEncontrado } from './aplicacion/errores/error-jugador-no-encontrado';
import { ErrorDeValidacionDeDominio } from './dominio/errores/error-de-validacion-dominio';
import { crearPromoverJugadorAAdmin } from './infraestructura/crear-promover-jugador-a-admin';
import { crearRegistrarAdministrador } from './infraestructura/crear-registrar-administrador';
import {
  REGLAS_CORREO,
  REGLAS_NOMBRE_COMPLETO,
  REGLAS_TELEFONO,
  normalizarCorreo,
  normalizarNombreCompleto,
  normalizarTelefono,
} from '../../../shared/usuarios/reglas-registro-jugador';

/** Esquema Zod para POST /admin/usuarios — reutiliza las reglas de UEB-Proyect-03. */
const esquemaSolicitudAdmin = z.object({
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
    ),
  correo: z
    .string({ message: REGLAS_CORREO.mensajeFormatoInvalido })
    .transform(normalizarCorreo)
    .pipe(
      z
        .string()
        .max(REGLAS_CORREO.longitudMaxima, REGLAS_CORREO.mensajeFormatoInvalido)
        .regex(REGLAS_CORREO.patronFormato, REGLAS_CORREO.mensajeFormatoInvalido),
    ),
  telefono: z
    .string({ message: REGLAS_TELEFONO.mensajeError })
    .transform(normalizarTelefono)
    .pipe(z.string().regex(REGLAS_TELEFONO.patronFormato, REGLAS_TELEFONO.mensajeError)),
});

/**
 * Rutas de administración de usuarios montadas en /api/admin/usuarios.
 * La protección requireAuth + requireRole('admin') ya está en app.ts (línea 35).
 *
 * KAN-18 · UEB-Proyect-05:
 * - POST /          → Registrar administrador nuevo
 * - POST /:id/promover → Promover jugador existente a administrador
 */
export const usuariosAdminRoutes = new Hono<AppEnv>()
  .post('/', zValidator('json', esquemaSolicitudAdmin, siFallaLaValidacion), async (c) => {
    const admin = c.get('usuario');
    const solicitud = c.req.valid('json');

    try {
      const resultado: AdminRegistrado = await crearRegistrarAdministrador(c.env.DB).ejecutar(
        solicitud,
        admin.id,
      );
      return c.json(resultado, 201);
    } catch (error) {
      if (error instanceof ErrorDeValidacionDeDominio) {
        throw errores.validacion([{ campo: error.campo, mensaje: error.message }]);
      }
      if (error instanceof ErrorCorreoYaEsAdmin) {
        throw new AppError(409, CODIGOS_ERROR_ADMIN.CORREO_YA_ES_ADMIN, error.message);
      }
      if (error instanceof ErrorCorreoEsJugador) {
        // 409 con detalle para que el front muestre el diálogo de promoción.
        throw new AppError(409, CODIGOS_ERROR_ADMIN.CORREO_ES_JUGADOR, error.message, {
          jugadorId: error.jugadorId,
          nombreJugador: error.nombreJugador,
        });
      }
      throw error;
    }
  })

  .post('/:id/promover', async (c) => {
    const adminCreador = c.get('usuario');
    const jugadorId = c.req.param('id');

    try {
      const resultado: AdminPromovido = await crearPromoverJugadorAAdmin(c.env.DB).ejecutar(
        jugadorId,
        adminCreador.id,
      );
      return c.json(resultado, 200);
    } catch (error) {
      if (error instanceof ErrorJugadorNoEncontrado) {
        throw new AppError(404, 'NO_ENCONTRADO', error.message);
      }
      if (error instanceof ErrorCorreoYaEsAdmin) {
        throw new AppError(409, CODIGOS_ERROR_ADMIN.CORREO_YA_ES_ADMIN, error.message);
      }
      if (error instanceof ErrorJugadorEnTorneoEnCurso) {
        throw new AppError(409, CODIGOS_ERROR_ADMIN.JUGADOR_EN_TORNEO_EN_CURSO, error.message);
      }
      throw error;
    }
  });

/**
 * Rutas de usuarios autenticados montadas en /api/usuarios.
 * Pendientes: UEB-Proyect-06 (KAN-19) · GET/PATCH /me
 */
export const usuariosRoutes = new Hono<AppEnv>();
