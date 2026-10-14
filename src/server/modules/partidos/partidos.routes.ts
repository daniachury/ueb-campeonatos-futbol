import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import type { AppEnv } from '../../core/env';
import { PartidoRepository } from './partidos.repository';
import { PartidoService } from './partidos.service';

/**
 * Factory para instanciar el servicio de partidos con la base de datos D1 del contexto.
 */
export function crearPartidosService(db: D1Database): PartidoService {
  const repo = new PartidoRepository(db);
  return new PartidoService(repo);
}

/**
 * Épicas E8 (programación) y E9 (resultados). Montadas en /api/partidos (exigen sesión).
 */
export const partidosRoutes = new Hono<AppEnv>()
  .get('/calendario/:torneoId', async (c) => {
    const { results } = await c.env.DB.prepare(
      `SELECT p.id, f.numero AS jornada, date(p.fecha_hora) AS fecha, time(p.fecha_hora) AS hora,
        p.local_id AS localId, p.visitante_id AS visitanteId,
        local.nombre AS equipoLocal, visitante.nombre AS equipoVisitante,
        p.cancha, p.estado, p.goles_local AS golesLocal, p.goles_visitante AS golesVisitante
       FROM partidos p JOIN fechas f ON f.id = p.fecha_id
       JOIN equipos local ON local.id = p.local_id
       JOIN equipos visitante ON visitante.id = p.visitante_id
       WHERE p.torneo_id = ? ORDER BY f.numero, p.fecha_hora`,
    )
      .bind(c.req.param('torneoId'))
      .all();
    return c.json({ datos: results });
  })
  .get('/:id', async (c) => {
    const id = c.req.param('id');
    const service = crearPartidosService(c.env.DB);
    const partido = await service.obtenerPartidoPorId(id);
    return c.json(partido);
  });

/**
 * Montadas en /api/admin/partidos (exigen rol admin).
 * UEB-Proyect-22 (KAN-35) · Programar partido: lugar, fecha, hora y cancha.
 */
export const partidosAdminRoutes = new Hono<AppEnv>()
  .get('/', async (c) => {
    const { results } = await c.env.DB.prepare(
      `SELECT p.id, f.numero AS jornada, p.estado, p.fecha_hora,
        p.cancha_id, p.cancha, p.goles_local, p.goles_visitante,
        p.local_id, p.visitante_id, el.nombre AS local_nombre,
        ev.nombre AS visitante_nombre, t.nombre AS torneo_nombre
       FROM partidos p
       JOIN equipos el ON el.id = p.local_id
       JOIN equipos ev ON ev.id = p.visitante_id
       JOIN torneos t ON t.id = p.torneo_id
       LEFT JOIN fechas f ON f.id = p.fecha_id
       ORDER BY p.fecha_hora IS NULL, p.fecha_hora, t.nombre, f.numero, p.id`,
    ).all();
    return c.json({ datos: results });
  })
  .get('/:id', async (c) => {
    const id = c.req.param('id');
    const service = crearPartidosService(c.env.DB);
    const partido = await service.obtenerPartidoPorId(id);
    return c.json(partido);
  })
  .patch('/:id/programacion', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const service = crearPartidosService(c.env.DB);
    const partido = await service.programarPartido(id, body);
    return c.json(partido);
  })
  .patch('/:id/programar', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const service = crearPartidosService(c.env.DB);
    const partido = await service.programarPartido(id, body);
    return c.json(partido);
  })
  .patch('/:id/desprogramar', async (c) => {
    const id = c.req.param('id');
    const service = crearPartidosService(c.env.DB);
    const partido = await service.desprogramarPartido(id);
    return c.json(partido);
  })
  .patch('/:id/resultado', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json<{ golesLocal?: number; golesVisitante?: number }>();
    const golesLocal = body.golesLocal;
    const golesVisitante = body.golesVisitante;
    if (
      typeof golesLocal !== 'number' ||
      typeof golesVisitante !== 'number' ||
      !Number.isInteger(golesLocal) ||
      !Number.isInteger(golesVisitante) ||
      golesLocal < 0 ||
      golesVisitante < 0
    ) {
      return c.json({ mensaje: 'Los goles deben ser números enteros positivos' }, 400);
    }
    await c.env.DB.prepare(
      `UPDATE partidos SET goles_local = ?, goles_visitante = ?, estado = 'JUGADO', actualizado_en = ? WHERE id = ?`,
    )
      .bind(golesLocal, golesVisitante, new Date().toISOString(), id)
      .run();
    const service = crearPartidosService(c.env.DB);
    return c.json(await service.obtenerPartidoPorId(id));
  });
