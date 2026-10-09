import type { EstadoTorneo } from '@shared/constants';
import type { TorneoResumen } from '@shared/torneos';

const PRIORIDAD_POR_ESTADO: Partial<Record<EstadoTorneo, number>> = {
  INSCRIPCIONES_ABIERTAS: 0,
  EN_CURSO: 1,
  FINALIZADO: 2,
};
const SIN_PRIORIDAD = 99;

/**
 * Orden del listado público (UEB-Proyect-10, escenario 1):
 * inscripciones abiertas → en curso → finalizados; dentro de cada grupo, por fecha de inicio.
 *
 * Es una función pura: no toca la base de datos ni HTTP, por eso se prueba sin dobles.
 */
export function ordenarParaListado(torneos: readonly TorneoResumen[]): TorneoResumen[] {
  return [...torneos].sort(
    (a, b) =>
      (PRIORIDAD_POR_ESTADO[a.estado] ?? SIN_PRIORIDAD) -
        (PRIORIDAD_POR_ESTADO[b.estado] ?? SIN_PRIORIDAD) ||
      a.fechaInicio.localeCompare(b.fechaInicio),
  );
}
