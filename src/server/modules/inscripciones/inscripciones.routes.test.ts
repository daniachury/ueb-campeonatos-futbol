import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { describe, expect, it } from 'vitest';
import type { UsuarioSesion } from '@shared/usuarios';
import type { AppEnv } from '../../core/env';
import { manejarError } from '../../core/errors';
import { crearD1Falsa } from '../../test/d1-falsa';
import { inscripcionesAdminRoutes } from './inscripciones.routes';

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
  app.route('/admin/inscripciones', inscripcionesAdminRoutes);
  app.onError(manejarError);
  return {
    pedir: (ruta: string, init?: RequestInit) => app.request(ruta, init, { DB: db }),
  };
}

describe('Rutas HTTP /api/admin/inscripciones', () => {
  it('GET /admin/inscripciones/torneos/:id devuelve la bandeja', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('SELECT id, nombre, cupo, estado FROM torneos')) {
        return [{ id: 't-1', nombre: 'Copa El Bosque', cupo: 8, estado: 'INSCRIPCIONES_ABIERTAS' }];
      }
      if (sql.includes('COUNT(*) as total FROM inscripciones')) {
        return [{ total: 2 }];
      }
      if (sql.includes('FROM inscripciones i')) {
        return [
          {
            id: 'ins-1',
            torneoId: 't-1',
            equipoId: 'eq-1',
            equipoNombre: 'Halcones',
            equipoColor: '#123456',
            capitanNombre: 'Carlos',
            cantidadJugadores: 12,
            estado: 'PENDIENTE',
            fechaSolicitud: '2026-10-10T10:00:00.000Z',
            motivo: null,
            aprobadoPor: null,
            fechaResolucion: null,
          },
        ];
      }
      return [];
    });

    const { pedir } = crearTestApp(db);
    const res = await pedir('/admin/inscripciones/torneos/t-1');

    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      torneo: { nombre: string };
      contadorAprobados: string;
      pendientes: unknown[];
    };
    expect(data.torneo.nombre).toBe('Copa El Bosque');
    expect(data.contadorAprobados).toBe('2/8');
    expect(data.pendientes).toHaveLength(1);
  });

  it('POST /admin/inscripciones/:id/rechazar valida motivo obligatorio de 10 a 300 caracteres', async () => {
    const { db } = crearD1Falsa();
    const { pedir } = crearTestApp(db);

    // Motivo muy corto (< 10) -> 400 Bad Request
    const resInvalido = await pedir('/admin/inscripciones/ins-1/rechazar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo: 'Muy corto' }),
    });

    expect(resInvalido.status).toBe(400);

    // Motivo válido
    const { db: dbValida } = crearD1Falsa((sql) => {
      if (sql.includes('FROM inscripciones WHERE id = ?')) {
        return [{ id: 'ins-1', torneo_id: 't-1', equipo_id: 'eq-1', estado: 'PENDIENTE' }];
      }
      if (sql.includes('FROM torneos WHERE id = ?')) {
        return [{ id: 't-1', nombre: 'Copa', cupo: 8, estado: 'INSCRIPCIONES_ABIERTAS' }];
      }
      return [];
    });
    const { pedir: pedirValido } = crearTestApp(dbValida);

    const resValido = await pedirValido('/admin/inscripciones/ins-1/rechazar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo: 'El equipo no presentó la planilla completa a tiempo.' }),
    });

    expect(resValido.status).toBe(200);
  });

  it('POST /admin/inscripciones/:id/aprobar aprueba la solicitud si cumple condiciones', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM inscripciones WHERE id = ?')) {
        return [{ id: 'ins-1', torneo_id: 't-1', equipo_id: 'eq-1', estado: 'PENDIENTE' }];
      }
      if (sql.includes('FROM torneos WHERE id = ?')) {
        return [{ id: 't-1', nombre: 'Copa', cupo: 8, estado: 'INSCRIPCIONES_ABIERTAS' }];
      }
      if (sql.includes('COUNT(*) as total FROM inscripciones')) {
        return [{ total: 3 }];
      }
      if (sql.includes('FROM equipos e')) {
        return [{ id: 'eq-1', nombre: 'Halcones', cantidadJugadores: 15 }];
      }
      if (sql.includes('SELECT DISTINCT')) {
        return []; // Sin conflictos
      }
      return [];
    });

    const { pedir } = crearTestApp(db);
    const res = await pedir('/admin/inscripciones/ins-1/aprobar', { method: 'POST' });

    expect(res.status).toBe(200);
    const data = (await res.json()) as { mensaje: string };
    expect(data.mensaje).toContain('exitosa');
  });

  it('POST /admin/inscripciones/torneos/:id/directa inscribe directamente un equipo', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM torneos WHERE id = ?')) {
        return [{ id: 't-1', nombre: 'Copa', cupo: 8, estado: 'INSCRIPCIONES_ABIERTAS' }];
      }
      if (sql.includes('FROM equipos e')) {
        return [{ id: 'eq-1', nombre: 'Halcones', cantidadJugadores: 15 }];
      }
      if (sql.includes('FROM inscripciones i')) {
        return [];
      }
      if (sql.includes('COUNT(*) as total FROM inscripciones')) {
        return [{ total: 1 }];
      }
      if (sql.includes('SELECT DISTINCT')) {
        return [];
      }
      return [];
    });

    const { pedir } = crearTestApp(db);
    const res = await pedir('/admin/inscripciones/torneos/t-1/directa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ equipoId: 'eq-1' }),
    });

    expect(res.status).toBe(201);
  });

  it('GET /admin/inscripciones/torneos/:id/equipos-disponibles devuelve equipos', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM torneos WHERE id = ?')) {
        return [{ id: 't-1', nombre: 'Copa', cupo: 8, estado: 'INSCRIPCIONES_ABIERTAS' }];
      }
      if (sql.includes('FROM equipos e')) {
        return [
          {
            id: 'eq-1',
            nombre: 'Halcones',
            color: '#111',
            capitanNombre: 'Carlos',
            cantidadJugadores: 14,
          },
        ];
      }
      return [];
    });

    const { pedir } = crearTestApp(db);
    const res = await pedir('/admin/inscripciones/torneos/t-1/equipos-disponibles?q=Hal');

    expect(res.status).toBe(200);
    const data = (await res.json()) as { datos: unknown[] };
    expect(data.datos).toHaveLength(1);
  });

  it('POST /admin/inscripciones/:id/retirar retira equipo aprobado con motivo', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM inscripciones WHERE id = ?')) {
        return [{ id: 'ins-1', torneo_id: 't-1', equipo_id: 'eq-1', estado: 'APROBADO' }];
      }
      if (sql.includes('FROM torneos WHERE id = ?')) {
        return [{ id: 't-1', nombre: 'Copa', cupo: 8, estado: 'INSCRIPCIONES_ABIERTAS' }];
      }
      return [];
    });

    const { pedir } = crearTestApp(db);
    const res = await pedir('/admin/inscripciones/ins-1/retirar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo: 'Sanción disciplinaria del club participante.' }),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as { mensaje: string };
    expect(data.mensaje).toContain('retirado');
  });

  it('POST /admin/inscripciones/torneos/:id/inscripciones inscribe directamente mediante la ruta estándar', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM torneos WHERE id = ?')) {
        return [{ id: 't-1', nombre: 'Copa', cupo: 8, estado: 'INSCRIPCIONES_ABIERTAS' }];
      }
      if (sql.includes('FROM equipos e')) {
        return [{ id: 'eq-1', nombre: 'Halcones', cantidadJugadores: 15 }];
      }
      if (sql.includes('FROM inscripciones i')) {
        return [];
      }
      if (sql.includes('COUNT(*) as total FROM inscripciones')) {
        return [{ total: 1 }];
      }
      if (sql.includes('SELECT DISTINCT')) {
        return [];
      }
      return [];
    });

    const { pedir } = crearTestApp(db);
    const res = await pedir('/admin/inscripciones/torneos/t-1/inscripciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ equipoId: 'eq-1' }),
    });

    expect(res.status).toBe(201);
  });
});
