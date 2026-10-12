import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { CODIGOS_ERROR_ADMIN } from '@shared/usuarios/contrato-registro-admin';
import type { UsuarioSesion } from '@shared/usuarios';
import type { AppEnv } from '../env';
import { AppError } from '../errors';
import { requireContrasenaActualizada } from './require-contrasena-actualizada';

function appConMiddleware(usuario?: UsuarioSesion) {
  const app = new Hono<AppEnv>();

  app.onError((err, c) => {
    if (err instanceof AppError) {
      return c.json({ codigo: err.codigo, mensaje: err.message }, err.status as 403);
    }
    return c.json({ error: (err as Error).message }, 500);
  });

  if (usuario) {
    app.use('*', async (c, next) => {
      c.set('usuario', usuario);
      await next();
    });
  }

  app.use('*', requireContrasenaActualizada);
  app.get('/api/torneos', (c) => c.json({ ok: true }));
  app.patch('/api/auth/cambiar-contrasena', (c) => c.json({ ok: true }));

  return app;
}

describe('requireContrasenaActualizada (KAN-18 · Escenario 2)', () => {
  it('deja pasar cuando no hay usuario en sesión', async () => {
    const app = appConMiddleware();
    const res = await app.request('/api/torneos');
    expect(res.status).toBe(200);
  });

  it('deja pasar cuando debeCambiarContrasena es false', async () => {
    const app = appConMiddleware({
      id: 'admin-1',
      nombre: 'Admin Regular',
      rol: 'admin',
      debeCambiarContrasena: false,
    });
    const res = await app.request('/api/torneos');
    expect(res.status).toBe(200);
  });

  it('bloquea con 403 DEBE_CAMBIAR_CONTRASENA cuando debeCambiarContrasena es true en rutas ordinarias', async () => {
    const app = appConMiddleware({
      id: 'admin-temp',
      nombre: 'Admin Nuevo',
      rol: 'admin',
      debeCambiarContrasena: true,
    });
    const res = await app.request('/api/torneos');
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toEqual({
      codigo: CODIGOS_ERROR_ADMIN.DEBE_CAMBIAR_CONTRASENA,
      mensaje: 'Debes cambiar tu contraseña antes de continuar.',
    });
  });

  it('permite acceder a PATCH /api/auth/cambiar-contrasena aunque debeCambiarContrasena sea true', async () => {
    const app = appConMiddleware({
      id: 'admin-temp',
      nombre: 'Admin Nuevo',
      rol: 'admin',
      debeCambiarContrasena: true,
    });
    const res = await app.request('/api/auth/cambiar-contrasena', { method: 'PATCH' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });
});
