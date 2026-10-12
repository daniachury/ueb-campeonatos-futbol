import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import { crearSesionesRepository } from '../../modules/auth/sesiones.repository';
import { crearSesionesService } from '../../modules/auth/sesiones.service';
import { COOKIE_DE_SESION } from '../cookie-de-sesion';
import type { AppEnv } from '../env';
import { errores } from '../errors';

/**
 * Exige una sesión válida antes de llegar a la ruta (UEB-Proyect-04 · KAN-17).
 * Lee la cookie HttpOnly `sesion`, la valida contra la tabla `sesiones` (24 h, usuario activo)
 * y guarda el usuario en el contexto con `c.set('usuario', …)`.
 *
 * - Sin cookie o con un token cerrado: 401 NO_AUTENTICADO.
 * - Con un token vencido: 401 SESION_EXPIRADA, para que la app muestre «Tu sesión expiró».
 */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const token = getCookie(c, COOKIE_DE_SESION.nombre);
  if (!token) throw errores.noAutenticado();

  const resultado = await crearSesionesService(crearSesionesRepository(c.env.DB)).validar(token);
  if (resultado.estado === 'expirada') throw errores.sesionExpirada();
  if (resultado.estado === 'invalida') throw errores.noAutenticado();

  const { id, nombreCompleto, rol } = resultado.usuario;
  c.set('usuario', { id, nombre: nombreCompleto, rol });
  // Escenario 6: después de cerrar sesión, «Atrás» no debe mostrar datos privados guardados.
  c.header('Cache-Control', 'no-store');
  await next();
});
