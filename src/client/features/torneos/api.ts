import type { RespuestaLista } from '@shared/api';
import type { EstadoTorneoPublico } from '@shared/constants';
import type { TorneoResumen } from '@shared/torneos';
import { pedir } from '../../common/api/client';

/** GET /api/torneos (UEB-Proyect-10). */
export async function listarTorneos(
  estado?: EstadoTorneoPublico,
  senal?: AbortSignal,
): Promise<TorneoResumen[]> {
  const consulta = estado ? `?estado=${encodeURIComponent(estado)}` : '';
  const respuesta = await pedir<RespuestaLista<TorneoResumen> | TorneoResumen[]>(`/torneos${consulta}`, {
    signal: senal,
  });
  return Array.isArray(respuesta) ? respuesta : respuesta.datos ?? [];
}
