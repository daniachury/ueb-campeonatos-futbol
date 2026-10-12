import { Hono } from 'hono';
import type { AppEnv } from '../../core/env';

/**
 * Épica E2 · Usuarios. Montadas en /api/usuarios (exigen sesión).
 * Pendientes:
 * - UEB-Proyect-06 (KAN-19) · Editar mis datos → GET/PATCH /api/usuarios/me
 */
export const usuariosRoutes = new Hono<AppEnv>();

/**
 * Montadas en /api/admin/usuarios (exigen rol admin).
 * Pendientes:
 * - UEB-Proyect-05 (KAN-18) · Registro de administradores
 * - UEB-Proyect-17 (KAN-30) · Eliminar (desactivar) jugadores del sistema
 */
export const usuariosAdminRoutes = new Hono<AppEnv>();
