import { z } from 'zod';

export const resumenEstadisticasAdminSchema = z.object({
  torneos: z.number().int().nonnegative(),
  equipos: z.number().int().nonnegative(),
  partidos: z.number().int().nonnegative(),
  jugadores: z.number().int().nonnegative(),
  pendientes: z.number().int().nonnegative(),
});

export type ResumenEstadisticasAdmin = z.infer<typeof resumenEstadisticasAdminSchema>;
