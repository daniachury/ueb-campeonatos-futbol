import { z } from 'zod';
import { REGLAS, type EstadoInscripcion, type EstadoTorneo } from '../constants';

export const motivoAccionSchema = z.object({
  motivo: z
    .string()
    .trim()
    .min(
      REGLAS.MOTIVO_RECHAZO_MIN,
      `El motivo debe tener entre ${REGLAS.MOTIVO_RECHAZO_MIN} y ${REGLAS.MOTIVO_RECHAZO_MAX} caracteres`,
    )
    .max(
      REGLAS.MOTIVO_RECHAZO_MAX,
      `El motivo debe tener entre ${REGLAS.MOTIVO_RECHAZO_MIN} y ${REGLAS.MOTIVO_RECHAZO_MAX} caracteres`,
    ),
});
export type MotivoAccionDTO = z.infer<typeof motivoAccionSchema>;

export const inscribirDirectamenteSchema = z.object({
  equipoId: z.string().trim().min(1, 'Selecciona un equipo'),
});
export type InscribirDirectamenteDTO = z.infer<typeof inscribirDirectamenteSchema>;

export const solicitarInscripcionSchema = z.object({
  torneoId: z.string().trim().min(1, 'Selecciona un torneo'),
  equipoId: z.string().trim().min(1, 'Selecciona un equipo'),
});
export type SolicitarInscripcionDTO = z.infer<typeof solicitarInscripcionSchema>;

export interface SolicitudInscripcionResumen {
  id: string;
  torneoId: string;
  equipoId: string;
  equipoNombre: string;
  equipoColor: string | null;
  capitanNombre: string;
  cantidadJugadores: number;
  estado: EstadoInscripcion;
  fechaSolicitud: string;
  motivo: string | null;
  aprobadoPor: string | null;
  fechaResolucion: string | null;
}

export interface TorneoBandejaResumen {
  id: string;
  nombre: string;
  cupo: number;
  estado: EstadoTorneo;
  equiposAprobados: number;
}

export interface BandejaInscripcionesResponse {
  torneo: TorneoBandejaResumen;
  pendientes: SolicitudInscripcionResumen[];
  aprobados: SolicitudInscripcionResumen[];
  rechazados: SolicitudInscripcionResumen[];
  contadorAprobados: string;
  cupoCompleto: boolean;
  torneoEnCurso: boolean;
}

export interface EquipoDisponibleParaInscripcion {
  id: string;
  nombre: string;
  color: string | null;
  capitanNombre: string;
  cantidadJugadores: number;
}
