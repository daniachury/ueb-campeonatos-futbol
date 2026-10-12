import { pedir } from '../../../common/api/client';
import type {
  PartidoDetalleProgramacion,
  ProgramarPartidoDto,
} from '../../../../shared/partidos/contrato-partidos';

export const partidosApi = {
  obtenerPorId(partidoId: string): Promise<PartidoDetalleProgramacion> {
    return pedir<PartidoDetalleProgramacion>(`/admin/partidos/${encodeURIComponent(partidoId)}`);
  },

  programar(
    partidoId: string,
    dto: ProgramarPartidoDto,
  ): Promise<PartidoDetalleProgramacion> {
    return pedir<PartidoDetalleProgramacion>(
      `/admin/partidos/${encodeURIComponent(partidoId)}/programar`,
      {
        method: 'PATCH',
        body: JSON.stringify(dto),
      },
    );
  },

  desprogramar(partidoId: string): Promise<PartidoDetalleProgramacion> {
    return pedir<PartidoDetalleProgramacion>(
      `/admin/partidos/${encodeURIComponent(partidoId)}/desprogramar`,
      {
        method: 'PATCH',
      },
    );
  },
};
