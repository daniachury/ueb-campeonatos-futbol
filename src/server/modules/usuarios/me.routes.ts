import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import {
  CODIGOS_ERROR_PERFIL,
  esquemaActualizarPerfil,
  esquemaCambiarContrasenaPerfil,
  type PerfilUsuario,
  type RespuestaCambioContrasena,
} from '@shared/usuarios/contrato-perfil';
import { COOKIE_DE_SESION } from '../../core/cookie-de-sesion';
import type { AppEnv } from '../../core/env';
import { AppError, errores } from '../../core/errors';
import { siFallaLaValidacion } from '../../core/validacion';
import { calcularHashDeToken } from '../auth/sesiones.service';
import { ErrorContrasenaActualIncorrecta } from './aplicacion/errores/error-contrasena-actual-incorrecta';
import { ErrorCorreoYaRegistrado } from './aplicacion/errores/error-correo-ya-registrado';
import { ErrorDeValidacionDeDominio } from './dominio/errores/error-de-validacion-dominio';
import { crearActualizarPerfil } from './infraestructura/crear-actualizar-perfil';
import { crearCambiarContrasenaPerfil } from './infraestructura/crear-cambiar-contrasena-perfil';
import { RepositorioDeUsuariosD1 } from './infraestructura/repositorio-de-usuarios-d1';

/**
 * Rutas de perfil montadas en /api/me (KAN-19 · UEB-Proyect-06).
 * Todas las rutas requieren sesión autenticada (requireAuth configurado en app.ts).
 */
export const meRoutes = new Hono<AppEnv>()
  /**
   * GET /api/me — Obtener los datos del perfil del usuario autenticado.
   */
  .get('/', async (c) => {
    const usuarioSesion = c.get('usuario');
    const repo = new RepositorioDeUsuariosD1(c.env.DB);
    const usuario = await repo.buscarPorId(usuarioSesion.id);

    if (!usuario) {
      throw new AppError(404, 'NO_ENCONTRADO', 'Usuario no encontrado');
    }

    const perfil: PerfilUsuario = {
      id: usuario.id,
      nombreCompleto: usuario.nombreCompleto.valor,
      correo: usuario.correo.valor,
      telefono: usuario.telefono.valor,
      rol: usuario.rol,
    };

    return c.json(perfil, 200);
  })

  /**
   * PATCH /api/me — Actualizar nombre, teléfono y/o correo.
   * Si cambia el correo, exige contrasenaActual correcta.
   * Campos id o rol en el body son ignorados silenciosamente (Escenario 6).
   */
  .patch('/', zValidator('json', esquemaActualizarPerfil, siFallaLaValidacion), async (c) => {
    const usuarioSesion = c.get('usuario');
    const solicitud = c.req.valid('json');

    try {
      const casoDeUso = crearActualizarPerfil(c.env.DB);
      const perfilActualizado: PerfilUsuario = await casoDeUso.ejecutar(
        usuarioSesion.id,
        solicitud,
      );
      return c.json(perfilActualizado, 200);
    } catch (error) {
      if (error instanceof ErrorContrasenaActualIncorrecta) {
        throw new AppError(
          401,
          CODIGOS_ERROR_PERFIL.CREDENCIALES_INCORRECTAS,
          error.message,
        );
      }
      if (error instanceof ErrorCorreoYaRegistrado) {
        throw new AppError(
          409,
          CODIGOS_ERROR_PERFIL.CORREO_YA_REGISTRADO,
          error.message,
        );
      }
      if (error instanceof ErrorDeValidacionDeDominio) {
        throw errores.validacion([{ campo: error.campo, mensaje: error.message }]);
      }
      throw error;
    }
  })

  /**
   * POST /api/me/contrasena — Cambiar contraseña e invalidar otras sesiones abiertas (Escenario 4).
   */
  .post(
    '/contrasena',
    zValidator('json', esquemaCambiarContrasenaPerfil, siFallaLaValidacion),
    async (c) => {
      const usuarioSesion = c.get('usuario');
      const solicitud = c.req.valid('json');

      const tokenCookie = getCookie(c, COOKIE_DE_SESION.nombre);
      const hashTokenActual = tokenCookie ? await calcularHashDeToken(tokenCookie) : undefined;

      try {
        const casoDeUso = crearCambiarContrasenaPerfil(c.env.DB);
        const respuesta: RespuestaCambioContrasena = await casoDeUso.ejecutar(
          usuarioSesion.id,
          solicitud,
          hashTokenActual,
        );
        return c.json(respuesta, 200);
      } catch (error) {
        if (error instanceof ErrorContrasenaActualIncorrecta) {
          throw new AppError(
            401,
            CODIGOS_ERROR_PERFIL.CREDENCIALES_INCORRECTAS,
            error.message,
          );
        }
        if (error instanceof ErrorDeValidacionDeDominio) {
          throw errores.validacion([{ campo: error.campo, mensaje: error.message }]);
        }
        throw error;
      }
    },
  )

  /**
   * POST /api/me/contraseña — Alias UTF-8 para clientes que envían la eñe directamente.
   */
  .post(
    '/contraseña',
    zValidator('json', esquemaCambiarContrasenaPerfil, siFallaLaValidacion),
    async (c) => {
      const usuarioSesion = c.get('usuario');
      const solicitud = c.req.valid('json');

      const tokenCookie = getCookie(c, COOKIE_DE_SESION.nombre);
      const hashTokenActual = tokenCookie ? await calcularHashDeToken(tokenCookie) : undefined;

      try {
        const casoDeUso = crearCambiarContrasenaPerfil(c.env.DB);
        const respuesta: RespuestaCambioContrasena = await casoDeUso.ejecutar(
          usuarioSesion.id,
          solicitud,
          hashTokenActual,
        );
        return c.json(respuesta, 200);
      } catch (error) {
        if (error instanceof ErrorContrasenaActualIncorrecta) {
          throw new AppError(
            401,
            CODIGOS_ERROR_PERFIL.CREDENCIALES_INCORRECTAS,
            error.message,
          );
        }
        if (error instanceof ErrorDeValidacionDeDominio) {
          throw errores.validacion([{ campo: error.campo, mensaje: error.message }]);
        }
        throw error;
      }
    },
  );
