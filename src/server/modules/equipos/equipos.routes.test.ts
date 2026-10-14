import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { describe, expect, it } from 'vitest';
import type { D1Database } from '@cloudflare/workers-types';
import type { UsuarioSesion } from '@shared/usuarios';
import type { AppEnv } from '../../core/env';
import { manejarError } from '../../core/errors';
import { requireRole } from '../../core/middleware/require-role';
import { crearD1Falsa } from '../../test/d1-falsa';
import { equiposAdminRoutes, equiposRoutes } from './equipos.routes';

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
  app.route('/equipos', equiposRoutes);
  app.route('/admin/equipos', equiposAdminRoutes);
  app.onError(manejarError);

  return {
    pedir: (ruta: string, init?: RequestInit) => app.request(ruta, init, { DB: db }),
  };
}

describe('KAN-24 · Creación de equipos', () => {
  const jugador: UsuarioSesion = {
    id: 'usr-jugador-1',
    nombre: 'Juan Pérez',
    rol: 'jugador',
    debeCambiarContrasena: false,
  };

  const admin: UsuarioSesion = {
    id: 'usr-admin-1',
    nombre: 'Admin Bosque',
    rol: 'admin',
    debeCambiarContrasena: false,
  };

  it('Escenario 1: Jugador crea equipo y queda como capitán e integrante inicial', async () => {
    const { db, consultas } = crearD1Falsa();
    const { pedir } = crearTestApp(db, jugador);

    const respuesta = await pedir('/equipos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Los Halcones', color: 'Azul' }),
    });

    expect(respuesta.status).toBe(201);
    const cuerpo = (await respuesta.json()) as { datos: { nombre: string; capitanId: string } };
    expect(cuerpo.datos.nombre).toBe('Los Halcones');
    expect(cuerpo.datos.capitanId).toBe('usr-jugador-1');

    const sqlInsertEquipo = consultas.find((c) => c.sql.includes('INSERT INTO equipos'));
    const sqlInsertJugador = consultas.find((c) => c.sql.includes('INSERT INTO equipo_jugadores'));
    expect(sqlInsertEquipo).toBeDefined();
    expect(sqlInsertJugador).toBeDefined();
  });

  it('Escenario 4: Rechaza nombre duplicado con 409', async () => {
    const db = {
      prepare() {
        return {
          bind: () => this,
          run: async () => {},
        };
      },
      async batch() {
        throw new Error('UNIQUE constraint failed: equipos.nombre');
      },
    } as unknown as D1Database;

    const { pedir } = crearTestApp(db, jugador);

    const respuesta = await pedir('/equipos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'los halcones', color: 'Verde' }),
    });

    expect(respuesta.status).toBe(409);
    const cuerpo = (await respuesta.json()) as { codigo: string };
    expect(cuerpo.codigo).toBe('NOMBRE_EQUIPO_DUPLICADO');
  });

  it('Escenario 2 y 3: Administrador crea equipo en /admin/equipos', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('SELECT id, rol FROM usuarios')) {
        return [{ id: 'usr-jugador-1', rol: 'jugador' }];
      }
      return [];
    });
    const { pedir } = crearTestApp(db, admin);

    const resConCapitan = await pedir('/admin/equipos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Real Bosque', color: 'Rojo', capitanId: 'usr-jugador-1' }),
    });

    expect(resConCapitan.status).toBe(201);
    const cuerpo = (await resConCapitan.json()) as { datos: { capitanId: string } };
    expect(cuerpo.datos.capitanId).toBe('usr-jugador-1');

    const resSinCapitan = await pedir('/admin/equipos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Bosque Libre', color: 'Blanco' }),
    });

    expect(resSinCapitan.status).toBe(201);
    const cuerpoSin = (await resSinCapitan.json()) as { datos: { capitanId: string | null } };
    expect(cuerpoSin.datos.capitanId).toBeNull();
  });

  it('KAN-25: Administrador edita datos de un equipo (PUT /admin/equipos/:id)', async () => {
    const { db, consultas } = crearD1Falsa((sql) => {
      if (sql.includes('SELECT id FROM equipos')) {
        return [{ id: 'eq-1' }];
      }
      return [];
    });
    const { pedir } = crearTestApp(db, admin);

    const respuesta = await pedir('/admin/equipos/eq-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Nuevo Nombre Equipo', color: 'Dorado' }),
    });

    expect(respuesta.status).toBe(200);
    const sqlUpdate = consultas.find((c) => c.sql.includes('UPDATE equipos'));
    expect(sqlUpdate).toBeDefined();
  });

  it('KAN-26: Administrador elimina un equipo (DELETE /admin/equipos/:id)', async () => {
    const sentencia = {
      bind: () => sentencia,
      run: async () => ({ success: true, meta: { changes: 1 } }),
    };
    const db = {
      prepare: () => sentencia,
    } as unknown as D1Database;
    const { pedir } = crearTestApp(db, admin);

    const respuesta = await pedir('/admin/equipos/eq-1', { method: 'DELETE' });
    expect(respuesta.status).toBe(204);
  });


  it('KAN-30: Administrador retira integrante pero rechaza si es el capitán', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('SELECT equipo_id AS equipoId FROM equipo_jugadores')) {
        return [{ equipoId: 'eq-1' }];
      }
      if (sql.includes('SELECT capitan_id AS capitanId FROM equipos')) {
        return [{ capitanId: 'usr-capitan' }];
      }
      return [];
    });
    const { pedir } = crearTestApp(db, admin);

    // Intento de retirar al capitán -> 409
    const resCapitan = await pedir('/admin/equipos/eq-1/integrantes/usr-capitan', {
      method: 'DELETE',
    });
    expect(resCapitan.status).toBe(409);

    // Retirar a un integrante normal -> 204
    const resNormal = await pedir('/admin/equipos/eq-1/integrantes/usr-normal', {
      method: 'DELETE',
    });
    expect(resNormal.status).toBe(204);
  });
});

