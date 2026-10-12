import { pedir } from '../../../common/api/client';
import {
  FixtureTorneoResponse,
  ResumenEstimadoFixture,
} from '../../../../shared/sorteo/contrato-sorteo';

export interface VistaPreviaSorteoData extends ResumenEstimadoFixture {
  torneoId: string;
  solicitudesPendientes: number;
}

export interface RespuestaSorteo {
  mensaje: string;
  fixture: FixtureTorneoResponse;
}

export const sorteoApi = {
  obtenerVistaPrevia(torneoId: string): Promise<VistaPreviaSorteoData> {
    return pedir<VistaPreviaSorteoData>(
      `/admin/sorteo/torneos/${encodeURIComponent(torneoId)}/vista-previa`,
    );
  },

  ejecutarSorteo(torneoId: string): Promise<RespuestaSorteo> {
    return pedir<RespuestaSorteo>(`/admin/sorteo/torneos/${encodeURIComponent(torneoId)}`, {
      method: 'POST',
    });
  },

  repetirSorteo(torneoId: string): Promise<RespuestaSorteo> {
    return pedir<RespuestaSorteo>(`/admin/sorteo/torneos/${encodeURIComponent(torneoId)}/repetir`, {
      method: 'POST',
    });
  },

  obtenerFixture(torneoId: string): Promise<FixtureTorneoResponse> {
    return pedir<FixtureTorneoResponse>(
      `/admin/sorteo/torneos/${encodeURIComponent(torneoId)}/fixture`,
    );
  },
};
