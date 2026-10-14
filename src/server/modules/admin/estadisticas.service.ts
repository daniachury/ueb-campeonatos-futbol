import type { ResumenEstadisticasAdmin } from '../../../shared/admin/contrato-estadisticas';

export interface EstadisticasAdminService {
  obtenerResumen(): Promise<ResumenEstadisticasAdmin>;
}

export function crearEstadisticasAdminService(db: D1Database): EstadisticasAdminService {
  return {
    async obtenerResumen(): Promise<ResumenEstadisticasAdmin> {
      const sql = `
        SELECT 
          (SELECT COUNT(*) FROM torneos) AS torneos,
          (SELECT COUNT(*) FROM equipos WHERE activo = 1) AS equipos,
          (SELECT COUNT(*) FROM partidos) AS partidos,
          (SELECT COUNT(*) FROM usuarios WHERE rol = 'jugador' AND activo = 1) AS jugadores,
          (SELECT COUNT(*) FROM inscripciones WHERE estado = 'PENDIENTE') AS pendientes
      `;
      const fila = await db.prepare(sql).first<Record<string, number>>();
      return {
        torneos: Number(fila?.torneos ?? 0),
        equipos: Number(fila?.equipos ?? 0),
        partidos: Number(fila?.partidos ?? 0),
        jugadores: Number(fila?.jugadores ?? 0),
        pendientes: Number(fila?.pendientes ?? 0),
      };
    },
  };
}
