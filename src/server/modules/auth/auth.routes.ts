import { zValidator } from '@hono/zod-validator';
import { Hono, type Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import type { ErrorDeCampo } from '@shared/api';
import {
  CODIGOS_ERROR_SESION,
  esquemaSolicitudInicioDeSesion,
  type SolicitudInicioDeSesion,
  type UsuarioAutenticado,
} from '@shared/usuarios/contrato-inicio-de-sesion';
import {
  CODIGOS_ERROR_REGISTRO,
  type JugadorRegistrado,
} from '@shared/usuarios/contrato-registro-jugador';
import {
  esquemaSolicitudRegistroJugador,
  type SolicitudRegistroJugador,
} from '@shared/usuarios/esquema-registro-jugador';
import { COOKIE_DE_SESION } from '../../core/cookie-de-sesion';
import type { AppEnv } from '../../core/env';
import { AppError, errores } from '../../core/errors';
import { limitarPeticionesPorIp } from '../../core/middleware/limite-de-peticiones';
import { siFallaLaValidacion } from '../../core/validacion';
import { ErrorCorreoYaRegistrado } from '../usuarios/aplicacion/errores/error-correo-ya-registrado';
import {
  ErrorCredencialesIncorrectas,
  ErrorCuentaDesactivada,
  ErrorDemasiadosIntentos,
} from '../usuarios/aplicacion/errores/errores-de-inicio-de-sesion';
import type { IniciarSesion } from '../usuarios/aplicacion/iniciar-sesion';
import type { RegistrarJugador } from '../usuarios/aplicacion/registrar-jugador';
import { ErrorDeValidacionDeDominio } from '../usuarios/dominio/errores/error-de-validacion-dominio';
import { crearIniciarSesion } from '../usuarios/infraestructura/crear-iniciar-sesion';
import { crearRegistrarJugador } from '../usuarios/infraestructura/crear-registrar-jugador';
import { crearSesionesRepository } from './sesiones.repository';
import { crearSesionesService } from './sesiones.service';

/**
 * Épica E2 · Autenticación. Rutas públicas en /api/auth.
 * - UEB-Proyect-03 (KAN-16) · POST /registro
 * - UEB-Proyect-04 (KAN-17) · POST /login, POST /logout y GET /sesion
 */
export const authRoutes = new Hono<AppEnv>()
  .post(
    '/registro',
    // Evita que un mismo cliente cree cuentas sin parar.
    limitarPeticionesPorIp('LIMITE_DE_REGISTRO'),
    zValidator('json', esquemaSolicitudRegistroJugador, siFallaLaValidacion),
    async (c) => {
      // UEB-Proyect-03 (KAN-16) · Registro de jugador. El esquema ya descartó cualquier "rol".
      const jugador = await registrarOTraducirError(
        crearRegistrarJugador(c.env.DB),
        c.req.valid('json'),
      );

      // Escenario 1: queda con la sesión iniciada.
      await iniciarSesionConCookie(c, jugador.id);
      return c.json(jugador, 201);
    },
  )
  .post(
    '/login',
    zValidator('json', esquemaSolicitudInicioDeSesion, siFallaLaValidacion),
    async (c) => {
      // UEB-Proyect-04 (KAN-17) · Escenarios 1 a 5.
      const usuario = await iniciarSesionOTraducirError(
        crearIniciarSesion(c.env.DB),
        c.req.valid('json'),
      );
      await iniciarSesionConCookie(c, usuario.id);
      return c.json(usuario);
    },
  )
  .post('/logout', async (c) => {
    // Escenario 6: el token queda invalidado aunque alguien guarde una copia de la cookie.
    const token = getCookie(c, COOKIE_DE_SESION.nombre);
    if (token) {
      await crearSesionesService(crearSesionesRepository(c.env.DB)).cerrar(token);
    }
    deleteCookie(c, COOKIE_DE_SESION.nombre, { path: '/', secure: true });
    return c.body(null, 204);
  })
  .get('/sesion', async (c) => {
    // La app pregunta al abrir quién tiene la sesión (v3 · S01 «Comprobando tu sesión…»).
    c.header('Cache-Control', 'no-store');
    const token = getCookie(c, COOKIE_DE_SESION.nombre);
    if (!token) throw errores.noAutenticado();

    const resultado = await crearSesionesService(crearSesionesRepository(c.env.DB)).validar(token);
    if (resultado.estado !== 'valida') {
      deleteCookie(c, COOKIE_DE_SESION.nombre, { path: '/', secure: true });
      throw resultado.estado === 'expirada' ? errores.sesionExpirada() : errores.noAutenticado();
    }
    const usuario: UsuarioAutenticado = resultado.usuario;
    return c.json(usuario);
  });

/** Crea la sesión de 24 h y la envía en una cookie que JavaScript no puede leer. */
async function iniciarSesionConCookie(c: Context<AppEnv>, usuarioId: string): Promise<void> {
  const sesion = await crearSesionesService(crearSesionesRepository(c.env.DB)).iniciar(usuarioId);
  setCookie(c, COOKIE_DE_SESION.nombre, sesion.token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: COOKIE_DE_SESION.duracionEnSegundos,
    expires: sesion.expiraEn,
  });
}

/** Convierte los errores del inicio de sesión en respuestas 401, 429 y 403. */
async function iniciarSesionOTraducirError(
  iniciarSesion: IniciarSesion,
  solicitud: SolicitudInicioDeSesion,
): Promise<UsuarioAutenticado> {
  try {
    return await iniciarSesion.ejecutar(solicitud);
  } catch (error) {
    if (error instanceof ErrorCredencialesIncorrectas) {
      throw new AppError(401, CODIGOS_ERROR_SESION.CREDENCIALES_INCORRECTAS, error.message);
    }
    if (error instanceof ErrorDemasiadosIntentos) {
      throw new AppError(429, CODIGOS_ERROR_SESION.DEMASIADOS_INTENTOS, error.message);
    }
    if (error instanceof ErrorCuentaDesactivada) {
      throw new AppError(403, CODIGOS_ERROR_SESION.CUENTA_DESACTIVADA, error.message);
    }
    throw error;
  }
}

/** Convierte los errores del caso de uso en las respuestas estándar de la API (400 y 409). */
async function registrarOTraducirError(
  registrarJugador: RegistrarJugador,
  solicitud: SolicitudRegistroJugador,
): Promise<JugadorRegistrado> {
  try {
    return await registrarJugador.ejecutar(solicitud);
  } catch (error) {
    if (error instanceof ErrorDeValidacionDeDominio) {
      const detalles: ErrorDeCampo[] = [{ campo: error.campo, mensaje: error.message }];
      throw errores.validacion(detalles);
    }
    if (error instanceof ErrorCorreoYaRegistrado) {
      const detalles: ErrorDeCampo[] = [{ campo: error.campo, mensaje: error.message }];
      throw errores.conflicto(CODIGOS_ERROR_REGISTRO.CORREO_YA_REGISTRADO, error.message, detalles);
    }
    throw error;
  }
}
