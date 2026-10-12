import { Hono } from 'hono';
import type { AppEnv } from '../../core/env';

/**
 * Épica E10 · Tabla de posiciones. Montadas en /api/tabla (exigen sesión).
 * Pendientes:
 * - UEB-Proyect-26 (KAN-39) · Calcular la tabla → GET /api/tabla/:torneoId
 *   → `calcularTabla(equipos, partidosJugados)` como función pura en tabla/domain/
 * (UEB-Proyect-27 · Visualizar la tabla es trabajo del frontend.)
 */
export const tablaRoutes = new Hono<AppEnv>()
  .get('/:torneoId', async (c) => {
    const { results } = await c.env.DB.prepare("SELECT e.id AS equipoId, e.nombre AS equipo, COUNT(CASE WHEN p.estado = 'JUGADO' THEN 1 END) AS partidosJugados, SUM(CASE WHEN p.estado = 'JUGADO' AND ((p.local_id = e.id AND p.goles_local > p.goles_visitante) OR (p.visitante_id = e.id AND p.goles_visitante > p.goles_local)) THEN 1 ELSE 0 END) AS ganados, SUM(CASE WHEN p.estado = 'JUGADO' AND p.goles_local = p.goles_visitante THEN 1 ELSE 0 END) AS empatados, SUM(CASE WHEN p.estado = 'JUGADO' AND ((p.local_id = e.id AND p.goles_local < p.goles_visitante) OR (p.visitante_id = e.id AND p.goles_visitante < p.goles_local)) THEN 1 ELSE 0 END) AS perdidos, COALESCE(SUM(CASE WHEN p.estado = 'JUGADO' AND p.local_id = e.id THEN p.goles_local WHEN p.estado = 'JUGADO' AND p.visitante_id = e.id THEN p.goles_visitante ELSE 0 END), 0) AS golesFavor, COALESCE(SUM(CASE WHEN p.estado = 'JUGADO' AND p.local_id = e.id THEN p.goles_visitante WHEN p.estado = 'JUGADO' AND p.visitante_id = e.id THEN p.goles_local ELSE 0 END), 0) AS golesContra, COALESCE(SUM(CASE WHEN p.estado = 'JUGADO' AND ((p.local_id = e.id AND p.goles_local > p.goles_visitante) OR (p.visitante_id = e.id AND p.goles_visitante > p.goles_local)) THEN 3 WHEN p.estado = 'JUGADO' AND p.goles_local = p.goles_visitante THEN 1 ELSE 0 END), 0) AS puntos FROM inscripciones i JOIN equipos e ON e.id = i.equipo_id LEFT JOIN partidos p ON p.torneo_id = i.torneo_id AND (p.local_id = e.id OR p.visitante_id = e.id) WHERE i.torneo_id = ? AND i.estado = 'APROBADO' GROUP BY e.id, e.nombre ORDER BY puntos DESC, golesFavor - golesContra DESC, golesFavor DESC, e.nombre").bind(c.req.param('torneoId')).all();
    return c.json({ datos: results });
  });
