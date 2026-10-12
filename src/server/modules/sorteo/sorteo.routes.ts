import { Hono } from 'hono';
import type { AppEnv } from '../../core/env';
import { errores } from '../../core/errors';
import { crearFixture } from './domain/crear-fixture';

/**
 * Épica E7 · Sorteo todos contra todos. Montadas en /api/admin/sorteo (exigen rol admin).
 * Pendientes:
 * - UEB-Proyect-20 (KAN-33) · Cerrar inscripciones y generar el fixture
 *   → el algoritmo round-robin va como función pura en sorteo/domain/ (sin base de datos)
 */
export const sorteoAdminRoutes = new Hono<AppEnv>()
  .post('/:torneoId/generar', async (c) => {
    const torneoId = c.req.param('torneoId');
    const torneo = await c.env.DB.prepare("SELECT id FROM torneos WHERE id = ? AND estado = 'INSCRIPCIONES_ABIERTAS'").bind(torneoId).first();
    if (!torneo) throw errores.conflicto('TORNEO_NO_DISPONIBLE', 'El torneo no tiene inscripciones abiertas');
    const { results } = await c.env.DB.prepare("SELECT equipo_id AS equipoId FROM inscripciones WHERE torneo_id = ? AND estado = 'APROBADA' ORDER BY creado_en").bind(torneoId).all<{ equipoId: string }>();
    if (results.length < 2) throw errores.conflicto('EQUIPOS_INSUFICIENTES', 'Se necesitan al menos dos equipos aprobados');
    const partidos = crearFixture(results.map((equipo) => equipo.equipoId));
    await c.env.DB.batch([
      ...partidos.map((partido) => c.env.DB.prepare('INSERT INTO partidos (id, torneo_id, equipo_local_id, equipo_visitante_id, jornada) VALUES (?, ?, ?, ?, ?)').bind(crypto.randomUUID(), torneoId, partido.localId, partido.visitanteId, partido.jornada)),
      c.env.DB.prepare("UPDATE torneos SET estado = 'EN_CURSO', actualizado_en = CURRENT_TIMESTAMP WHERE id = ?").bind(torneoId),
    ]);
    return c.json({ datos: { torneoId, partidos: partidos.length, estado: 'EN_CURSO' } }, 201);
  });
