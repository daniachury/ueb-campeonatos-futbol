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
      `SELECT p.id, f.numero AS jornada, p.fecha_hora AS fechaHora,
        p.local_id AS localId, p.visitante_id AS visitanteId,
        local.nombre AS equipoLocal, visitante.nombre AS equipoVisitante,
        p.cancha, p.estado, p.goles_local AS golesLocal, p.goles_visitante AS golesVisitante
       FROM partidos p JOIN fechas f ON f.id = p.fecha_id
       JOIN equipos local ON local.id = p.local_id
       JOIN equipos visitante ON visitante.id = p.visitante_id
       WHERE p.torneo_id = ? ORDER BY f.numero, p.fecha_hora`,
    ).bind(c.req.param('torneoId')).all();
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
  .get('/:id', async (c) => {
    const id = c.req.param('id');
    const service = crearPartidosService(c.env.DB);
    const partido = await service.obtenerPartidoPorId(id);
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
  });
