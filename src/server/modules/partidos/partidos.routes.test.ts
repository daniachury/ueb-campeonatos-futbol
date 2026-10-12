import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { describe, expect, it } from 'vitest';
import type { D1Database } from '@cloudflare/workers-types';
import type { UsuarioSesion } from '@shared/usuarios';
import type { AppEnv } from '../../core/env';
import { manejarError } from '../../core/errors';
import { requireRole } from '../../core/middleware/require-role';
import { crearD1Falsa } from '../../test/d1-falsa';
import { partidosAdminRoutes, partidosRoutes } from './partidos.routes';

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
  app.route('/partidos', partidosRoutes);
  app.route('/admin/partidos', partidosAdminRoutes);
  app.onError(manejarError);

  return {
    pedir: (ruta: string, init?: RequestInit) => app.request(ruta, init, { DB: db }),
  };
}

describe('Rutas HTTP /api/admin/partidos (KAN-35)', () => {
  const adminSesion: UsuarioSesion = {
    id: 'admin-1',
    nombre: 'Administrador',
    rol: 'admin',
    debeCambiarContrasena: false,
  };

  const jugadorSesion: UsuarioSesion = {
    id: 'jugador-1',
    nombre: 'Carlos Jugador',
    rol: 'jugador',
    debeCambiarContrasena: false,
  };

  it('GET /admin/partidos/:id responde 200 con el partido para admin', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM partidos p')) {
        return [
          {
            id: 'p-1',
            fecha_id: 'f-1',
            torneo_id: 't-1',
            local_id: 'eq-1',
            visitante_id: 'eq-2',
            estado: 'POR_PROGRAMAR',
            fecha_hora: null,
            cancha: null,
            cancha_id: null,
            local_nombre: 'Halcones',
            local_color: '#ff0000',
            visitante_nombre: 'Cóndores',
            visitante_color: '#00ff00',
            cancha_nombre: null,
            sede_nombre: null,
          },
        ];
      }
      return [];
    });

    const cliente = crearTestApp(db, adminSesion);
    const res = await cliente.pedir('/admin/partidos/p-1');

    expect(res.status).toBe(200);
    const datos = await res.json<{ id: string; localNombre: string }>();
    expect(datos.id).toBe('p-1');
    expect(datos.localNombre).toBe('Halcones');
  });

  it('GET /admin/partidos/:id responde 403 para rol jugador', async () => {
    const { db } = crearD1Falsa(() => []);
    const cliente = crearTestApp(db, jugadorSesion);

    const res = await cliente.pedir('/admin/partidos/p-1');
    expect(res.status).toBe(403);
  });

  it('PATCH /admin/partidos/:id/programar programa el partido exitosamente (200)', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM partidos p') && sql.includes('WHERE p.id = ?')) {
        return [
          {
            id: 'p-1',
            fecha_id: 'f-1',
            torneo_id: 't-1',
            local_id: 'eq-1',
            visitante_id: 'eq-2',
            estado: 'POR_PROGRAMAR',
            fecha_hora: null,
            cancha: null,
            cancha_id: null,
            local_nombre: 'Halcones',
            local_color: null,
            visitante_nombre: 'Cóndores',
            visitante_color: null,
            cancha_nombre: null,
            sede_nombre: null,
          },
        ];
      }
      if (sql.includes('FROM canchas c') && sql.includes('WHERE c.id = ?')) {
        return [
          {
            id: 'cancha-1',
            nombre: 'Cancha 1',
            activa: 1,
            superficie: 'Sintética',
            sede_id: 'sede-1',
            sede_nombre: 'Complejo El Bosque',
          },
        ];
      }
      if (sql.includes("WHERE p.estado = 'PROGRAMADO'")) {
        return []; // Sin otros partidos programados
      }
      return [];
    });

    const cliente = crearTestApp(db, adminSesion);
    const res = await cliente.pedir('/admin/partidos/p-1/programar', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        canchaId: 'cancha-1',
        fechaHora: '2026-10-25T14:00:00.000Z',
      }),
    });

    expect(res.status).toBe(200);
  });

  it('PATCH /admin/partidos/:id/programar responde 409 cuando hay cruce de horarios', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM partidos p') && sql.includes('WHERE p.id = ?')) {
        return [
          {
            id: 'p-1',
            fecha_id: 'f-1',
            torneo_id: 't-1',
            local_id: 'eq-1',
            visitante_id: 'eq-2',
            estado: 'POR_PROGRAMAR',
            fecha_hora: null,
            cancha: null,
            cancha_id: null,
            local_nombre: 'Halcones',
            local_color: null,
            visitante_nombre: 'Cóndores',
            visitante_color: null,
            cancha_nombre: null,
            sede_nombre: null,
          },
        ];
      }
      if (sql.includes('FROM canchas c')) {
        return [
          {
            id: 'cancha-1',
            nombre: 'Cancha 1',
            activa: 1,
            superficie: 'Sintética',
            sede_id: 'sede-1',
            sede_nombre: 'Complejo El Bosque',
          },
        ];
      }
      if (sql.includes("WHERE p.estado = 'PROGRAMADO'")) {
        // Ya hay un partido en cancha-1 a las 14:00
        return [
          {
            id: 'p-ocupado',
            local_id: 'eq-3',
            local_nombre: 'Tigres',
            visitante_id: 'eq-4',
            visitante_nombre: 'Leones',
            cancha_id: 'cancha-1',
            fecha_hora: '2026-10-25T14:00:00.000Z',
            cancha_nombre: 'Cancha 1',
            sede_nombre: 'Complejo El Bosque',
          },
        ];
      }
      return [];
    });

    const cliente = crearTestApp(db, adminSesion);
    const res = await cliente.pedir('/admin/partidos/p-1/programar', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        canchaId: 'cancha-1',
        fechaHora: '2026-10-25T14:30:00.000Z',
      }),
    });

    expect(res.status).toBe(409);
    const cuerpo = await res.json<{ codigo: string; mensaje: string }>();
    expect(cuerpo.codigo).toBe('CRUCE_HORARIO');
    expect(cuerpo.mensaje).toContain('Cruce de horario');
  });

  it('PATCH /admin/partidos/:id/desprogramar revierte estado a POR_PROGRAMAR (200)', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM partidos p') && sql.includes('WHERE p.id = ?')) {
        return [
          {
            id: 'p-1',
            fecha_id: 'f-1',
            torneo_id: 't-1',
            local_id: 'eq-1',
            visitante_id: 'eq-2',
            estado: 'PROGRAMADO',
            fecha_hora: '2026-10-25T14:00:00.000Z',
            cancha: 'Complejo El Bosque - Cancha 1',
            cancha_id: 'cancha-1',
            local_nombre: 'Halcones',
            local_color: null,
            visitante_nombre: 'Cóndores',
            visitante_color: null,
            cancha_nombre: 'Cancha 1',
            sede_nombre: 'Complejo El Bosque',
          },
        ];
      }
      return [];
    });

    const cliente = crearTestApp(db, adminSesion);
    const res = await cliente.pedir('/admin/partidos/p-1/desprogramar', {
      method: 'PATCH',
    });

    expect(res.status).toBe(200);
  });

  it('GET /partidos/:id responde 200 para cualquier usuario con sesión', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM partidos p')) {
        return [
          {
            id: 'p-1',
            fecha_id: 'f-1',
            torneo_id: 't-1',
            local_id: 'eq-1',
            visitante_id: 'eq-2',
            estado: 'POR_PROGRAMAR',
            fecha_hora: null,
            cancha: null,
            cancha_id: null,
            local_nombre: 'Halcones',
            local_color: null,
            visitante_nombre: 'Cóndores',
            visitante_color: null,
            cancha_nombre: null,
            sede_nombre: null,
          },
        ];
      }
      return [];
    });

    const cliente = crearTestApp(db, jugadorSesion);
    const res = await cliente.pedir('/partidos/p-1');
    expect(res.status).toBe(200);
  });
});
