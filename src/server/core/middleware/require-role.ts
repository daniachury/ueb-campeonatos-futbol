import { createMiddleware } from 'hono/factory';
import type { Rol } from '@shared/constants';
import type { UsuarioSesion } from '@shared/usuarios';
import type { AppEnv } from '../env';
import { errores } from '../errors';

/**
 * Permite el paso solo a los roles indicados (UEB-Proyect-02).
 * Debe ir después de `requireAuth`, que es quien guarda el usuario en el contexto.
 */
export const requireRole = (...roles: Rol[]) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const usuario: UsuarioSesion | undefined = c.get('usuario');
    if (!usuario) throw errores.noAutenticado();
    if (!roles.includes(usuario.rol)) throw errores.sinPermiso();
    await next();
  });
