import { Hono } from 'hono';
import type { AppEnv } from '../../core/env';
import { errores } from '../../core/errors';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { siFallaLaValidacion } from '../../core/validacion';

/**
 * Épica E6 · Inscripción de equipos en torneos. Montadas en /api/inscripciones (exigen sesión).
 * Pendientes:
 * - UEB-Proyect-18 (KAN-31) · El capitán solicita la inscripción de su equipo
 */
export const inscripcionesRoutes = new Hono<AppEnv>()
  .get('/', async (c) => {
    const usuario = c.get('usuario');
    if (!usuario) throw errores.noAutenticado();
    const { results } = await c.env.DB.prepare('SELECT i.id, i.estado, i.torneo_id AS torneoId, t.nombre AS torneoNombre, t.fecha_inicio AS fechaInicio, e.nombre AS equipoNombre FROM inscripciones i JOIN torneos t ON t.id = i.torneo_id JOIN equipos e ON e.id = i.equipo_id WHERE i.solicitante_id = ? OR i.equipo_id IN (SELECT equipo_id FROM equipo_integrantes WHERE usuario_id = ?) ORDER BY i.creado_en DESC').bind(usuario.id, usuario.id).all();
    return c.json({ datos: results });
  })
  .post('/', async (c) => {
    const usuario = c.get('usuario');
    if (!usuario) throw errores.noAutenticado();
    if (usuario.rol !== 'jugador') throw errores.sinPermiso();
    const datos = await c.req.json<{ torneoId?: string; equipoId?: string }>();
    if (!datos.torneoId || !datos.equipoId) throw errores.validacion({ campos: ['torneoId', 'equipoId'] });
    const torneo = await c.env.DB.prepare("SELECT id FROM torneos WHERE id = ? AND estado = 'INSCRIPCIONES_ABIERTAS'").bind(datos.torneoId).first();
    if (!torneo) throw errores.conflicto('INSCRIPCIONES_CERRADAS', 'El torneo no tiene inscripciones abiertas');
    const equipo = await c.env.DB.prepare('SELECT id FROM equipos WHERE id = ? AND capitan_id = ?').bind(datos.equipoId, usuario.id).first();
    if (!equipo) throw errores.sinPermiso();
    const otroEquipo = await c.env.DB.prepare('SELECT i.id FROM inscripciones i JOIN equipo_integrantes ei ON ei.equipo_id = i.equipo_id WHERE i.torneo_id = ? AND i.estado IN (\'SOLICITADA\', \'APROBADA\') AND ei.usuario_id = ?').bind(datos.torneoId, usuario.id).first();
    if (otroEquipo) throw errores.conflicto('JUGADOR_EN_OTRO_EQUIPO', 'Un jugador no puede estar en dos equipos del mismo torneo');
    const id = crypto.randomUUID();
    try { await c.env.DB.prepare('INSERT INTO inscripciones (id, torneo_id, equipo_id, solicitante_id) VALUES (?, ?, ?, ?)').bind(id, datos.torneoId, datos.equipoId, usuario.id).run(); } catch (error) { if (error instanceof Error && /unique/i.test(error.message)) throw errores.conflicto('EQUIPO_YA_INSCRITO', 'El equipo ya tiene una inscripción para este torneo'); throw error; }
    return c.json({ datos: { id, torneoId: datos.torneoId, equipoId: datos.equipoId, estado: 'SOLICITADA' } }, 201);
  });

/**
 * Montadas en /api/admin/inscripciones (exigen rol admin).
 * Pendientes:
 * - UEB-Proyect-19 (KAN-32) · Aprobar, rechazar, inscribir directamente o retirar equipos
 */
const estadoSchema = z.object({ estado: z.enum(['APROBADA', 'RECHAZADA', 'RETIRADA']) });

export const inscripcionesAdminRoutes = new Hono<AppEnv>()
  .get('/', async (c) => {
    const { results } = await c.env.DB.prepare('SELECT i.id, i.estado, i.torneo_id AS torneoId, t.nombre AS torneoNombre, i.equipo_id AS equipoId, e.nombre AS equipoNombre, u.nombre_completo AS capitanNombre FROM inscripciones i JOIN torneos t ON t.id = i.torneo_id JOIN equipos e ON e.id = i.equipo_id JOIN usuarios u ON u.id = e.capitan_id ORDER BY i.creado_en DESC').all();
    return c.json({ datos: results });
  })
  .patch('/:id', zValidator('json', estadoSchema, siFallaLaValidacion), async (c) => {
    const estado = c.req.valid('json').estado;
    const resultado = await c.env.DB.prepare('UPDATE inscripciones SET estado = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?').bind(estado, c.req.param('id')).run();
    if (!resultado.success || resultado.meta.changes === 0) throw errores.noEncontrado('Inscripción');
    return c.json({ datos: { id: c.req.param('id'), estado } });
  });
