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
export const partidosRoutes = new Hono<AppEnv>().get('/:id', async (c) => {
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
