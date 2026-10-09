import type { EstadoTorneo } from '@shared/constants';
import type { TorneoResumen } from '@shared/torneos';

/**
 * Acceso a datos de torneos. Es la única capa que conoce SQL y D1:
 * si algún día se cambia de base de datos, solo se reescribe este archivo.
 */
export interface TorneosRepository {
  listarPorEstados(estados: readonly EstadoTorneo[]): Promise<TorneoResumen[]>;
}

export function crearTorneosRepository(db: D1Database): TorneosRepository {
  return {
    async listarPorEstados(estados) {
      if (estados.length === 0) return [];

      const marcadores = estados.map(() => '?').join(', ');
      const { results } = await db
        .prepare(
          `SELECT id, nombre, estado, fecha_inicio AS fechaInicio, cupo
             FROM torneos
            WHERE estado IN (${marcadores})`,
        )
        .bind(...estados)
        .all<TorneoResumen>();

      return results;
    },
  };
}
