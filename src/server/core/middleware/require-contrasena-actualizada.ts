import { createMiddleware } from 'hono/factory';
import { CODIGOS_ERROR_ADMIN } from '@shared/usuarios/contrato-registro-admin';
import type { UsuarioSesion } from '@shared/usuarios';
import type { AppEnv } from '../env';
import { AppError } from '../errors';

/**
 * KAN-18 · Escenario 2: bloquea cualquier ruta si el usuario tiene la bandera
 * debeCambiarContrasena=true. Solo permite pasar a PATCH /api/auth/cambiar-contrasena.
 *
 * Se monta en app.ts junto con requireAuth para los grupos protegidos.
 */
export const requireContrasenaActualizada = createMiddleware<AppEnv>(async (c, next) => {
  const usuario: UsuarioSesion | undefined = c.get('usuario');
  if (!usuario) {
    await next();
    return;
  }

  if (usuario.debeCambiarContrasena) {
    const metodo = c.req.method;
    const ruta = c.req.path;
    // Dejar pasar solo el endpoint de cambio de contraseña.
    const esCambioDeContrasena = metodo === 'PATCH' && ruta.endsWith('/auth/cambiar-contrasena');
    if (!esCambioDeContrasena) {
      throw new AppError(
        403,
        CODIGOS_ERROR_ADMIN.DEBE_CAMBIAR_CONTRASENA,
        'Debes cambiar tu contraseña antes de continuar.',
      );
    }
  }

  await next();
});
