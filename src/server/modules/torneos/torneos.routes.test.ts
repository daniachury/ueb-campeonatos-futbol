import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { describe, expect, it } from 'vitest';
import type { D1Database } from '@cloudflare/workers-types';
import type { ErrorApi, ErrorDeCampo, RespuestaLista } from '@shared/api';
import type {
  RespuestaAbrirInscripciones,
  RespuestaCrearTorneo,
  TorneoAdminResumen,
  TorneoResumen,
} from '@shared/torneos';
import type { UsuarioSesion } from '@shared/usuarios';
import type { AppEnv } from '../../core/env';
import { manejarError } from '../../core/errors';
import { requireRole } from '../../core/middleware/require-role';
import { crearD1Falsa } from '../../test/d1-falsa';
import { torneosAdminRoutes, torneosRoutes } from './torneos.routes';

const filas: TorneoResumen[] = [
  { id: 't1', nombre: 'Liga 2025', estado: 'FINALIZADO', fechaInicio: '2025-08-01', cupo: 6 },
  {
    id: 't2',
    nombre: 'Copa El Bosque 2026',
    estado: 'INSCRIPCIONES_ABIERTAS',
    fechaInicio: '2026-11-07',
    cupo: 8,
  },
  {
    id: 't3',
    nombre: 'Liga Interfacultades',
    estado: 'EN_CURSO',
    fechaInicio: '2026-10-17',
    cupo: 10,
  },
];

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
  app.route('/torneos', torneosRoutes);
  app.route('/admin/torneos', torneosAdminRoutes);
  app.onError(manejarError);

  return {
    pedir: (ruta: string, init?: RequestInit) => app.request(ruta, init, { DB: db }),
  };
}

describe('GET /api/torneos (Público)', () => {
  it('responde 200 con los torneos públicos ordenados', async () => {
    const { db, consultas } = crearD1Falsa(() => filas);
    const { pedir } = crearTestApp(db);

    const respuesta = await pedir('/torneos');
    const cuerpo = (await respuesta.json()) as RespuestaLista<TorneoResumen>;

    expect(respuesta.status).toBe(200);
    expect(cuerpo.datos.map((t) => t.id)).toEqual(['t2', 't3', 't1']);
    expect(consultas[0]?.parametros).toEqual(['INSCRIPCIONES_ABIERTAS', 'EN_CURSO', 'FINALIZADO']);
  });

  it('aplica el filtro por estado', async () => {
    const { db, consultas } = crearD1Falsa(() => []);
    const { pedir } = crearTestApp(db);

    const respuesta = await pedir('/torneos?estado=EN_CURSO');

    expect(respuesta.status).toBe(200);
    expect(consultas[0]?.parametros).toEqual(['EN_CURSO']);
  });

  it('rechaza con 400 un estado que no es público, sin consultar la base de datos', async () => {
    const { db, consultas } = crearD1Falsa();
    const { pedir } = crearTestApp(db);

    const respuesta = await pedir('/torneos?estado=BORRADOR');
    const cuerpo = (await respuesta.json()) as ErrorApi;

    expect(respuesta.status).toBe(400);
    expect(cuerpo.codigo).toBe('VALIDACION');
    expect((cuerpo.detalles as ErrorDeCampo[])[0]?.campo).toBe('estado');
    expect(consultas).toHaveLength(0);
  });
});

