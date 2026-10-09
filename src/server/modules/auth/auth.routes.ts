import { Hono } from 'hono';
import type { AppEnv } from '../../core/env';

/**
 * Épica E2 · Autenticación. Rutas públicas en /api/auth.
 * Pendientes:
 * - UEB-Proyect-03 (KAN-16) · Registro de jugador → POST /api/auth/registro
 * - UEB-Proyect-04 (KAN-17) · Inicio y cierre de sesión → POST /api/auth/login, POST /api/auth/logout
 *   (al terminarla, completar `requireAuth` en core/middleware/auth.ts)
 */
export const authRoutes = new Hono<AppEnv>();
