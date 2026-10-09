import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import type { RespuestaLista } from '@shared/api';
import { consultaTorneosSchema, type TorneoResumen } from '@shared/torneos';
import type { AppEnv } from '../../core/env';
import { siFallaLaValidacion } from '../../core/validacion';
import { crearTorneosRepository } from './torneos.repository';
import { crearTorneosService } from './torneos.service';

/**
 * Épica E3 · Gestión de torneos.
 * Módulo de referencia: muestra el recorrido completo routes → service → domain → repository → D1.
 * Copia esta forma al implementar los demás módulos.
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
);

/**
 * Rutas de administración, montadas en /api/admin/torneos (exigen rol admin).
 * Pendientes:
 * - UEB-Proyect-07 (KAN-20) · Crear torneo y abrir inscripciones
 * - UEB-Proyect-08 (KAN-21) · Editar torneo
 * - UEB-Proyect-09 (KAN-22) · Eliminar torneo
 */
export const torneosAdminRoutes = new Hono<AppEnv>();
