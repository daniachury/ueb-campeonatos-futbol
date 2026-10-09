import { Hono } from 'hono';
import type { AppEnv } from '../../core/env';

/**
 * GET /api/health: confirma que el Worker responde y que la base de datos D1 está accesible.
 * Sirve para verificar un despliegue y para monitoreo.
 */
export const healthRoutes = new Hono<AppEnv>().get('/', async (c) => {
  try {
    await c.env.DB.prepare('SELECT 1').first();
    return c.json({ estado: 'ok', baseDeDatos: 'ok' });
  } catch (error) {
    console.error('Health check: la base de datos no responde', error);
    return c.json({ estado: 'degradado', baseDeDatos: 'error' }, 503);
  }
});
