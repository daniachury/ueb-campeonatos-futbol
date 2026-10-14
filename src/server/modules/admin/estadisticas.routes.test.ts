import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { describe, expect, it } from 'vitest';
import type { D1Database } from '@cloudflare/workers-types';
import type { UsuarioSesion } from '@shared/usuarios';
import type { AppEnv } from '../../core/env';
import { manejarError } from '../../core/errors';
import { requireRole } from '../../core/middleware/require-role';
import { crearD1Falsa } from '../../test/d1-falsa';
import { estadisticasAdminRoutes } from './estadisticas.routes';

const conUsuario = (usuario?: UsuarioSesion) =>
  createMiddleware<AppEnv>(async (c, next) => {
    if (usuario) {
      c.set('usuario', usuario);
    }
    await next();
  });

function crearTestApp(db: D1Database, usuario?: UsuarioSesion) {
  const app = new Hono<AppEnv>();
  if (usuario) {
    app.use('*', conUsuario(usuario));
  }
  app.use('/admin/*', requireRole('admin'));
  app.route('/admin/estadisticas', estadisticasAdminRoutes);
  app.onError(manejarError);

  return {
    pedir: (ruta: string, init?: RequestInit) => app.request(ruta, init, { DB: db }),
  };
}

describe('Rutas HTTP /api/admin/estadisticas', () => {
  const admin: UsuarioSesion = {
    id: 'admin-1',
    rol: 'admin',
    nombre: 'Admin Test',
    debeCambiarContrasena: false,
  };

  const jugador: UsuarioSesion = {
    id: 'jugador-1',
    rol: 'jugador',
    nombre: 'Jugador Test',
    debeCambiarContrasena: false,
  };

  it('GET /admin/estadisticas responde 200 con el resumen para administradores', async () => {
    const { db } = crearD1Falsa(() => [
      {
        torneos: 4,
        equipos: 5,
        partidos: 3,
        jugadores: 52,
        pendientes: 2,
      },
    ]);

    const { pedir } = crearTestApp(db, admin);
    const res = await pedir('/admin/estadisticas');

    expect(res.status).toBe(200);
    const datos = await res.json();
    expect(datos).toEqual({
      torneos: 4,
      equipos: 5,
      partidos: 3,
      jugadores: 52,
      pendientes: 2,
    });
  });

  it('GET /admin/estadisticas responde 403 Forbidden para rol jugador', async () => {
    const { db } = crearD1Falsa(() => []);
    const { pedir } = crearTestApp(db, jugador);
    const res = await pedir('/admin/estadisticas');

    expect(res.status).toBe(403);
  });

  it('GET /admin/estadisticas responde 401 si no hay sesión autenticada', async () => {
    const { db } = crearD1Falsa(() => []);
    const { pedir } = crearTestApp(db);
    const res = await pedir('/admin/estadisticas');

    expect(res.status).toBe(401);
  });
});
