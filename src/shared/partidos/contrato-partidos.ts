import { z } from 'zod';
import type { EstadoPartido } from '../sorteo/contrato-sorteo';

export const reglaProgramacion = {
  DURACION_MINUTOS_DEFECTO: 120,
} as const;

export const esquemaProgramarPartido = z.object({
  canchaId: z.string().trim().min(1, 'Debe seleccionar una cancha válida'),
  fechaHora: z
    .string()
    .trim()
    .refine(
      (val) => !isNaN(Date.parse(val)),
      'La fecha y hora debe tener un formato válido (ISO 8601)',
    ),
});

export type ProgramarPartidoDto = z.infer<typeof esquemaProgramarPartido>;

export interface ConflictoHorarioInfo {
  tipo: 'CANCHA' | 'EQUIPO_LOCAL' | 'EQUIPO_VISITANTE';
  mensaje: string;
  partidoIdEnConflicto?: string;
}

export interface PartidoDetalleProgramacion {
  id: string;
  fechaId: string;
  torneoId: string;
  localId: string;
  visitanteId: string;
  localNombre: string;
  localColor?: string | null;
  visitanteNombre: string;
  visitanteColor?: string | null;
  estado: EstadoPartido;
  fechaHora: string | null;
  canchaId: string | null;
  cancha: string | null;
  canchaNombre?: string | null;
  sedeNombre?: string | null;
}
