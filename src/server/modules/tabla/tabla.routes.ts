import { Hono } from 'hono';
import type { AppEnv } from '../../core/env';

/**
 * Épica E10 · Tabla de posiciones. Montadas en /api/tabla (exigen sesión).
 * Pendientes:
 * - UEB-Proyect-26 (KAN-39) · Calcular la tabla → GET /api/tabla/:torneoId
 *   → `calcularTabla(equipos, partidosJugados)` como función pura en tabla/domain/
 * (UEB-Proyect-27 · Visualizar la tabla es trabajo del frontend.)
 */
export const tablaRoutes = new Hono<AppEnv>();
