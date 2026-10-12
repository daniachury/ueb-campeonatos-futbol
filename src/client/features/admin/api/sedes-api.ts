import { pedir } from '../../../common/api/client';
import type {
  CanchaDisponibleSelector,
  CanchaResumen,
  CrearCanchaDto,
  CrearSedeDto,
  EditarCanchaDto,
  EditarSedeDto,
  SedeResumen,
} from '../../../../shared/sedes/contrato-sedes';

export const sedesApi = {
  obtenerSedes(): Promise<SedeResumen[]> {
    return pedir<SedeResumen[]>('/admin/sedes');
  },

  obtenerSedePorId(id: string): Promise<SedeResumen> {
    return pedir<SedeResumen>(`/admin/sedes/${encodeURIComponent(id)}`);
  },

  crearSede(dto: CrearSedeDto): Promise<SedeResumen> {
    return pedir<SedeResumen>('/admin/sedes', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  actualizarSede(id: string, dto: EditarSedeDto): Promise<SedeResumen> {
    return pedir<SedeResumen>(`/admin/sedes/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  eliminarSede(id: string): Promise<{ mensaje: string }> {
    return pedir<{ mensaje: string }>(`/admin/sedes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  crearCancha(sedeId: string, dto: CrearCanchaDto): Promise<CanchaResumen> {
    return pedir<CanchaResumen>(`/admin/sedes/${encodeURIComponent(sedeId)}/canchas`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  actualizarCancha(
    sedeId: string,
    canchaId: string,
    dto: EditarCanchaDto,
  ): Promise<CanchaResumen> {
    return pedir<CanchaResumen>(
      `/admin/sedes/${encodeURIComponent(sedeId)}/canchas/${encodeURIComponent(canchaId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(dto),
      },
    );
  },

  eliminarCancha(sedeId: string, canchaId: string): Promise<{ mensaje: string }> {
    return pedir<{ mensaje: string }>(
      `/admin/sedes/${encodeURIComponent(sedeId)}/canchas/${encodeURIComponent(canchaId)}`,
      {
        method: 'DELETE',
      },
    );
  },

  obtenerCanchasDisponibles(): Promise<CanchaDisponibleSelector[]> {
    return pedir<CanchaDisponibleSelector[]>('/admin/sedes/canchas-disponibles');
  },
};
