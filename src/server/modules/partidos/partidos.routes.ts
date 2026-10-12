import { Hono } from 'hono';
import type { AppEnv } from '../../core/env';
import { errores } from '../../core/errors';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { siFallaLaValidacion } from '../../core/validacion';

/**
 * Épicas E8 (programación) y E9 (resultados). Montadas en /api/partidos (exigen sesión).
 * Pendientes:
 * - UEB-Proyect-23 (KAN-36) · Ver el calendario de fechas → GET /api/partidos/calendario/:torneoId
 */
export const partidosRoutes = new Hono<AppEnv>()
  .get('/calendario/:torneoId', async (c) => {
    const { results } = await c.env.DB.prepare('SELECT p.id, p.jornada, p.fecha, p.hora, p.estado, el.nombre AS equipoLocal, ev.nombre AS equipoVisitante, s.nombre AS sede, ca.nombre AS cancha FROM partidos p JOIN equipos el ON el.id = p.equipo_local_id JOIN equipos ev ON ev.id = p.equipo_visitante_id LEFT JOIN sedes s ON s.id = p.sede_id LEFT JOIN canchas ca ON ca.id = p.cancha_id WHERE p.torneo_id = ? ORDER BY p.jornada, p.fecha, p.hora').bind(c.req.param('torneoId')).all();
    return c.json({ datos: results });
  });

/**
 * Montadas en /api/admin/partidos (exigen rol admin).
 * Pendientes:
 * - UEB-Proyect-22 (KAN-35) · Programar partido: lugar, fecha, hora y cancha
 *   → detección de cruces de horario como función pura en partidos/domain/
 * - UEB-Proyect-24 (KAN-37) · Registrar resultado y estadísticas
 *   → cálculo de puntos (3/1/0) como función pura en partidos/domain/
 * - UEB-Proyect-25 (KAN-38) · Corregir estadísticas de un partido
 */
const programarSchema = z.object({ sedeId: z.string().min(1), canchaId: z.string().min(1), fecha: z.string().date(), hora: z.string().regex(/^\d{2}:\d{2}$/) });
const resultadoSchema = z.object({ golesLocal: z.number().int().min(0).max(99), golesVisitante: z.number().int().min(0).max(99) });

export const partidosAdminRoutes = new Hono<AppEnv>()
  .get('/', async (c) => { const { results } = await c.env.DB.prepare('SELECT p.id, p.torneo_id AS torneoId, p.equipo_local_id AS equipoLocalId, p.equipo_visitante_id AS equipoVisitanteId, p.jornada, p.sede_id AS sedeId, p.cancha_id AS canchaId, p.fecha, p.hora, p.estado FROM partidos p ORDER BY p.fecha, p.hora, p.jornada').all(); return c.json({ datos: results }); })
  .put('/:id/programar', zValidator('json', programarSchema, siFallaLaValidacion), async (c) => {
    const datos = c.req.valid('json');
    const cancha = await c.env.DB.prepare('SELECT id FROM canchas WHERE id = ? AND sede_id = ?').bind(datos.canchaId, datos.sedeId).first();
    if (!cancha) throw errores.validacion({ canchaId: 'La cancha no pertenece a la sede' });
    const ocupado = await c.env.DB.prepare('SELECT id FROM partidos WHERE id != ? AND cancha_id = ? AND fecha = ? AND hora = ?').bind(c.req.param('id'), datos.canchaId, datos.fecha, datos.hora).first();
    if (ocupado) throw errores.conflicto('CANCHA_OCUPADA', 'La cancha ya está ocupada en ese horario');
    const resultado = await c.env.DB.prepare('UPDATE partidos SET sede_id = ?, cancha_id = ?, fecha = ?, hora = ? WHERE id = ?').bind(datos.sedeId, datos.canchaId, datos.fecha, datos.hora, c.req.param('id')).run();
    if (!resultado.success || resultado.meta.changes === 0) throw errores.noEncontrado('Partido');
    return c.json({ datos: { id: c.req.param('id'), ...datos } });
  })
  .put('/:id/resultado', zValidator('json', resultadoSchema, siFallaLaValidacion), async (c) => {
    const datos = c.req.valid('json');
    const resultado = await c.env.DB.prepare("UPDATE partidos SET goles_local = ?, goles_visitante = ?, estado = 'JUGADO' WHERE id = ?").bind(datos.golesLocal, datos.golesVisitante, c.req.param('id')).run();
    if (!resultado.success || resultado.meta.changes === 0) throw errores.noEncontrado('Partido');
    return c.json({ datos: { id: c.req.param('id'), ...datos, estado: 'JUGADO' } });
  });
