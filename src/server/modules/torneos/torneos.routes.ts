import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import type { RespuestaLista } from '@shared/api';
import {
  consultaTorneosSchema,
  esquemaCrearTorneo,
  type TorneoAdminResumen,
  type TorneoResumen,
} from '@shared/torneos';
import type { AppEnv } from '../../core/env';
import { siFallaLaValidacion } from '../../core/validacion';
import { crearSorteoService } from '../sorteo/sorteo.routes';
import { crearTorneosRepository } from './torneos.repository';
import { crearTorneosService } from './torneos.service';

/**
 * Épica E3 · Gestión de torneos.
 * Rutas públicas (o con sesión de jugador): /api/torneos
 */
export const torneosRoutes = new Hono<AppEnv>().get(
  '/',
  zValidator('query', consultaTorneosSchema, siFallaLaValidacion),
  async (c) => {
    // UEB-Proyect-10 (KAN-23) · Ver todos los torneos.
    const servicio = crearTorneosService(crearTorneosRepository(c.env.DB));
    const { estado } = c.req.valid('query');

    const respuesta: RespuestaLista<TorneoResumen> = {
      datos: await servicio.listarPublicos(estado),
    };
    return c.json(respuesta);
  },
).get('/:id', async (c) => {
  const torneo = await crearTorneosService(crearTorneosRepository(c.env.DB)).obtenerPorId(c.req.param('id'));
  if (!torneo) return c.json({ mensaje: 'Torneo no encontrado' }, 404);
  return c.json({ datos: torneo });
});

/**
 * Rutas de administración, montadas en /api/admin/torneos (exigen rol admin).
 * - UEB-Proyect-07 (KAN-20) · Crear torneo y abrir inscripciones
 * - UEB-Proyect-20 (KAN-33) · Sorteo y Fixture
 */
export const torneosAdminRoutes = new Hono<AppEnv>()
  .get('/', async (c) => {
    const servicio = crearTorneosService(crearTorneosRepository(c.env.DB));
    const torneos = await servicio.listarAdmin();
    const respuesta: RespuestaLista<TorneoAdminResumen> = {
      datos: torneos,
    };
    return c.json(respuesta);
  })
  .get('/:id', async (c) => {
    const torneoId = c.req.param('id');
    const servicio = crearTorneosService(crearTorneosRepository(c.env.DB));
    const torneo = await servicio.obtenerPorId(torneoId);
    return c.json(torneo);
  })
  .post(
    '/',
    zValidator('json', esquemaCrearTorneo, siFallaLaValidacion),
    async (c) => {
      const datos = c.req.valid('json');
      const servicio = crearTorneosService(crearTorneosRepository(c.env.DB));
      const torneo = await servicio.crearTorneo(datos);
      return c.json(
        {
          mensaje: 'Torneo creado exitosamente en estado borrador',
          torneo,
        },
        201,
      );
    },
  )
  .post('/:id/abrir-inscripciones', async (c) => {
    const torneoId = c.req.param('id');
    const servicio = crearTorneosService(crearTorneosRepository(c.env.DB));
    const torneo = await servicio.abrirInscripciones(torneoId);
    return c.json({
      mensaje: 'Inscripciones abiertas exitosamente',
      torneo,
    });
  })
  .post('/:id/sorteo', async (c) => {
    const torneoId = c.req.param('id');
    const service = crearSorteoService(c.env.DB);
    const fixture = await service.ejecutarSorteo(torneoId);
    return c.json(
      {
        mensaje: 'Sorteo generado exitosamente e inscripciones cerradas',
        fixture,
      },
      201,
    );
  })
  .post('/:id/sorteo/repetir', async (c) => {
    const torneoId = c.req.param('id');
    const service = crearSorteoService(c.env.DB);
    const fixture = await service.repetirSorteo(torneoId);
    return c.json({
      mensaje: 'Sorteo repetido exitosamente con nuevo orden aleatorio',
      fixture,
    });
  })
  .get('/:id/fixture', async (c) => {
    const torneoId = c.req.param('id');
    const service = crearSorteoService(c.env.DB);
    const fixture = await service.obtenerFixture(torneoId);
    return c.json(fixture);
  });
