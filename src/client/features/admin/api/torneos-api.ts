import { pedir } from '../../../common/api/client';
import type {
  CrearTorneoDto,
  RespuestaAbrirInscripciones,
  RespuestaCrearTorneo,
  TorneoAdminResumen,
} from '../../../../shared/torneos';

export const torneosAdminApi = {
  listarAdmin(): Promise<{ datos: TorneoAdminResumen[] }> {
    return pedir<{ datos: TorneoAdminResumen[] }>('/admin/torneos');
  },

  obtenerPorId(id: string): Promise<TorneoAdminResumen> {
    return pedir<TorneoAdminResumen>(`/admin/torneos/${encodeURIComponent(id)}`);
  },

  crear(dto: CrearTorneoDto): Promise<RespuestaCrearTorneo> {
    return pedir<RespuestaCrearTorneo>('/admin/torneos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
  },

  abrirInscripciones(id: string): Promise<RespuestaAbrirInscripciones> {
    return pedir<RespuestaAbrirInscripciones>(
      `/admin/torneos/${encodeURIComponent(id)}/abrir-inscripciones`,
      {
        method: 'POST',
      },
    );
  },

  editar(
    id: string,
    dto: import('../../../../shared/torneos').EditarTorneoDto,
  ): Promise<{ mensaje: string; torneo: TorneoAdminResumen }> {
    return pedir<{ mensaje: string; torneo: TorneoAdminResumen }>(
      `/admin/torneos/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      },
    );
  },

  obtenerImpactoEliminacion(
    id: string,
  ): Promise<{ equiposInscritos: number; partidos: number; resultados: number }> {
    return pedir<{ equiposInscritos: number; partidos: number; resultados: number }>(
      `/admin/torneos/${encodeURIComponent(id)}/impacto-eliminacion`,
    );
  },

  eliminar(
    id: string,
    confirmacionNombre: string,
  ): Promise<{ tipo: 'DEFINITIVA' | 'LOGICA'; mensaje: string }> {
    return pedir<{ tipo: 'DEFINITIVA' | 'LOGICA'; mensaje: string }>(
      `/admin/torneos/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmacionNombre }),
      },
    );
  },
};
