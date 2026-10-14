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
 * Si uno termina a las 4:00 y el otro empieza a las 4:00, NO se solapan.
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

/**
 * Formatea una fecha y hora en formato 12h amigable para Colombia (ej. 2:00 p. m., 9:00 a. m.).
 */
export function formatoHoraAmigable(fecha: Date): string {
  const formateador = new Intl.DateTimeFormat('es-CO', {
    timeZone: REGLAS.ZONA_HORARIA,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return formateador.format(fecha).replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Extrae la fecha en formato YYYY-MM-DD según la zona horaria oficial del torneo (America/Bogota).
 */
export function obtenerFechaCalendarioBogota(fecha: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: REGLAS.ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(fecha);
}

/**
 * Valida que el partido se encuentre dentro del horario permitido:
 * 6:00 a. m. a 10:00 p. m. (debe terminar a más tardar a las 10:00 p. m.) en America/Bogota.
 */
export function validarHorarioPermitido(
  inicio: Date,
  duracionMinutos: number = REGLAS.DURACION_PARTIDO_MINUTOS,
): { valido: boolean; mensaje?: string } {
  const formateador = new Intl.DateTimeFormat('en-US', {
    timeZone: REGLAS.ZONA_HORARIA,
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  });

  const partes = formateador.formatToParts(inicio);
  const hora = parseInt(partes.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const minuto = parseInt(partes.find((p) => p.type === 'minute')?.value ?? '0', 10);

  const minutosInicio = hora * 60 + minuto;
  const minutosFin = minutosInicio + duracionMinutos;

  // 6:00 a. m. = 360 minutos
  if (minutosInicio < 6 * 60) {
    return {
      valido: false,
      mensaje: 'El partido no puede programarse antes de las 6:00 a. m.',
    };
  }

  // 10:00 p. m. = 22:00 = 1320 minutos
  if (minutosFin > 22 * 60) {
    return {
      valido: false,
      mensaje: 'El partido debe terminar a más tardar a las 10:00 p. m.',
    };
  }

  return { valido: true };
}

/**
 * Función pura que analiza si la programación propuesta para un partido entra
 * en conflicto con otros partidos programados en la misma cancha o que involucren
 * a los mismos equipos, así como las restricciones horarias reglamentarias.
 */
export function verificarCrucesHorarios(entrada: EntradaValidacionCruce): ResultadoValidacionCruce {
  const duracion = entrada.duracionMinutos ?? REGLAS.DURACION_PARTIDO_MINUTOS;
  const inicioNuevo = new Date(entrada.fechaHora);

  // 1. Validar horario permitido (6:00 a. m. a 10:00 p. m.)
  const validacionHorario = validarHorarioPermitido(inicioNuevo, duracion);
  if (!validacionHorario.valido && validacionHorario.mensaje) {
    return {
      hayConflicto: true,
      conflicto: {
        tipo: 'CANCHA',
        mensaje: validacionHorario.mensaje,
      },
    };
  }

  const diaCalendarioNuevo = obtenerFechaCalendarioBogota(inicioNuevo);

  for (const otro of entrada.otrosPartidos) {
    // No comparar el partido consigo mismo en caso de reprogramación
    if (otro.id === entrada.partidoId) {
      continue;
    }

    if (!otro.fechaHora) {
      continue;
    }

    const inicioOtro = new Date(otro.fechaHora);
    const diaCalendarioOtro = obtenerFechaCalendarioBogota(inicioOtro);

    // 2. Regla KAN-35 (Escenario 3): Ningún equipo puede jugar dos partidos el mismo día
    if (diaCalendarioNuevo === diaCalendarioOtro) {
      const horaOtro = formatoHoraAmigable(inicioOtro);

      // Cruce de equipo local
      if (otro.localId === entrada.localId || otro.visitanteId === entrada.localId) {
        const nombreEquipo =
          otro.localId === entrada.localId ? otro.localNombre : otro.visitanteNombre;
        const rival = otro.localId === entrada.localId ? otro.visitanteNombre : otro.localNombre;
        return {
          hayConflicto: true,
          conflicto: {
            tipo: 'EQUIPO_LOCAL',
            mensaje: `${nombreEquipo} ya tiene un partido ese día (${horaOtro}, vs ${rival})`,
            partidoIdEnConflicto: otro.id,
          },
        };
      }

      // Cruce de equipo visitante
      if (otro.localId === entrada.visitanteId || otro.visitanteId === entrada.visitanteId) {
        const nombreEquipo =
          otro.localId === entrada.visitanteId ? otro.localNombre : otro.visitanteNombre;
        const rival =
          otro.localId === entrada.visitanteId ? otro.visitanteNombre : otro.localNombre;
        return {
          hayConflicto: true,
          conflicto: {
            tipo: 'EQUIPO_VISITANTE',
            mensaje: `${nombreEquipo} ya tiene un partido ese día (${horaOtro}, vs ${rival})`,
            partidoIdEnConflicto: otro.id,
          },
        };
      }
    }

    // 3. Regla KAN-35 (Escenario 2): Cruce en la misma cancha durante la ventana de 120 minutos
    if (haySolapamientoHorario(inicioNuevo, duracion, inicioOtro, duracion)) {
      if (otro.canchaId && otro.canchaId === entrada.canchaId) {
        const nombreCancha = otro.canchaNombre || 'La cancha seleccionada';
        const horaIni = formatoHoraAmigable(inicioOtro);
        const finOtro = new Date(inicioOtro.getTime() + duracion * 60_000);
        const horaFin = formatoHoraAmigable(finOtro);
        return {
          hayConflicto: true,
          conflicto: {
            tipo: 'CANCHA',
            mensaje: `Cruce de horario: ${nombreCancha} está ocupada de ${horaIni} a ${horaFin} (${otro.localNombre} vs ${otro.visitanteNombre})`,
            partidoIdEnConflicto: otro.id,
          },
        };
      }
    }
  }

  return { hayConflicto: false };
}
