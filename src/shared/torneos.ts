import { z } from 'zod';
import { ESTADOS_TORNEO_PUBLICOS, type EstadoTorneo } from './constants';

/** Torneo tal como se muestra en el listado (UEB-Proyect-10). */
export interface TorneoResumen {
  id: string;
  nombre: string;
  estado: EstadoTorneo;
  /** Fecha ISO 8601 (YYYY-MM-DD). */
  fechaInicio: string;
  cupo: number;
}

/** Filtros del listado de torneos: GET /api/torneos?estado=EN_CURSO */
export const consultaTorneosSchema = z.object({
  estado: z.enum(ESTADOS_TORNEO_PUBLICOS).optional(),
});
export type ConsultaTorneos = z.infer<typeof consultaTorneosSchema>;
