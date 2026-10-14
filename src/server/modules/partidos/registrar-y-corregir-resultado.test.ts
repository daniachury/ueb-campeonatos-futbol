import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { describe, expect, it } from 'vitest';
import type { D1Database } from '@cloudflare/workers-types';
import type { UsuarioSesion } from '@shared/usuarios';
import type { AppEnv } from '../../core/env';
import { manejarError } from '../../core/errors';
import { requireRole } from '../../core/middleware/require-role';
import { crearD1Falsa } from '../../test/d1-falsa';
import { partidosAdminRoutes } from './partidos.routes';

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
  app.route('/admin/partidos', partidosAdminRoutes);
  app.onError(manejarError);

  return {
    pedir: (ruta: string, init?: RequestInit) => app.request(ruta, init, { DB: db }),
  };
}

describe('KAN-37 · Registrar resultado y estadísticas del partido', () => {
  const admin: UsuarioSesion = {
    id: 'admin-1',
    nombre: 'Administrador',
    rol: 'admin',
    debeCambiarContrasena: false,
  };

  const jugador: UsuarioSesion = {
    id: 'jugador-1',
    nombre: 'Carlos Jugador',
    rol: 'jugador',
    debeCambiarContrasena: false,
  };

  it('Escenario 1: Victoria local (2-1) actualiza el partido a estado JUGADO', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('UPDATE partidos SET goles_local = ?')) {
        return [];
      }
      if (sql.includes('FROM partidos p') && sql.includes('WHERE p.id = ?')) {
        return [
          {
            id: 'p-1',
            fecha_id: 'f-1',
            torneo_id: 't-1',
            local_id: 'eq-1',
            visitante_id: 'eq-2',
            estado: 'JUGADO',
            fecha_hora: null,
            cancha: null,
            cancha_id: null,
            local_nombre: 'Los Halcones',
            local_color: '#ff0000',
            visitante_nombre: 'Real Bosque',
            visitante_color: '#00ff00',
            cancha_nombre: null,
            sede_nombre: null,
            goles_local: 2,
            goles_visitante: 1,
          },
        ];
      }
      return [];
    });

    const cliente = crearTestApp(db, admin);
    const res = await cliente.pedir('/admin/partidos/p-1/resultado', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ golesLocal: 2, golesVisitante: 1 }),
    });

    expect(res.status).toBe(200);
    const datos = await res.json<{ id: string; estado: string }>();
    expect(datos.id).toBe('p-1');
    expect(datos.estado).toBe('JUGADO');
  });

  it('Escenario 2: Victoria visitante (0-3) registra correctamente el marcador', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM partidos p') && sql.includes('WHERE p.id = ?')) {
        return [
          {
            id: 'p-2',
            fecha_id: 'f-1',
            torneo_id: 't-1',
            local_id: 'eq-1',
            visitante_id: 'eq-2',
            estado: 'JUGADO',
            fecha_hora: null,
            cancha: null,
            cancha_id: null,
            local_nombre: 'Los Halcones',
            local_color: null,
            visitante_nombre: 'Real Bosque',
            visitante_color: null,
            cancha_nombre: null,
            sede_nombre: null,
          },
        ];
      }
      return [];
    });

    const cliente = crearTestApp(db, admin);
    const res = await cliente.pedir('/admin/partidos/p-2/resultado', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ golesLocal: 0, golesVisitante: 3 }),
    });

    expect(res.status).toBe(200);
  });

  it('Escenario 3: Empate (1-1) registra correctamente el resultado', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM partidos p') && sql.includes('WHERE p.id = ?')) {
        return [
          {
            id: 'p-3',
            fecha_id: 'f-1',
            torneo_id: 't-1',
            local_id: 'eq-1',
            visitante_id: 'eq-2',
            estado: 'JUGADO',
            fecha_hora: null,
            cancha: null,
            cancha_id: null,
            local_nombre: 'Los Halcones',
            local_color: null,
            visitante_nombre: 'Real Bosque',
            visitante_color: null,
            cancha_nombre: null,
            sede_nombre: null,
          },
        ];
      }
      return [];
    });

    const cliente = crearTestApp(db, admin);
    const res = await cliente.pedir('/admin/partidos/p-3/resultado', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ golesLocal: 1, golesVisitante: 1 }),
    });

    expect(res.status).toBe(200);
  });

  it('Escenario 4: Rechaza marcadores con números negativos o no enteros (400)', async () => {
    const { db } = crearD1Falsa();
    const cliente = crearTestApp(db, admin);

    const resNegativo = await cliente.pedir('/admin/partidos/p-1/resultado', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ golesLocal: -1, golesVisitante: 2 }),
    });
    expect(resNegativo.status).toBe(400);

    const resDecimal = await cliente.pedir('/admin/partidos/p-1/resultado', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ golesLocal: 1.5, golesVisitante: 2 }),
    });
    expect(resDecimal.status).toBe(400);
  });

  it('Escenario 6: Rechaza con 403 a usuarios con rol jugador', async () => {
    const { db } = crearD1Falsa();
    const cliente = crearTestApp(db, jugador);

    const res = await cliente.pedir('/admin/partidos/p-1/resultado', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ golesLocal: 2, golesVisitante: 1 }),
    });
    expect(res.status).toBe(403);
  });
});

describe('KAN-38 · Corregir estadísticas de un partido', () => {
  const admin: UsuarioSesion = {
    id: 'admin-1',
    nombre: 'Administrador',
    rol: 'admin',
    debeCambiarContrasena: false,
  };

  it('Escenario 1: Permite modificar el marcador de un partido previamente jugado (200)', async () => {
    const { db, consultas } = crearD1Falsa((sql) => {
      if (sql.includes('FROM partidos p') && sql.includes('WHERE p.id = ?')) {
        return [
          {
            id: 'p-1',
            fecha_id: 'f-1',
            torneo_id: 't-1',
            local_id: 'eq-1',
            visitante_id: 'eq-2',
            estado: 'JUGADO',
            fecha_hora: null,
            cancha: null,
            cancha_id: null,
            local_nombre: 'Los Halcones',
            local_color: null,
            visitante_nombre: 'Real Bosque',
            visitante_color: null,
            cancha_nombre: null,
            sede_nombre: null,
          },
        ];
      }
      return [];
    });

    const cliente = crearTestApp(db, admin);

    // Corrección de resultado: cambiar de 2-1 a 1-1
    const resCorreccion = await cliente.pedir('/admin/partidos/p-1/resultado', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ golesLocal: 1, golesVisitante: 1 }),
    });

    expect(resCorreccion.status).toBe(200);
    const updateSql = consultas.find((c) => c.sql.includes('UPDATE partidos SET goles_local = ?'));
    expect(updateSql).toBeDefined();
  });

  it('Escenario 2: Rechaza corrección con valores inválidos (400)', async () => {
    const { db } = crearD1Falsa();
    const cliente = crearTestApp(db, admin);

    const res = await cliente.pedir('/admin/partidos/p-1/resultado', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ golesLocal: 'invalido', golesVisitante: 1 }),
    });

    expect(res.status).toBe(400);
  });
});
