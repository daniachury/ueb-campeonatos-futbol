import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import type { AppEnv } from './core/env';
import { manejarError, rutaNoEncontrada } from './core/errors';
import { requireAuth } from './core/middleware/auth';
import { requireRole } from './core/middleware/require-role';
import { authRoutes } from './modules/auth/auth.routes';
import { equiposAdminRoutes, equiposRoutes } from './modules/equipos/equipos.routes';
import { healthRoutes } from './modules/health/health.routes';
import {
  inscripcionesAdminRoutes,
  inscripcionesRoutes,
} from './modules/inscripciones/inscripciones.routes';
import { partidosAdminRoutes, partidosRoutes } from './modules/partidos/partidos.routes';
import { sedesAdminRoutes } from './modules/sedes/sedes.routes';
import { sorteoAdminRoutes } from './modules/sorteo/sorteo.routes';
import { tablaRoutes } from './modules/tabla/tabla.routes';
import { torneosAdminRoutes, torneosRoutes } from './modules/torneos/torneos.routes';
import { usuariosAdminRoutes, usuariosRoutes } from './modules/usuarios/usuarios.routes';

/**
 * Prefijos de /api que exigen sesión. Las rutas de /api/admin además exigen rol admin.
 * Este archivo es el único lugar donde se decide qué es público y qué no (UEB-Proyect-02):
 * para auditar la seguridad basta con leerlo.
 *
 * TODO(UEB-Proyect-10): la historia pide sesión para ver torneos. Agregar '/torneos'
 * aquí cuando esté listo el inicio de sesión (UEB-Proyect-04).
 */
const PREFIJOS_CON_SESION = ['/usuarios', '/equipos', '/inscripciones', '/partidos', '/tabla'];

export function crearApp() {
  const api = new Hono<AppEnv>();

  // 1. Protección por grupos. Va antes de las rutas para que se ejecute primero.
  api.use('/admin/*', requireAuth, requireRole('admin'));
  for (const prefijo of PREFIJOS_CON_SESION) {
    api.use(prefijo, requireAuth);
    api.use(`${prefijo}/*`, requireAuth);
  }

  // 2. Rutas públicas.
  api.route('/health', healthRoutes);
  api.route('/auth', authRoutes);
  api.route('/torneos', torneosRoutes);

  // 3. Rutas con sesión (jugador o administrador).
  api.route('/usuarios', usuariosRoutes);
  api.route('/equipos', equiposRoutes);
  api.route('/inscripciones', inscripcionesRoutes);
  api.route('/partidos', partidosRoutes);
  api.route('/tabla', tablaRoutes);

  // 4. Rutas de administrador.
  api.route('/admin/usuarios', usuariosAdminRoutes);
  api.route('/admin/torneos', torneosAdminRoutes);
  api.route('/admin/equipos', equiposAdminRoutes);
  api.route('/admin/inscripciones', inscripcionesAdminRoutes);
  api.route('/admin/sorteo', sorteoAdminRoutes);
  api.route('/admin/sedes', sedesAdminRoutes);
  api.route('/admin/partidos', partidosAdminRoutes);

  const app = new Hono<AppEnv>();
  // Cabeceras de seguridad en todas las respuestas de la API (nosniff, HSTS, sin iframes…).
  // Las del frontend estático están en public/_headers.
  app.use('*', secureHeaders());
  app.route('/api', api);
  app.notFound(rutaNoEncontrada);
  app.onError(manejarError);
  return app;
}
