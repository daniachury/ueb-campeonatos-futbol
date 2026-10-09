import { ESTADOS_TORNEO_PUBLICOS, type EstadoTorneoPublico } from '@shared/constants';
import type { TorneoResumen } from '@shared/torneos';
import { ordenarParaListado } from './domain/ordenar-torneos';
import type { TorneosRepository } from './torneos.repository';

/**
 * Casos de uso de torneos. Aquí viven las reglas de negocio; no sabe nada de HTTP ni de SQL.
 * Recibe el repositorio como parámetro para poder probarlo con uno en memoria.
 */
export function crearTorneosService(repositorio: TorneosRepository) {
  return {
    /**
     * UEB-Proyect-10: torneos visibles para jugadores.
     * Borrador y Cancelado nunca se devuelven, aunque se pidan explícitamente.
     */
    async listarPublicos(estado?: EstadoTorneoPublico): Promise<TorneoResumen[]> {
      const estados = estado ? [estado] : ESTADOS_TORNEO_PUBLICOS;
      const torneos = await repositorio.listarPorEstados(estados);
      return ordenarParaListado(torneos);
    },
  };
}

export type TorneosService = ReturnType<typeof crearTorneosService>;
