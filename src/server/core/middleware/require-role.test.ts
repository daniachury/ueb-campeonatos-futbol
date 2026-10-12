import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { describe, expect, it } from 'vitest';
import type { UsuarioSesion } from '@shared/usuarios';
import type { AppEnv } from '../env';
import { manejarError } from '../errors';
import { requireRole } from './require-role';

/** Simula lo que hará requireAuth cuando exista: dejar el usuario en el contexto. */
const conUsuario = (usuario?: UsuarioSesion) =>
  createMiddleware<AppEnv>(async (c, next) => {
    if (usuario) c.set('usuario', usuario);
    await next();
  });

function appProtegida(usuario?: UsuarioSesion) {
  const app = new Hono<AppEnv>();
  app.use('*', conUsuario(usuario), requireRole('admin'));
  app.get('/', (c) => c.json({ ok: true }));
  app.onError(manejarError);
  return app;
}

describe('requireRole', () => {
  it('deja pasar al rol permitido', async () => {
    const respuesta = await appProtegida({ id: 'u1', nombre: 'Ana', rol: 'admin' }).request('/');

    expect(respuesta.status).toBe(200);
  });

  it('responde 403 a un jugador', async () => {
    const respuesta = await appProtegida({ id: 'u2', nombre: 'Luis', rol: 'jugador' }).request('/');

    expect(respuesta.status).toBe(403);
    expect(await respuesta.json()).toMatchObject({ codigo: 'SIN_PERMISO' });
  });

  it('responde 401 si no hay usuario en el contexto', async () => {
    const respuesta = await appProtegida().request('/');

    expect(respuesta.status).toBe(401);
  });
});
