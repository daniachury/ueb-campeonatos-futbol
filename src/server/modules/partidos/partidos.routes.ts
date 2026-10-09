import { Hono } from 'hono';
import type { AppEnv } from '../../core/env';

/**
 * Épicas E8 (programación) y E9 (resultados). Montadas en /api/partidos (exigen sesión).
 * Pendientes:
 * - UEB-Proyect-23 (KAN-36) · Ver el calendario de fechas → GET /api/partidos/calendario/:torneoId
 */
export const partidosRoutes = new Hono<AppEnv>();

/**
 * Montadas en /api/admin/partidos (exigen rol admin).
 * Pendientes:
 * - UEB-Proyect-22 (KAN-35) · Programar partido: lugar, fecha, hora y cancha
 *   → detección de cruces de horario como función pura en partidos/domain/
 * - UEB-Proyect-24 (KAN-37) · Registrar resultado y estadísticas
 *   → cálculo de puntos (3/1/0) como función pura en partidos/domain/
 * - UEB-Proyect-25 (KAN-38) · Corregir estadísticas de un partido
 */
export const partidosAdminRoutes = new Hono<AppEnv>();
