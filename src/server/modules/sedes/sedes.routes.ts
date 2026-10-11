import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import type { AppEnv } from '../../core/env';
import { SedeRepository } from './sedes.repository';
import { SedeService } from './sedes.service';

/**
 * Factory para instanciar el servicio de sedes con la base de datos D1 del contexto.
 */
export function crearSedesService(db: D1Database): SedeService {
  const repo = new SedeRepository(db);
  return new SedeService(repo);
}

/**
 * Épica E8 · Sedes y canchas. Montadas en /api/admin/sedes (exigen rol admin).
 * UEB-Proyect-21 (KAN-34) · Crear lugares de partidos (sedes y canchas).
 */
export const sedesAdminRoutes = new Hono<AppEnv>()
  .get('/', async (c) => {
    const service = crearSedesService(c.env.DB);
    const sedes = await service.obtenerSedes();
    return c.json(sedes);
  })
  .post('/', async (c) => {
    const body = await c.req.json();
    const service = crearSedesService(c.env.DB);
    const sede = await service.crearSede(body);
    return c.json(sede, 201);
  })
  .get('/canchas-disponibles', async (c) => {
    const service = crearSedesService(c.env.DB);
    const canchas = await service.obtenerCanchasDisponibles();
    return c.json(canchas);
  })
  .get('/:id', async (c) => {
    const id = c.req.param('id');
    const service = crearSedesService(c.env.DB);
    const sede = await service.obtenerSedePorId(id);
    return c.json(sede);
  })
  .patch('/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const service = crearSedesService(c.env.DB);
    const sede = await service.actualizarSede(id, body);
    return c.json(sede);
  })
  .delete('/:id', async (c) => {
    const id = c.req.param('id');
    const service = crearSedesService(c.env.DB);
    await service.eliminarSede(id);
    return c.json({ mensaje: 'Sede eliminada con éxito' });
  })
  .post('/:sedeId/canchas', async (c) => {
    const sedeId = c.req.param('sedeId');
    const body = await c.req.json();
    const service = crearSedesService(c.env.DB);
    const cancha = await service.crearCancha(sedeId, body);
    return c.json(cancha, 201);
  })
  .patch('/:sedeId/canchas/:canchaId', async (c) => {
    const sedeId = c.req.param('sedeId');
    const canchaId = c.req.param('canchaId');
    const body = await c.req.json();
    const service = crearSedesService(c.env.DB);
    const cancha = await service.actualizarCancha(sedeId, canchaId, body);
    return c.json(cancha);
  })
  .delete('/:sedeId/canchas/:canchaId', async (c) => {
    const sedeId = c.req.param('sedeId');
    const canchaId = c.req.param('canchaId');
    const service = crearSedesService(c.env.DB);
    await service.eliminarCancha(sedeId, canchaId);
    return c.json({ mensaje: 'Cancha eliminada con éxito' });
  });
