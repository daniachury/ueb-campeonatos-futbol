import type { ResumenEstadisticasAdmin } from '../../../../shared/admin/contrato-estadisticas';

export async function obtenerEstadisticasAdmin(): Promise<ResumenEstadisticasAdmin> {
  const respuesta = await fetch('/api/admin/estadisticas');
  if (!respuesta.ok) {
    throw new Error('No se pudieron cargar las estadísticas en tiempo real');
  }
  return respuesta.json() as Promise<ResumenEstadisticasAdmin>;
}
