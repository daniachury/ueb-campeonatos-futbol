import { Hono } from 'hono';
import type { AppEnv } from '../../core/env';
import { crearEstadisticasAdminService } from './estadisticas.service';

/**
 * Rutas de estadísticas del panel de administración.
 * Montadas en /api/admin/estadisticas (exigen rol admin).
 */
export const estadisticasAdminRoutes = new Hono<AppEnv>().get('/', async (c) => {
  const service = crearEstadisticasAdminService(c.env.DB);
  const resumen = await service.obtenerResumen();
  return c.json(resumen);
});
