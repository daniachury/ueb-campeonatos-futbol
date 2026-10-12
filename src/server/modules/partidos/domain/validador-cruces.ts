import { REGLAS } from '../../../../shared/constants';
import type { ConflictoHorarioInfo } from '../../../../shared/partidos/contrato-partidos';

export interface PartidoProgramadoExistente {
  id: string;
  localId: string;
  localNombre: string;
  visitanteId: string;
  visitanteNombre: string;
  canchaId: string | null;
  canchaNombre?: string | null;
  sedeNombre?: string | null;
  fechaHora: string | Date;
}

export interface EntradaValidacionCruce {
  partidoId: string;
  localId: string;
  visitanteId: string;
  canchaId: string;
  fechaHora: string | Date;
  duracionMinutos?: number;
  otrosPartidos: PartidoProgramadoExistente[];
}

export interface ResultadoValidacionCruce {
  hayConflicto: boolean;
  conflicto?: ConflictoHorarioInfo;
}

/**
 * Determina si dos intervalos de tiempo se solapan.
 * [inicio1, inicio1 + duracion1] y [inicio2, inicio2 + duracion2].
 */
export function haySolapamientoHorario(
  inicio1: Date,
  duracionMinutos1: number,
  inicio2: Date,
  duracionMinutos2: number,
): boolean {
  const tIni1 = inicio1.getTime();
  const tFin1 = tIni1 + duracionMinutos1 * 60_000;
  const tIni2 = inicio2.getTime();
  const tFin2 = tIni2 + duracionMinutos2 * 60_000;

  return tIni1 < tFin2 && tFin1 > tIni2;
}

function formatoHoraAmigable(fecha: Date): string {
  const horas = fecha.getHours().toString().padStart(2, '0');
  const minutos = fecha.getMinutes().toString().padStart(2, '0');
  return `${horas}:${minutos}`;
}

/**
 * Función pura que analiza si la programación propuesta para un partido entra
 * en conflicto con otros partidos programados en la misma cancha o que involucren
 * a los mismos equipos.
 */
export function verificarCrucesHorarios(
  entrada: EntradaValidacionCruce,
): ResultadoValidacionCruce {
  const duracion = entrada.duracionMinutos ?? REGLAS.DURACION_PARTIDO_MINUTOS;
  const inicioNuevo = new Date(entrada.fechaHora);

  for (const otro of entrada.otrosPartidos) {
    // No comparar el partido consigo mismo en caso de reprogramación
    if (otro.id === entrada.partidoId) {
      continue;
    }

    if (!otro.fechaHora) {
      continue;
    }

    const inicioOtro = new Date(otro.fechaHora);

    if (haySolapamientoHorario(inicioNuevo, duracion, inicioOtro, duracion)) {
      const horaIni = formatoHoraAmigable(inicioOtro);
      const finOtro = new Date(inicioOtro.getTime() + duracion * 60_000);
      const horaFin = formatoHoraAmigable(finOtro);

      // 1. Cruce en la misma cancha
      if (otro.canchaId && otro.canchaId === entrada.canchaId) {
        const nombreCancha = otro.canchaNombre || 'la cancha seleccionada';
        return {
          hayConflicto: true,
          conflicto: {
            tipo: 'CANCHA',
            mensaje: `Cruce de horario: ${nombreCancha} ya tiene programado el partido "${otro.localNombre} vs ${otro.visitanteNombre}" de ${horaIni} a ${horaFin}`,
            partidoIdEnConflicto: otro.id,
          },
        };
      }

      // 2. Cruce del equipo local
      if (otro.localId === entrada.localId || otro.visitanteId === entrada.localId) {
        const nombreEquipo = otro.localId === entrada.localId ? otro.localNombre : otro.visitanteNombre;
        return {
          hayConflicto: true,
          conflicto: {
            tipo: 'EQUIPO_LOCAL',
            mensaje: `Cruce de horario: El equipo local (${nombreEquipo}) ya tiene otro partido programado de ${horaIni} a ${horaFin}`,
            partidoIdEnConflicto: otro.id,
          },
        };
      }

      // 3. Cruce del equipo visitante
      if (otro.localId === entrada.visitanteId || otro.visitanteId === entrada.visitanteId) {
        const nombreEquipo = otro.localId === entrada.visitanteId ? otro.localNombre : otro.visitanteNombre;
        return {
          hayConflicto: true,
          conflicto: {
            tipo: 'EQUIPO_VISITANTE',
            mensaje: `Cruce de horario: El equipo visitante (${nombreEquipo}) ya tiene otro partido programado de ${horaIni} a ${horaFin}`,
            partidoIdEnConflicto: otro.id,
          },
        };
      }
    }
  }

  return { hayConflicto: false };
}
