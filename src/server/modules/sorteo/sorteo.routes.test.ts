import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { describe, expect, it } from 'vitest';
import type { D1Database } from '@cloudflare/workers-types';
import type { UsuarioSesion } from '@shared/usuarios';
import type { VistaPreviaSorteoResponse } from './sorteo.service';
import type { FixtureTorneoResponse } from '../../../shared/sorteo/contrato-sorteo';
import type { AppEnv } from '../../core/env';
import { manejarError } from '../../core/errors';
import { crearD1Falsa } from '../../test/d1-falsa';
import { sorteoAdminRoutes } from './sorteo.routes';
import { torneosAdminRoutes } from '../torneos/torneos.routes';

const conUsuario = (usuario: UsuarioSesion) =>
  createMiddleware<AppEnv>(async (c, next) => {
    c.set('usuario', usuario);
    await next();
  });

function crearTestApp(
  db: D1Database,
  usuario: UsuarioSesion = {
    id: 'admin-1',
    nombre: 'Admin',
    rol: 'admin',
    debeCambiarContrasena: false,
  },
) {
  const app = new Hono<AppEnv>();
  app.use('*', conUsuario(usuario));
  app.route('/admin/sorteo', sorteoAdminRoutes);
  app.route('/admin/torneos', torneosAdminRoutes);
  app.onError(manejarError);
  return {
    pedir: (ruta: string, init?: RequestInit) => app.request(ruta, init, { DB: db }),
  };
}

