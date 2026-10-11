import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { describe, expect, it } from 'vitest';
import type { D1Database } from '@cloudflare/workers-types';
import type { UsuarioSesion } from '@shared/usuarios';
import type { SedeResumen, CanchaResumen } from '../../../shared/sedes/contrato-sedes';
import type { AppEnv } from '../../core/env';
import { manejarError } from '../../core/errors';
import { requireRole } from '../../core/middleware/require-role';
import { crearD1Falsa } from '../../test/d1-falsa';
import { sedesAdminRoutes } from './sedes.routes';

const conUsuario = (usuario?: UsuarioSesion) =>
  createMiddleware<AppEnv>(async (c, next) => {
    if (usuario) {
      c.set('usuario', usuario);
    }
    await next();
  });

function crearTestApp(
  db: D1Database,
  usuario?: UsuarioSesion,
) {
  const app = new Hono<AppEnv>();
  if (usuario) {
    app.use('*', conUsuario(usuario));
  }
  app.use('/admin/*', requireRole('admin'));
  app.route('/admin/sedes', sedesAdminRoutes);
  app.onError(manejarError);

  return {
    pedir: (ruta: string, init?: RequestInit) => app.request(ruta, init, { DB: db }),
  };
}

describe('Rutas HTTP /api/admin/sedes (KAN-34)', () => {
  const adminSesion: UsuarioSesion = {
    id: 'admin-1',
    nombre: 'Administrador',
    rol: 'admin',
  };

  const jugadorSesion: UsuarioSesion = {
    id: 'jugador-1',
    nombre: 'Carlos Jugador',
    rol: 'jugador',
  };

  it('Escenario 1: POST /admin/sedes crea sede y responde 201', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('WHERE LOWER(nombre) = LOWER(?)')) {
        return [];
      }
      return [];
    });

    const cliente = crearTestApp(db, adminSesion);
    const res = await cliente.pedir('/admin/sedes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Complejo El Bosque',
        direccion: 'Av Cra 9 # 131A-02',
        ciudad: 'Bogotá',
      }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as SedeResumen;
    expect(body.nombre).toBe('Complejo El Bosque');
    expect(body.ciudad).toBe('Bogotá');
  });

  it('Escenario 1: GET /admin/sedes lista las sedes registradas', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM sedes')) {
        return [
          {
            id: 's-1',
            nombre: 'Complejo El Bosque',
            direccion: 'Cra 9',
            ciudad: 'Bogotá',
            indicaciones: null,
            creado_en: '2026-10-11T10:00:00Z',
            actualizado_en: '2026-10-11T10:00:00Z',
          },
        ];
      }
      if (sql.includes('FROM canchas')) {
        return [];
      }
      return [];
    });

    const cliente = crearTestApp(db, adminSesion);
    const res = await cliente.pedir('/admin/sedes');
    expect(res.status).toBe(200);
    const body = (await res.json()) as SedeResumen[];
    expect(body).toHaveLength(1);
    expect(body[0].nombre).toBe('Complejo El Bosque');
  });

  it('Escenario 2: POST /admin/sedes/:id/canchas agrega canchas asociadas', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM sedes WHERE id = ?')) {
        return [{ id: 's-1', nombre: 'Complejo El Bosque' }];
      }
      if (sql.includes('WHERE sede_id = ? AND LOWER(nombre) = LOWER(?)')) {
        return [];
      }
      return [];
    });

    const cliente = crearTestApp(db, adminSesion);
    const res = await cliente.pedir('/admin/sedes/s-1/canchas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Cancha 1',
        superficie: 'Sintética',
        activa: true,
      }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as CanchaResumen;
    expect(body.nombre).toBe('Cancha 1');
    expect(body.superficie).toBe('Sintética');
  });

  it('Escenario 3: Duplicados responden 409 con mensaje exacto', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM sedes WHERE id = ?')) {
        return [{ id: 's-1', nombre: 'Complejo El Bosque' }];
      }
      if (sql.includes('WHERE sede_id = ? AND LOWER(nombre) = LOWER(?)')) {
        return [{ id: 'c-1', nombre: 'Cancha 1' }];
      }
      return [];
    });

    const cliente = crearTestApp(db, adminSesion);
    const res = await cliente.pedir('/admin/sedes/s-1/canchas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'cancha 1',
        superficie: 'Natural',
      }),
    });

    expect(res.status).toBe(409);
    const body = (await res.json()) as { mensaje: string };
    expect(body.mensaje).toBe('Ya existe una cancha con ese nombre en esta sede');
  });

  it('Escenario 4: PATCH /admin/sedes/:id edita la sede', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM sedes WHERE id = ?')) {
        return [{ id: 's-1', nombre: 'Complejo El Bosque', direccion: 'Cra 9', ciudad: 'Bogotá' }];
      }
      if (sql.includes('UPDATE sedes')) {
        return [];
      }
      return [];
    });

    const cliente = crearTestApp(db, adminSesion);
    const res = await cliente.pedir('/admin/sedes/s-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        direccion: 'Calle 134 # 7-10',
      }),
    });

    expect(res.status).toBe(200);
  });

  it('Escenario 5: Desactivar cancha vía PATCH', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM canchas') && sql.includes('WHERE c.id = ?')) {
        return [{ id: 'c-1', sede_id: 's-1', nombre: 'Cancha 1', activa: 1 }];
      }
      return [];
    });

    const cliente = crearTestApp(db, adminSesion);
    const res = await cliente.pedir('/admin/sedes/s-1/canchas/c-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activa: false,
      }),
    });

    expect(res.status).toBe(200);
  });

  it('Escenario 6: DELETE con partidos programados responde 409 con mensaje exacto', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM canchas') && sql.includes('WHERE c.id = ?')) {
        return [{ id: 'c-1', sede_id: 's-1', nombre: 'Cancha 1' }];
      }
      if (sql.includes('FROM partidos') && sql.includes('cancha_id = ?')) {
        return [{ count: 2 }];
      }
      return [];
    });

    const cliente = crearTestApp(db, adminSesion);
    const res = await cliente.pedir('/admin/sedes/s-1/canchas/c-1', {
      method: 'DELETE',
    });

    expect(res.status).toBe(409);
    const body = (await res.json()) as { mensaje: string };
    expect(body.mensaje).toBe(
      'No se puede eliminar: tiene 2 partidos programados. Reprográmalos o desactiva la cancha',
    );
  });

  it('Escenario 7: DELETE sin partidos responde 200', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM canchas') && sql.includes('WHERE c.id = ?')) {
        return [{ id: 'c-1', sede_id: 's-1', nombre: 'Cancha 1' }];
      }
      if (sql.includes('FROM partidos') && sql.includes('cancha_id = ?')) {
        return [{ count: 0 }];
      }
      return [];
    });

    const cliente = crearTestApp(db, adminSesion);
    const res = await cliente.pedir('/admin/sedes/s-1/canchas/c-1', {
      method: 'DELETE',
    });

    expect(res.status).toBe(200);
  });

  it('Escenario 8: Usuario con rol jugador recibe 403 Forbidden', async () => {
    const { db } = crearD1Falsa(() => []);
    const cliente = crearTestApp(db, jugadorSesion);

    const res = await cliente.pedir('/admin/sedes');
    expect(res.status).toBe(403);
  });
});
