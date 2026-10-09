import { Hono } from 'hono';
import type { AppEnv } from '../../core/env';

/**
 * Épica E7 · Sorteo todos contra todos. Montadas en /api/admin/sorteo (exigen rol admin).
 * Pendientes:
 * - UEB-Proyect-20 (KAN-33) · Cerrar inscripciones y generar el fixture
 *   → el algoritmo round-robin va como función pura en sorteo/domain/ (sin base de datos)
 */
export const sorteoAdminRoutes = new Hono<AppEnv>();