describe('Rutas HTTP /api/admin/sorteo', () => {
  it('GET /admin/sorteo/torneos/:id/vista-previa responde con la estimación', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('SELECT id, nombre, estado, cupo FROM torneos')) {
        return [{ id: 't-1', nombre: 'Copa El Bosque', estado: 'INSCRIPCIONES_ABIERTAS', cupo: 8 }];
      }
      if (sql.includes("WHERE i.torneo_id = ? AND i.estado = 'APROBADO'")) {
        return [
          { id: 'eq-1', nombre: 'Tigres' },
          { id: 'eq-2', nombre: 'Leones' },
          { id: 'eq-3', nombre: 'Águilas' },
          { id: 'eq-4', nombre: 'Halcones' },
        ];
      }
      if (sql.includes("WHERE torneo_id = ? AND estado = 'PENDIENTE'")) {
        return [{ count: 2 }];
      }
      return [];
    });

    const cliente = crearTestApp(db);
    const res = await cliente.pedir('/admin/sorteo/torneos/t-1/vista-previa');
    expect(res.status).toBe(200);
    const body = (await res.json()) as VistaPreviaSorteoResponse;
    expect(body.valido).toBe(true);
    expect(body.equiposAprobados).toBe(4);
    expect(body.totalFechas).toBe(3);
    expect(body.totalPartidos).toBe(6);
    expect(body.solicitudesPendientes).toBe(2);
  });

  it('POST /admin/sorteo/torneos/:id ejecuta sorteo y responde 201 (Escenario 1)', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('SELECT id, nombre, estado, cupo FROM torneos')) {
        return [{ id: 't-1', nombre: 'Copa El Bosque', estado: 'INSCRIPCIONES_ABIERTAS', cupo: 8 }];
      }
      if (sql.includes("WHERE i.torneo_id = ? AND i.estado = 'APROBADO'")) {
        return [
          { id: 'eq-1', nombre: 'Tigres' },
          { id: 'eq-2', nombre: 'Leones' },
          { id: 'eq-3', nombre: 'Águilas' },
        ];
      }
      if (sql.includes('SELECT f.id, f.torneo_id, f.numero')) {
        return [
          {
            id: 'f-1',
            torneo_id: 't-1',
            numero: 1,
            equipo_descansa_id: 'eq-1',
            descansa_nombre: 'Tigres',
            descansa_color: null,
          },
        ];
      }
      if (sql.includes('SELECT p.id, p.fecha_id, p.torneo_id')) {
        return [
          {
            id: 'p-1',
            fecha_id: 'f-1',
            torneo_id: 't-1',
            local_id: 'eq-2',
            visitante_id: 'eq-3',
            estado: 'POR_PROGRAMAR',
            goles_local: null,
            goles_visitante: null,
            fecha_hora: null,
            cancha: null,
            local_nombre: 'Leones',
            local_color: null,
            visitante_nombre: 'Águilas',
            visitante_color: null,
          },
        ];
      }
      return [];
    });

    const cliente = crearTestApp(db);
    const res = await cliente.pedir('/admin/sorteo/torneos/t-1', { method: 'POST' });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { mensaje: string; fixture?: FixtureTorneoResponse };
    expect(body.mensaje).toContain('Sorteo generado exitosamente');
    expect(body.fixture).toBeDefined();
  });

  it('POST /admin/sorteo/torneos/:id responde 400 si hay menos de 3 equipos (Escenario 3)', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('SELECT id, nombre, estado, cupo FROM torneos')) {
        return [{ id: 't-1', nombre: 'Copa El Bosque', estado: 'INSCRIPCIONES_ABIERTAS', cupo: 8 }];
      }
      if (sql.includes("WHERE i.torneo_id = ? AND i.estado = 'APROBADO'")) {
        return [
          { id: 'eq-1', nombre: 'Tigres' },
          { id: 'eq-2', nombre: 'Leones' },
        ];
      }
      return [];
    });

    const cliente = crearTestApp(db);
    const res = await cliente.pedir('/admin/sorteo/torneos/t-1', { method: 'POST' });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { codigo: string; mensaje: string };
    expect(body.mensaje).toBe('Se necesitan al menos 3 equipos aprobados para sortear');
  });

  it('POST /admin/sorteo/torneos/:id responde 409 si el torneo ya está EN_CURSO', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('SELECT id, nombre, estado, cupo FROM torneos')) {
        return [{ id: 't-1', nombre: 'Copa El Bosque', estado: 'EN_CURSO', cupo: 8 }];
      }
      return [];
    });

    const cliente = crearTestApp(db);
    const res = await cliente.pedir('/admin/sorteo/torneos/t-1', { method: 'POST' });
    expect(res.status).toBe(409);
  });

  it('POST /admin/sorteo/torneos/:id/repetir responde 409 si ya hay resultados (Escenario 6)', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('SELECT id, nombre, estado, cupo FROM torneos')) {
        return [{ id: 't-1', nombre: 'Copa El Bosque', estado: 'EN_CURSO', cupo: 8 }];
      }
      if (sql.includes('FROM partidos') && sql.includes('COUNT(*)')) {
        return [{ count: 1 }]; // Ya hay resultados
      }
      return [];
    });

    const cliente = crearTestApp(db);
    const res = await cliente.pedir('/admin/sorteo/torneos/t-1/repetir', { method: 'POST' });
    expect(res.status).toBe(409);
    const body = (await res.json()) as { codigo: string; mensaje: string };
    expect(body.mensaje).toContain('ya existen partidos con resultados');
  });

  it('POST /admin/torneos/:id/sorteo alias funciona idénticamente', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('SELECT id, nombre, estado, cupo FROM torneos')) {
        return [{ id: 't-1', nombre: 'Copa El Bosque', estado: 'INSCRIPCIONES_ABIERTAS', cupo: 8 }];
      }
      if (sql.includes("WHERE i.torneo_id = ? AND i.estado = 'APROBADO'")) {
        return [
          { id: 'eq-1', nombre: 'Tigres' },
          { id: 'eq-2', nombre: 'Leones' },
          { id: 'eq-3', nombre: 'Águilas' },
        ];
      }
      if (sql.includes('SELECT f.id, f.torneo_id, f.numero')) {
        return [];
      }
      if (sql.includes('SELECT p.id, p.fecha_id, p.torneo_id')) {
        return [];
      }
      return [];
    });

    const cliente = crearTestApp(db);
    const res = await cliente.pedir('/admin/torneos/t-1/sorteo', { method: 'POST' });
    expect(res.status).toBe(201);
  });

  it('GET /admin/sorteo/torneos/:id/fixture y /admin/torneos/:id/fixture obtienen el fixture', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('SELECT id, nombre, estado, cupo FROM torneos')) {
        return [{ id: 't-1', nombre: 'Copa El Bosque', estado: 'EN_CURSO', cupo: 8 }];
      }
      return [];
    });

    const cliente = crearTestApp(db);
    const res1 = await cliente.pedir('/admin/sorteo/torneos/t-1/fixture');
    expect(res1.status).toBe(200);

    const res2 = await cliente.pedir('/admin/torneos/t-1/fixture');
    expect(res2.status).toBe(200);
  });

  it('POST /admin/torneos/:id/sorteo/repetir alias funciona', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('SELECT id, nombre, estado, cupo FROM torneos')) {
        return [{ id: 't-1', nombre: 'Copa El Bosque', estado: 'EN_CURSO', cupo: 8 }];
      }
      if (sql.includes("WHERE i.torneo_id = ? AND i.estado = 'APROBADO'")) {
        return [
          { id: 'eq-1', nombre: 'Tigres' },
          { id: 'eq-2', nombre: 'Leones' },
          { id: 'eq-3', nombre: 'Águilas' },
        ];
      }
      return [];
    });

    const cliente = crearTestApp(db);
    const res = await cliente.pedir('/admin/torneos/t-1/sorteo/repetir', { method: 'POST' });
    expect(res.status).toBe(200);
  });
});
