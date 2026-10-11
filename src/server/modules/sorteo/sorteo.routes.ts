import { Hono } from 'hono';
import type { AppEnv } from '../../core/env';
import { SorteoRepository } from './sorteo.repository';
import { SorteoService } from './sorteo.service';

/**
 * Factory para instanciar el servicio de sorteo con la base de datos D1 del contexto.
 */
export function crearSorteoService(db: any): SorteoService {
  const repo = new SorteoRepository(db);
  return new SorteoService(repo);
}

/**
 * Épica E7 · Sorteo todos contra todos. Montadas en /api/admin/sorteo (exigen rol admin).
 * UEB-Proyect-20 (KAN-33) · Cerrar inscripciones y generar el sorteo todos contra todos.
 */
export const sorteoAdminRoutes = new Hono<AppEnv>()
  .get('/torneos/:torneoId/vista-previa', async (c) => {
    const torneoId = c.req.param('torneoId');
    const service = crearSorteoService(c.env.DB);
    const vistaPrevia = await service.obtenerVistaPrevia(torneoId);
    return c.json(vistaPrevia);
  })
  .post('/torneos/:torneoId', async (c) => {
    const torneoId = c.req.param('torneoId');
    const service = crearSorteoService(c.env.DB);
    const fixture = await service.ejecutarSorteo(torneoId);
    return c.json({
      mensaje: 'Sorteo generado exitosamente e inscripciones cerradas',
      fixture,
    }, 201);
  })
  .post('/torneos/:torneoId/repetir', async (c) => {
    const torneoId = c.req.param('torneoId');
    const service = crearSorteoService(c.env.DB);
    const fixture = await service.repetirSorteo(torneoId);
    return c.json({
      mensaje: 'Sorteo repetido exitosamente con nuevo orden aleatorio',
      fixture,
    });
  })
  .get('/torneos/:torneoId/fixture', async (c) => {
    const torneoId = c.req.param('torneoId');
    const service = crearSorteoService(c.env.DB);
    const fixture = await service.obtenerFixture(torneoId);
    return c.json(fixture);
  });
