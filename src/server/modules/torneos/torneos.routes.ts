import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import type { RespuestaLista } from '@shared/api';
import { consultaTorneosSchema, crearTorneoSchema, type TorneoResumen } from '@shared/torneos';
import { z } from 'zod';
import type { AppEnv } from '../../core/env';
import { siFallaLaValidacion } from '../../core/validacion';
import { crearTorneosRepository } from './torneos.repository';
import { crearTorneosService } from './torneos.service';


export const torneosRoutes = new Hono<AppEnv>().get(
  '/',
  zValidator('query', consultaTorneosSchema, siFallaLaValidacion),
  async (c) => {

    const servicio = crearTorneosService(crearTorneosRepository(c.env.DB));
    const { estado } = c.req.valid('query');

    const respuesta: RespuestaLista<TorneoResumen> = {
      datos: await servicio.listarPublicos(estado),
    };
    return c.json(respuesta);
  },
);


export const torneosAdminRoutes = new Hono<AppEnv>()
  .post('/', zValidator('json', crearTorneoSchema, siFallaLaValidacion), async (c) => {
    const servicio = crearTorneosService(crearTorneosRepository(c.env.DB));
    return c.json({ datos: await servicio.crear(c.req.valid('json')) }, 201);
  })
  .post('/:id/abrir-inscripciones', zValidator('param', z.object({ id: z.string().min(1) }), siFallaLaValidacion), async (c) => {
    const servicio = crearTorneosService(crearTorneosRepository(c.env.DB));
    await servicio.abrirInscripciones(c.req.valid('param').id);
    return c.json({ datos: { estado: 'INSCRIPCIONES_ABIERTAS' } });
  });
