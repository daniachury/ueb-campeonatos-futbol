import { pedir } from '../../../common/api/client';
import type {
  BandejaInscripcionesResponse,
  EquipoDisponibleParaInscripcion,
} from '@shared/inscripciones/contrato-inscripciones';

export function obtenerBandejaInscripciones(
  torneoId: string,
): Promise<BandejaInscripcionesResponse> {
  return pedir<BandejaInscripcionesResponse>(`/admin/inscripciones/torneos/${torneoId}`);
}

export function aprobarInscripcion(inscripcionId: string): Promise<{ mensaje: string }> {
  return pedir<{ mensaje: string }>(`/admin/inscripciones/${inscripcionId}/aprobar`, {
    method: 'POST',
  });
}

export function rechazarInscripcion(
  inscripcionId: string,
  motivo: string,
): Promise<{ mensaje: string }> {
  return pedir<{ mensaje: string }>(`/admin/inscripciones/${inscripcionId}/rechazar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivo }),
  });
}

export function retirarInscripcion(
  inscripcionId: string,
  motivo: string,
): Promise<{ mensaje: string }> {
  return pedir<{ mensaje: string }>(`/admin/inscripciones/${inscripcionId}/retirar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivo }),
  });
}

export function inscribirDirectamente(
  torneoId: string,
  equipoId: string,
): Promise<{ id: string; mensaje: string }> {
  return pedir<{ id: string; mensaje: string }>(
    `/admin/inscripciones/torneos/${torneoId}/directa`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ equipoId }),
    },
  );
}

export async function buscarEquiposDisponibles(
  torneoId: string,
  busqueda = '',
): Promise<EquipoDisponibleParaInscripcion[]> {
  const params = busqueda ? `?q=${encodeURIComponent(busqueda)}` : '';
  const res = await pedir<{ datos: EquipoDisponibleParaInscripcion[] }>(
    `/admin/inscripciones/torneos/${torneoId}/equipos-disponibles${params}`,
  );
  return res.datos;
}