describe('Rutas HTTP /api/admin/torneos (KAN-20)', () => {
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

  it('GET /admin/torneos responde 200 con todos los torneos para admin', async () => {
    const { db } = crearD1Falsa(() => [
      {
        id: 't-b',
        nombre: 'Torneo Borrador',
        estado: 'BORRADOR',
        fechaInicio: '2026-12-01',
        cupo: 8,
      },
    ]);
    const { pedir } = crearTestApp(db, adminSesion);

    const res = await pedir('/admin/torneos');
    const cuerpo = (await res.json()) as RespuestaLista<TorneoAdminResumen>;

    expect(res.status).toBe(200);
    expect(cuerpo.datos).toHaveLength(1);
    expect(cuerpo.datos[0]?.nombre).toBe('Torneo Borrador');
  });

  it('GET /admin/torneos responde 403 Forbidden para un usuario con rol jugador', async () => {
    const { db } = crearD1Falsa();
    const { pedir } = crearTestApp(db, jugadorSesion);

    const res = await pedir('/admin/torneos');
    expect(res.status).toBe(403);
  });

  it('POST /admin/torneos crea un torneo exitosamente (201 Created)', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('LOWER(nombre) = LOWER(?)')) return []; // No existe duplicado
      return [];
    });
    const { pedir } = crearTestApp(db, adminSesion);

    const payload = {
      nombre: 'Copa El Bosque 2026',
      descripcion: 'Gran torneo universitario',
      fechaInicio: '2026-12-01',
      cupo: 8,
    };

    const res = await pedir('/admin/torneos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(201);
    const cuerpo = (await res.json()) as RespuestaCrearTorneo;
    expect(cuerpo.torneo.nombre).toBe('Copa El Bosque 2026');
    expect(cuerpo.torneo.estado).toBe('BORRADOR');
    expect(cuerpo.torneo.modalidad).toBe('FUTBOL_11');
    expect(cuerpo.torneo.formato).toBe('LIGA');
  });

  it('POST /admin/torneos responde 409 Conflict si el nombre ya existe', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('LOWER(nombre) = LOWER(?)')) {
        return [{ id: 'existente-1', nombre: 'Copa El Bosque 2026' }];
      }
      return [];
    });
    const { pedir } = crearTestApp(db, adminSesion);

    const payload = {
      nombre: 'copa el bosque 2026',
      fechaInicio: '2026-12-01',
      cupo: 8,
    };

    const res = await pedir('/admin/torneos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(409);
    const cuerpo = (await res.json()) as ErrorApi;
    expect(cuerpo.codigo).toBe('NOMBRE_DUPLICADO');
    expect(cuerpo.mensaje).toBe('Ya existe un torneo con ese nombre');
  });

  it('POST /admin/torneos responde 400 si el cupo es inválido (< 3)', async () => {
    const { db } = crearD1Falsa();
    const { pedir } = crearTestApp(db, adminSesion);

    const payload = {
      nombre: 'Copa Pocos',
      fechaInicio: '2026-12-01',
      cupo: 2,
    };

    const res = await pedir('/admin/torneos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(400);
  });

  it('POST /admin/torneos responde 403 Forbidden para jugador', async () => {
    const { db } = crearD1Falsa();
    const { pedir } = crearTestApp(db, jugadorSesion);

    const res = await pedir('/admin/torneos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Intento Jugador',
        fechaInicio: '2026-12-01',
        cupo: 8,
      }),
    });

    expect(res.status).toBe(403);
  });

  it('POST /admin/torneos/:id/abrir-inscripciones transiciona el estado a INSCRIPCIONES_ABIERTAS', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('WHERE id = ?')) {
        return [
          {
            id: 't-123',
            nombre: 'Torneo Para Abrir',
            estado: 'BORRADOR',
            fechaInicio: '2026-12-01',
            cupo: 10,
          },
        ];
      }
      return [];
    });
    const { pedir } = crearTestApp(db, adminSesion);

    const res = await pedir('/admin/torneos/t-123/abrir-inscripciones', {
      method: 'POST',
    });

    expect(res.status).toBe(200);
    const cuerpo = (await res.json()) as RespuestaAbrirInscripciones;
    expect(cuerpo.torneo.estado).toBe('INSCRIPCIONES_ABIERTAS');
  });

  it('POST /admin/torneos/:id/abrir-inscripciones responde 404 si el torneo no existe', async () => {
    const { db } = crearD1Falsa(() => []);
    const { pedir } = crearTestApp(db, adminSesion);

    const res = await pedir('/admin/torneos/inexistente/abrir-inscripciones', {
      method: 'POST',
    });

    expect(res.status).toBe(404);
  });
});
