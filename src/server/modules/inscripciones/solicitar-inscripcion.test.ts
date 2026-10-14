import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { describe, expect, it } from 'vitest';
import type { UsuarioSesion } from '@shared/usuarios';
import type { AppEnv } from '../../core/env';
import { manejarError } from '../../core/errors';
import { crearD1Falsa } from '../../test/d1-falsa';
import { inscripcionesRoutes } from './inscripciones.routes';

const conUsuario = (usuario: UsuarioSesion) =>
  createMiddleware<AppEnv>(async (c, next) => {
    c.set('usuario', usuario);
    await next();
  });

function crearTestApp(
  db: D1Database,
  usuario: UsuarioSesion = {
    id: 'capitan-1',
    nombre: 'Capitán Halcones',
    rol: 'jugador',
    debeCambiarContrasena: false,
  },
) {
  const app = new Hono<AppEnv>();
  app.use('*', conUsuario(usuario));
  app.route('/inscripciones', inscripcionesRoutes);
  app.onError(manejarError);
  return {
    pedir: (ruta: string, init?: RequestInit) => app.request(ruta, init, { DB: db }),
  };
}

describe('KAN-31 · Capitán solicita la inscripción de su equipo a un torneo', () => {
  it('Escenario 1: Solicitud exitosa de capitán con equipo completo en torneo abierto', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM equipos e')) {
        return [
          {
            id: 'eq-1',
            nombre: 'Los Halcones',
            color: '#00FF00',
            capitanId: 'capitan-1',
            capitanNombre: 'Capitán Halcones',
            cantidadJugadores: 14,
          },
        ];
      }
      if (sql.includes('SELECT id, nombre, cupo, estado FROM torneos')) {
        return [{ id: 't-1', nombre: 'Copa El Bosque', cupo: 8, estado: 'INSCRIPCIONES_ABIERTAS' }];
      }
      if (sql.includes('FROM inscripciones i')) {
        return [];
      }
      if (sql.includes('COUNT(*) as total FROM inscripciones')) {
        return [{ total: 3 }]; // 3 aprobados de 8
      }
      if (sql.includes('SELECT DISTINCT')) {
        return []; // sin conflictos
      }
      return [];
    });

    const { pedir } = crearTestApp(db);
    const res = await pedir('/inscripciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ torneoId: 't-1', equipoId: 'eq-1' }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; mensaje: string };
    expect(body.mensaje).toBe('Solicitud enviada');
    expect(body.id).toBeDefined();
  });

  it('Escenario 2: Plantilla incompleta (< 11 jugadores) rechaza con 409', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM equipos e')) {
        return [
          {
            id: 'eq-1',
            nombre: 'Los Halcones',
            color: '#00FF00',
            capitanId: 'capitan-1',
            capitanNombre: 'Capitán Halcones',
            cantidadJugadores: 9,
          },
        ];
      }
      if (sql.includes('SELECT id, nombre, cupo, estado FROM torneos')) {
        return [{ id: 't-1', nombre: 'Copa El Bosque', cupo: 8, estado: 'INSCRIPCIONES_ABIERTAS' }];
      }
      if (sql.includes('FROM inscripciones i')) {
        return [];
      }
      if (sql.includes('COUNT(*) as total FROM inscripciones')) {
        return [{ total: 3 }];
      }
      return [];
    });

    const { pedir } = crearTestApp(db);
    const res = await pedir('/inscripciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ torneoId: 't-1', equipoId: 'eq-1' }),
    });

    expect(res.status).toBe(409);
    const body = (await res.json()) as { codigo: string; mensaje: string };
    expect(body.codigo).toBe('PLANTILLA_INCOMPLETA');
    expect(body.mensaje).toContain('Se necesitan al menos 11 jugadores para inscribirse (tienes 9)');
  });

  it('Escenario 3: Conflicto de jugadores con otro equipo rechaza con 409', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM equipos e')) {
        return [
          {
            id: 'eq-1',
            nombre: 'Los Halcones',
            color: '#00FF00',
            capitanId: 'capitan-1',
            capitanNombre: 'Capitán Halcones',
            cantidadJugadores: 12,
          },
        ];
      }
      if (sql.includes('SELECT id, nombre, cupo, estado FROM torneos')) {
        return [{ id: 't-1', nombre: 'Copa El Bosque', cupo: 8, estado: 'INSCRIPCIONES_ABIERTAS' }];
      }
      if (sql.includes('FROM inscripciones i')) {
        return [];
      }
      if (sql.includes('COUNT(*) as total FROM inscripciones')) {
        return [{ total: 2 }];
      }
      if (sql.includes('SELECT DISTINCT')) {
        return [
          {
            jugadorId: 'j-2',
            nombreJugador: 'Mateo Gómez',
            otroEquipoId: 'eq-2',
            otroEquipoNombre: 'Águilas FC',
          },
        ];
      }
      return [];
    });

    const { pedir } = crearTestApp(db);
    const res = await pedir('/inscripciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ torneoId: 't-1', equipoId: 'eq-1' }),
    });

    expect(res.status).toBe(409);
    const body = (await res.json()) as { codigo: string; mensaje: string };
    expect(body.codigo).toBe('CONFLICTO_JUGADORES');
    expect(body.mensaje).toContain('Mateo Gómez (Águilas FC)');
  });

  it('Escenario 4: Cupo completo rechaza con 409', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM equipos e')) {
        return [
          {
            id: 'eq-1',
            nombre: 'Los Halcones',
            color: '#00FF00',
            capitanId: 'capitan-1',
            capitanNombre: 'Capitán Halcones',
            cantidadJugadores: 14,
          },
        ];
      }
      if (sql.includes('SELECT id, nombre, cupo, estado FROM torneos')) {
        return [{ id: 't-1', nombre: 'Copa El Bosque', cupo: 8, estado: 'INSCRIPCIONES_ABIERTAS' }];
      }
      if (sql.includes('FROM inscripciones i')) {
        return [];
      }
      if (sql.includes('COUNT(*) as total FROM inscripciones')) {
        return [{ total: 8 }]; // 8 de 8
      }
      return [];
    });

    const { pedir } = crearTestApp(db);
    const res = await pedir('/inscripciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ torneoId: 't-1', equipoId: 'eq-1' }),
    });

    expect(res.status).toBe(409);
    const body = (await res.json()) as { codigo: string; mensaje: string };
    expect(body.codigo).toBe('CUPO_COMPLETO');
    expect(body.mensaje).toBe('El torneo ya completó su cupo de equipos');
  });

  it('Escenario 5: Solicitud duplicada rechaza con 409', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM equipos e')) {
        return [
          {
            id: 'eq-1',
            nombre: 'Los Halcones',
            color: '#00FF00',
            capitanId: 'capitan-1',
            capitanNombre: 'Capitán Halcones',
            cantidadJugadores: 14,
          },
        ];
      }
      if (sql.includes('SELECT id, nombre, cupo, estado FROM torneos')) {
        return [{ id: 't-1', nombre: 'Copa El Bosque', cupo: 8, estado: 'INSCRIPCIONES_ABIERTAS' }];
      }
      if (sql.includes('FROM inscripciones i')) {
        return [
          {
            id: 'ins-existente',
            torneoId: 't-1',
            equipoId: 'eq-1',
            equipoNombre: 'Los Halcones',
            estado: 'PENDIENTE',
          },
        ];
      }
      return [];
    });

    const { pedir } = crearTestApp(db);
    const res = await pedir('/inscripciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ torneoId: 't-1', equipoId: 'eq-1' }),
    });

    expect(res.status).toBe(409);
    const body = (await res.json()) as { codigo: string; mensaje: string };
    expect(body.codigo).toBe('EQUIPO_YA_INSCRITO');
    expect(body.mensaje).toBe('Tu equipo ya tiene una solicitud en este torneo');
  });

  it('Escenario 6: Capitán cancela solicitud pendiente', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM inscripciones WHERE id = ?')) {
        return [{ id: 'ins-1', torneo_id: 't-1', equipo_id: 'eq-1', estado: 'PENDIENTE' }];
      }
      if (sql.includes('FROM equipos e')) {
        return [{ id: 'eq-1', nombre: 'Los Halcones', capitanId: 'capitan-1' }];
      }
      return [];
    });

    const { pedir } = crearTestApp(db);
    const res = await pedir('/inscripciones/ins-1/cancelar', { method: 'POST' });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { mensaje: string };
    expect(body.mensaje).toBe('Solicitud cancelada exitosamente');
  });

  it('Escenario 7: Si solicitud previa fue RECHAZADO o CANCELADO, permite volver a solicitar', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM equipos e')) {
        return [
          {
            id: 'eq-1',
            nombre: 'Los Halcones',
            color: '#00FF00',
            capitanId: 'capitan-1',
            capitanNombre: 'Capitán Halcones',
            cantidadJugadores: 12,
          },
        ];
      }
      if (sql.includes('SELECT id, nombre, cupo, estado FROM torneos')) {
        return [{ id: 't-1', nombre: 'Copa El Bosque', cupo: 8, estado: 'INSCRIPCIONES_ABIERTAS' }];
      }
      if (sql.includes('FROM inscripciones i')) {
        return [
          {
            id: 'ins-antigua',
            torneoId: 't-1',
            equipoId: 'eq-1',
            equipoNombre: 'Los Halcones',
            estado: 'RECHAZADO',
          },
        ];
      }
      if (sql.includes('COUNT(*) as total FROM inscripciones')) {
        return [{ total: 2 }];
      }
      if (sql.includes('SELECT DISTINCT')) {
        return [];
      }
      return [];
    });

    const { pedir } = crearTestApp(db);
    const res = await pedir('/inscripciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ torneoId: 't-1', equipoId: 'eq-1' }),
    });

    expect(res.status).toBe(201);
  });

  it('Escenario 8: No capitán es rechazado con 403', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM equipos e')) {
        return [
          {
            id: 'eq-1',
            nombre: 'Los Halcones',
            color: '#00FF00',
            capitanId: 'otro-usuario',
            capitanNombre: 'Otro Capitán',
            cantidadJugadores: 14,
          },
        ];
      }
      return [];
    });

    const { pedir } = crearTestApp(db, {
      id: 'jugador-no-capitan',
      nombre: 'Jugador Común',
      rol: 'jugador',
      debeCambiarContrasena: false,
    });

    const res = await pedir('/inscripciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ torneoId: 't-1', equipoId: 'eq-1' }),
    });

    expect(res.status).toBe(403);
    const body = (await res.json()) as { codigo: string; mensaje: string };
    expect(body.codigo).toBe('SIN_PERMISO');
    expect(body.mensaje).toBe('Solo el capitán del equipo puede solicitar la inscripción');
  });
});
