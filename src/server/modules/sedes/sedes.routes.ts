import { Hono } from 'hono';
import type { AppEnv } from '../../core/env';
import { errores } from '../../core/errors';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { siFallaLaValidacion } from '../../core/validacion';

/**
 * Épica E8 · Sedes y canchas. Montadas en /api/admin/sedes (exigen rol admin).
 * Pendientes:
 * - UEB-Proyect-21 (KAN-34) · Crear lugares de partidos (sedes y canchas)
 */
const sedeSchema = z.object({ nombre: z.string().trim().min(3).max(80), direccion: z.string().trim().min(3).max(160) });
const canchaSchema = z.object({ sedeId: z.string().min(1), nombre: z.string().trim().min(2).max(60) });

export const sedesAdminRoutes = new Hono<AppEnv>()
  .get('/', async (c) => { const { results } = await c.env.DB.prepare('SELECT id, nombre, direccion FROM sedes ORDER BY nombre').all(); return c.json({ datos: results }); })
  .get('/canchas', async (c) => { const { results } = await c.env.DB.prepare('SELECT id, sede_id AS sedeId, nombre FROM canchas ORDER BY nombre').all(); return c.json({ datos: results }); })
  .post('/', zValidator('json', sedeSchema, siFallaLaValidacion), async (c) => { const datos = c.req.valid('json'); const id = crypto.randomUUID(); try { await c.env.DB.prepare('INSERT INTO sedes (id, nombre, direccion) VALUES (?, ?, ?)').bind(id, datos.nombre, datos.direccion).run(); } catch (error) { if (error instanceof Error && /unique/i.test(error.message)) throw errores.conflicto('SEDE_DUPLICADA', 'Ya existe una sede con ese nombre'); throw error; } return c.json({ datos: { id, ...datos } }, 201); })
  .post('/canchas', zValidator('json', canchaSchema, siFallaLaValidacion), async (c) => { const datos = c.req.valid('json'); const sede = await c.env.DB.prepare('SELECT id FROM sedes WHERE id = ?').bind(datos.sedeId).first(); if (!sede) throw errores.noEncontrado('Sede'); const id = crypto.randomUUID(); await c.env.DB.prepare('INSERT INTO canchas (id, sede_id, nombre) VALUES (?, ?, ?)').bind(id, datos.sedeId, datos.nombre).run(); return c.json({ datos: { id, ...datos } }, 201); });
