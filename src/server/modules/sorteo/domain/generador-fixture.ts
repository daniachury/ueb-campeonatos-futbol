import { AppError } from '../../../core/errors';
import { REGLAS } from '../../../../shared/constants';

export interface EquipoSorteo {
  id: string;
  nombre: string;
  color?: string | null;
}

export interface PartidoGenerado {
  localId: string;
  visitanteId: string;
}

export interface FechaGenerada {
  numero: number;
  equipoDescansaId: string | null;
  partidos: PartidoGenerado[];
}

export interface ResultadoFixtureGenerado {
  totalEquipos: number;
  totalFechas: number;
  totalPartidos: number;
  fechas: FechaGenerada[];
}

export interface OpcionesSorteo {
  /** Función para desordenar equipos (inyección de dependencias para tests deterministas). */
  barajar?: <T>(items: T[]) => T[];
}

/** Algoritmo Fisher-Yates por defecto. */
function barajarPorDefecto<T>(items: T[]): T[] {
  const copia = [...items];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/**
 * Genera el fixture todos contra todos (round-robin) utilizando el método del círculo.
 * Función pura de dominio, sin efectos secundarios ni acceso a base de datos.
 */
export function generarFixtureRoundRobin(
  equipos: EquipoSorteo[],
  opciones?: OpcionesSorteo,
): ResultadoFixtureGenerado {
  if (!equipos || equipos.length < REGLAS.EQUIPOS_POR_TORNEO_MIN) {
    throw new AppError(
      400,
      'EQUIPOS_INSUFICIENTES',
      `Se necesitan al menos ${REGLAS.EQUIPOS_POR_TORNEO_MIN} equipos aprobados para sortear`,
    );
  }

  const shuffle = opciones?.barajar ?? barajarPorDefecto;
  const equiposOrdenados = shuffle(equipos);

  const esImpar = equiposOrdenados.length % 2 !== 0;
  type Slot = EquipoSorteo | null;

  // Si N es impar, añadimos null como equipo virtual de descanso (BYE)
  const lista: Slot[] = [...equiposOrdenados];
  if (esImpar) {
    lista.push(null);
  }

  const totalSlots = lista.length; // Siempre par (M)
  const totalRondas = totalSlots - 1; // Rondas
  const fechas: FechaGenerada[] = [];

  let partidosContador = 0;

  // Para equilibrar de forma equitativa (Escenario 5):
  // ningún equipo es local en más de la mitad redondeada hacia arriba de sus partidos (n-1).
  const localiasAcumuladas: Record<string, number> = {};
  for (const eq of equipos) {
    localiasAcumuladas[eq.id] = 0;
  }

  for (let ronda = 0; ronda < totalRondas; ronda++) {
    const partidosDeFecha: PartidoGenerado[] = [];
    let equipoDescansaId: string | null = null;

    for (let i = 0; i < totalSlots / 2; i++) {
      const slotA = lista[i];
      const slotB = lista[totalSlots - 1 - i];

      if (slotA === null && slotB !== null) {
        equipoDescansaId = slotB.id;
        continue;
      }
      if (slotB === null && slotA !== null) {
        equipoDescansaId = slotA.id;
        continue;
      }
      if (slotA === null || slotB === null) {
        continue;
      }

      // Asignación balanceada de local / visitante
      let localId: string;
      let visitanteId: string;

      const locA = localiasAcumuladas[slotA.id] || 0;
      const locB = localiasAcumuladas[slotB.id] || 0;

      if (locA < locB) {
        localId = slotA.id;
        visitanteId = slotB.id;
      } else if (locB < locA) {
        localId = slotB.id;
        visitanteId = slotA.id;
      } else {
        // En caso de empate en localías acumuladas, alternar según par y ronda
        const aEsLocal = i === 0 ? ronda % 2 === 1 : (i + ronda) % 2 === 0;
        if (aEsLocal) {
          localId = slotA.id;
          visitanteId = slotB.id;
        } else {
          localId = slotB.id;
          visitanteId = slotA.id;
        }
      }

      localiasAcumuladas[localId] = (localiasAcumuladas[localId] || 0) + 1;
      partidosDeFecha.push({ localId, visitanteId });
      partidosContador++;
    }

    fechas.push({
      numero: ronda + 1,
      equipoDescansaId,
      partidos: partidosDeFecha,
    });

    // Rotación del círculo: dejamos el índice 0 fijo y rotamos los demás
    const ultimo = lista.pop()!;
    lista.splice(1, 0, ultimo);
  }

  return {
    totalEquipos: equipos.length,
    totalFechas: fechas.length,
    totalPartidos: partidosContador,
    fechas,
  };
}
