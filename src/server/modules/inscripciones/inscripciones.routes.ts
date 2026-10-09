import { Hono } from 'hono';
import type { AppEnv } from '../../core/env';

/**
 * Épica E6 · Inscripción de equipos en torneos. Montadas en /api/inscripciones (exigen sesión).
 * Pendientes:
 * - UEB-Proyect-18 (KAN-31) · El capitán solicita la inscripción de su equipo
 */
export const inscripcionesRoutes = new Hono<AppEnv>();

/**
 * Montadas en /api/admin/inscripciones (exigen rol admin).
 * Pendientes:
 * - UEB-Proyect-19 (KAN-32) · Aprobar, rechazar, inscribir directamente o retirar equipos
 */
export const inscripcionesAdminRoutes = new Hono<AppEnv>();
