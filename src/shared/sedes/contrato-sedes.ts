import { z } from 'zod';

export const SUPERFICIES_CANCHA = ['Natural', 'Sintética', 'Otra'] as const;
export type SuperficieCancha = (typeof SUPERFICIES_CANCHA)[number];

export const reglaSede = {
  NOMBRE_MIN: 3,
  NOMBRE_MAX: 80,
  DIRECCION_MIN: 5,
  DIRECCION_MAX: 150,
  CIUDAD_MIN: 2,
  CIUDAD_MAX: 60,
  CIUDAD_DEFECTO: 'Bogotá',
  INDICACIONES_MAX: 300,
} as const;

export const reglaCancha = {
  NOMBRE_MIN: 1,
  NOMBRE_MAX: 30,
} as const;

export const esquemaCrearSede = z.object({
  nombre: z
    .string()
    .trim()
    .min(reglaSede.NOMBRE_MIN, `El nombre debe tener al menos ${reglaSede.NOMBRE_MIN} caracteres`)
    .max(reglaSede.NOMBRE_MAX, `El nombre no puede exceder ${reglaSede.NOMBRE_MAX} caracteres`),
  direccion: z
    .string()
    .trim()
    .min(reglaSede.DIRECCION_MIN, `La dirección debe tener al menos ${reglaSede.DIRECCION_MIN} caracteres`)
    .max(reglaSede.DIRECCION_MAX, `La dirección no puede exceder ${reglaSede.DIRECCION_MAX} caracteres`),
  ciudad: z
    .string()
    .trim()
    .min(reglaSede.CIUDAD_MIN, `La ciudad debe tener al menos ${reglaSede.CIUDAD_MIN} caracteres`)
    .max(reglaSede.CIUDAD_MAX, `La ciudad no puede exceder ${reglaSede.CIUDAD_MAX} caracteres`)
    .default(reglaSede.CIUDAD_DEFECTO),
  indicaciones: z
    .string()
    .trim()
    .max(reglaSede.INDICACIONES_MAX, `Las indicaciones no pueden exceder ${reglaSede.INDICACIONES_MAX} caracteres`)
    .optional()
    .nullable(),
});

export const esquemaEditarSede = z.object({
  nombre: z
    .string()
    .trim()
    .min(reglaSede.NOMBRE_MIN, `El nombre debe tener al menos ${reglaSede.NOMBRE_MIN} caracteres`)
    .max(reglaSede.NOMBRE_MAX, `El nombre no puede exceder ${reglaSede.NOMBRE_MAX} caracteres`)
    .optional(),
  direccion: z
    .string()
    .trim()
    .min(reglaSede.DIRECCION_MIN, `La dirección debe tener al menos ${reglaSede.DIRECCION_MIN} caracteres`)
    .max(reglaSede.DIRECCION_MAX, `La dirección no puede exceder ${reglaSede.DIRECCION_MAX} caracteres`)
    .optional(),
  ciudad: z
    .string()
    .trim()
    .min(reglaSede.CIUDAD_MIN, `La ciudad debe tener al menos ${reglaSede.CIUDAD_MIN} caracteres`)
    .max(reglaSede.CIUDAD_MAX, `La ciudad no puede exceder ${reglaSede.CIUDAD_MAX} caracteres`)
    .optional(),
  indicaciones: z
    .string()
    .trim()
    .max(reglaSede.INDICACIONES_MAX, `Las indicaciones no pueden exceder ${reglaSede.INDICACIONES_MAX} caracteres`)
    .optional()
    .nullable(),
});

export const esquemaCrearCancha = z.object({
  nombre: z
    .string()
    .trim()
    .min(reglaCancha.NOMBRE_MIN, `El nombre de la cancha debe tener al menos ${reglaCancha.NOMBRE_MIN} caracter`)
    .max(reglaCancha.NOMBRE_MAX, `El nombre de la cancha no puede exceder ${reglaCancha.NOMBRE_MAX} caracteres`),
  superficie: z.enum(SUPERFICIES_CANCHA).optional().nullable(),
  activa: z.boolean().default(true),
});

export const esquemaEditarCancha = z.object({
  nombre: z
    .string()
    .trim()
    .min(reglaCancha.NOMBRE_MIN, `El nombre de la cancha debe tener al menos ${reglaCancha.NOMBRE_MIN} caracter`)
    .max(reglaCancha.NOMBRE_MAX, `El nombre de la cancha no puede exceder ${reglaCancha.NOMBRE_MAX} caracteres`)
    .optional(),
  superficie: z.enum(SUPERFICIES_CANCHA).optional().nullable(),
  activa: z.boolean().optional(),
});

export type CrearSedeDto = z.infer<typeof esquemaCrearSede>;
export type EditarSedeDto = z.infer<typeof esquemaEditarSede>;
export type CrearCanchaDto = z.infer<typeof esquemaCrearCancha>;
export type EditarCanchaDto = z.infer<typeof esquemaEditarCancha>;

export interface CanchaResumen {
  id: string;
  sedeId: string;
  nombre: string;
  superficie: SuperficieCancha | null;
  activa: boolean;
  partidosProgramados: number;
  creadoEn: string;
  actualizadoEn: string;
}

export interface SedeResumen {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  indicaciones?: string | null;
  totalCanchas: number;
  totalPartidosProgramados: number;
  canchas: CanchaResumen[];
  creadoEn: string;
  actualizadoEn: string;
}

export interface CanchaDisponibleSelector {
  id: string;
  nombre: string;
  sedeId: string;
  sedeNombre: string;
  superficie: SuperficieCancha | null;
}
