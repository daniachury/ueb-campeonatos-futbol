import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import {
  inscribirDirectamenteSchema,
  motivoAccionSchema,
} from '@shared/inscripciones/contrato-inscripciones';
import type { AppEnv } from '../../core/env';
import { siFallaLaValidacion } from '../../core/validacion';
import { crearInscripcionesRepository } from './inscripciones.repository';
import { crearInscripcionesService } from './inscripciones.service';

/**
 * Épica E6 · Inscripción de equipos en torneos. Montadas en /api/inscripciones (exigen sesión).
 * Pendientes:
 * - UEB-Proyect-18 (KAN-31) · El capitán solicita la inscripción de su equipo
 */
export const inscripcionesRoutes = new Hono<AppEnv>().get('/', async (c) => {
  const usuario = c.get('usuario');
  const { results } = await c.env.DB.prepare(
    'SELECT id, torneo_id AS torneoId, equipo_id AS equipoId, estado FROM inscripciones WHERE solicitada_por = ? OR equipo_id IN (SELECT id FROM equipos WHERE capitan_id = ?) ORDER BY creada_en DESC',
  ).bind(usuario.id, usuario.id).all();
  return c.json({ datos: results });
});

/**
 * Montadas en /api/admin/inscripciones (exigen rol admin).
 * UEB-Proyect-19 (KAN-32) · Aprobar, rechazar, inscribir directamente o retirar equipos.
 */
export const inscripcionesAdminRoutes = new Hono<AppEnv>()
  .get('/torneos/:torneoId', async (c) => {
    const torneoId = c.req.param('torneoId');
    const repo = crearInscripcionesRepository(c.env.DB);
    const service = crearInscripcionesService(repo);

    const bandeja = await service.obtenerBandeja(torneoId);
    return c.json(bandeja);
  })
  .get('/torneos/:torneoId/equipos-disponibles', async (c) => {
    const torneoId = c.req.param('torneoId');
    const busqueda = c.req.query('q') ?? '';
    const repo = crearInscripcionesRepository(c.env.DB);
    const service = crearInscripcionesService(repo);

    const equipos = await service.buscarEquiposDisponibles(torneoId, busqueda);
    return c.json({ datos: equipos });
  })
  .post('/:id/aprobar', async (c) => {
    const id = c.req.param('id');
    const usuario = c.get('usuario');
    const repo = crearInscripcionesRepository(c.env.DB);
    const service = crearInscripcionesService(repo);

    await service.aprobarInscripcion(id, usuario.id);
    return c.json({ mensaje: 'Inscripción aprobada exitosamente' });
  })
  .post('/:id/rechazar', zValidator('json', motivoAccionSchema, siFallaLaValidacion), async (c) => {
    const id = c.req.param('id');
    const { motivo } = c.req.valid('json');
    const usuario = c.get('usuario');
    const repo = crearInscripcionesRepository(c.env.DB);
    const service = crearInscripcionesService(repo);

    await service.rechazarInscripcion(id, usuario.id, motivo);
    return c.json({ mensaje: 'Inscripción rechazada exitosamente' });
  })
  .post('/:id/retirar', zValidator('json', motivoAccionSchema, siFallaLaValidacion), async (c) => {
    const id = c.req.param('id');
    const { motivo } = c.req.valid('json');
    const usuario = c.get('usuario');
    const repo = crearInscripcionesRepository(c.env.DB);
    const service = crearInscripcionesService(repo);

    await service.retirarInscripcion(id, usuario.id, motivo);
    return c.json({ mensaje: 'Equipo retirado exitosamente' });
  })
  .post(
    '/torneos/:torneoId/directa',
    zValidator('json', inscribirDirectamenteSchema, siFallaLaValidacion),
    async (c) => {
      const torneoId = c.req.param('torneoId');
      const { equipoId } = c.req.valid('json');
      const usuario = c.get('usuario');
      const repo = crearInscripcionesRepository(c.env.DB);
      const service = crearInscripcionesService(repo);

      const id = await service.inscribirDirectamente(torneoId, equipoId, usuario.id);
      return c.json({ id, mensaje: 'Equipo inscrito directamente' }, 201);
    },
  )
  .post(
    '/torneos/:torneoId/inscripciones',
    zValidator('json', inscribirDirectamenteSchema, siFallaLaValidacion),
    async (c) => {
      const torneoId = c.req.param('torneoId');
      const { equipoId } = c.req.valid('json');
      const usuario = c.get('usuario');
      const repo = crearInscripcionesRepository(c.env.DB);
      const service = crearInscripcionesService(repo);

      const id = await service.inscribirDirectamente(torneoId, equipoId, usuario.id);
      return c.json({ id, mensaje: 'Equipo inscrito directamente' }, 201);
    },
  );
