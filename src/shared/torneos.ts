import { z } from 'zod';
import { ESTADOS_TORNEO_PUBLICOS, type EstadoTorneo } from './constants';


export interface TorneoResumen {
  id: string;
  nombre: string;
  estado: EstadoTorneo;

  fechaInicio: string;
  cupo: number;
}


export const consultaTorneosSchema = z.object({
  estado: z.enum(ESTADOS_TORNEO_PUBLICOS).optional(),
});
export type ConsultaTorneos = z.infer<typeof consultaTorneosSchema>;

export const crearTorneoSchema = z.object({
  nombre: z.string().trim().min(3).max(80),
  descripcion: z.string().trim().max(500).optional().default(''),
  fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cupo: z.coerce.number().int().min(3).max(20),
});
export type CrearTorneo = z.infer<typeof crearTorneoSchema>;
