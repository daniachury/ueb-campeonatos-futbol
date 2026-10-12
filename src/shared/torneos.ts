import { z } from 'zod';
import {
  ESTADOS_TORNEO_PUBLICOS,
  REGLAS,
  type EstadoTorneo,
} from './constants';

/** Retorna la fecha actual en formato ISO (YYYY-MM-DD) en la zona horaria oficial del torneo. */
export function obtenerFechaHoyBogota(): string {
  const formateador = new Intl.DateTimeFormat('en-CA', {
    timeZone: REGLAS.ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formateador.format(new Date());
}

/** Torneo tal como se muestra en el listado público para jugadores (UEB-Proyect-10). */
export interface TorneoResumen {
  id: string;
  nombre: string;
  estado: EstadoTorneo;
  /** Fecha ISO 8601 (YYYY-MM-DD). */
  fechaInicio: string;
  cupo: number;
}

/** Torneo completo para la vista administrativa (UEB-Proyect-07 · KAN-20). */
export interface TorneoAdminResumen {
  id: string;
  nombre: string;
  descripcion?: string | null;
  modalidad: string;
  formato: string;
  fechaInicio: string;
  cupo: number;
  estado: EstadoTorneo;
  creadoEn: string;
  actualizadoEn?: string;
}

/** Filtros del listado de torneos: GET /api/torneos?estado=EN_CURSO */
export const consultaTorneosSchema = z.object({
  estado: z.enum(ESTADOS_TORNEO_PUBLICOS).optional(),
});
export type ConsultaTorneos = z.infer<typeof consultaTorneosSchema>;

/** Esquema de validación para crear un torneo de fútbol 11 en formato liga (KAN-20). */
export const esquemaCrearTorneo = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(80, 'Máximo 80 caracteres'),
  descripcion: z
    .string()
    .max(500, 'Máximo 500 caracteres')
    .optional(),
  fechaInicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD')
    .refine(
      (fecha) => {
        const hoy = obtenerFechaHoyBogota();
        return fecha >= hoy;
      },
      {
        message: 'La fecha de inicio no puede ser anterior a hoy',
      },
    ),
  cupo: z.coerce
    .number()
    .int('El cupo debe ser un número entero')
    .min(REGLAS.EQUIPOS_POR_TORNEO_MIN, 'El cupo debe estar entre 3 y 20 equipos')
    .max(REGLAS.EQUIPOS_POR_TORNEO_MAX, 'El cupo debe estar entre 3 y 20 equipos'),
  modalidad: z.string().optional().default('FUTBOL_11').transform(() => 'FUTBOL_11'),
  formato: z.string().optional().default('LIGA').transform(() => 'LIGA'),
});

export type CrearTorneoDto = z.infer<typeof esquemaCrearTorneo>;

export interface RespuestaCrearTorneo {
  mensaje: string;
  torneo: TorneoAdminResumen;
}

export interface RespuestaAbrirInscripciones {
  mensaje: string;
  torneo: TorneoAdminResumen;
}
