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
};
