import { Hono } from 'hono';
import type { AppEnv } from '../../core/env';

/**
 * Épicas E4 (equipos) y E5 (plantillas). Montadas en /api/equipos (exigen sesión).
 * Pendientes:
 * - UEB-Proyect-11 (KAN-24) · Crear equipo (el creador queda como capitán)
 * - UEB-Proyect-14 (KAN-27) · Unirme a un equipo
 * - UEB-Proyect-15 (KAN-28) · Regla: un jugador no puede estar en dos equipos del mismo torneo
 *   → función pura en equipos/domain/, reutilizada también por el módulo de inscripciones
 * - UEB-Proyect-16 (KAN-29) · Salir de un equipo con traspaso de capitanía
 */
export const equiposRoutes = new Hono<AppEnv>();

/**
 * Montadas en /api/admin/equipos (exigen rol admin).
 * Pendientes:
 * - UEB-Proyect-12 (KAN-25) · Editar equipos
 * - UEB-Proyect-13 (KAN-26) · Eliminar equipos
 * - UEB-Proyect-17 (KAN-30) · Retirar jugadores de un equipo
 */
export const equiposAdminRoutes = new Hono<AppEnv>();
