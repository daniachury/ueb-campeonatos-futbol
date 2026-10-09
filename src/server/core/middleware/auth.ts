import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../env';
import { errores } from '../errors';

/**
 * Exige una sesión válida antes de llegar a la ruta.
 *
 * TODO(UEB-Proyect-04 · KAN-17): leer `Authorization: Bearer <token>`, validarlo contra la
 * tabla `sesiones` (vigencia de 24 h, usuario activo), guardar el usuario con
 * `c.set('usuario', usuario)` y continuar con `await next()`.
 *
 * Mientras la historia no esté implementada, toda ruta protegida responde 401:
 * el sistema es seguro por defecto.
 */
export const requireAuth = createMiddleware<AppEnv>(async () => {
  throw errores.noAutenticado();
});
