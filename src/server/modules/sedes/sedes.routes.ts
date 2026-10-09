import { Hono } from 'hono';
import type { AppEnv } from '../../core/env';

/**
 * Épica E8 · Sedes y canchas. Montadas en /api/admin/sedes (exigen rol admin).
 * Pendientes:
 * - UEB-Proyect-21 (KAN-34) · Crear lugares de partidos (sedes y canchas)
 */
export const sedesAdminRoutes = new Hono<AppEnv>();
