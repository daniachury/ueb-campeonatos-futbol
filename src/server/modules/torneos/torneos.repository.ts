import type { EstadoTorneo } from '@shared/constants';
import type { TorneoAdminResumen, TorneoResumen } from '@shared/torneos';

export interface ParametrosCrearTorneoRepo {
  id: string;
  nombre: string;
  descripcion?: string | null;
  fechaInicio: string;
  cupo: number;
  modalidad: string;
  formato: string;
  estado: EstadoTorneo;
}

/**
 * Acceso a datos de torneos en Cloudflare D1 / SQLite.
 */
export interface TorneosRepository {
  listarPorEstados(estados: readonly EstadoTorneo[]): Promise<TorneoResumen[]>;
  listarAdmin(): Promise<TorneoAdminResumen[]>;
  buscarPorNombre(nombre: string): Promise<TorneoAdminResumen | null>;
  obtenerPorId(id: string): Promise<TorneoAdminResumen | null>;
  crear(datos: ParametrosCrearTorneoRepo): Promise<TorneoAdminResumen>;
  actualizarEstado(id: string, nuevoEstado: EstadoTorneo): Promise<void>;
}

export function crearTorneosRepository(db: D1Database): TorneosRepository {
  return {
    async listarPorEstados(estados) {
      if (estados.length === 0) return [];

      const marcadores = estados.map(() => '?').join(', ');
      const { results } = await db
        .prepare(
          `SELECT id, nombre, estado, fecha_inicio AS fechaInicio, cupo
             FROM torneos
            WHERE estado IN (${marcadores})`,
        )
        .bind(...estados)
        .all<TorneoResumen>();

      return results;
    },

    async listarAdmin() {
      const { results } = await db
        .prepare(
          `SELECT id, nombre, descripcion, modalidad, formato, fecha_inicio AS fechaInicio,
                  cupo, estado, creado_en AS creadoEn, actualizado_en AS actualizadoEn
             FROM torneos
            ORDER BY creado_en DESC`,
        )
        .all<TorneoAdminResumen>();

      return results;
    },

    async buscarPorNombre(nombre) {
      const resultado = await db
        .prepare(
          `SELECT id, nombre, descripcion, modalidad, formato, fecha_inicio AS fechaInicio,
                  cupo, estado, creado_en AS creadoEn, actualizado_en AS actualizadoEn
             FROM torneos
            WHERE LOWER(nombre) = LOWER(?)`,
        )
        .bind(nombre.trim())
        .first<TorneoAdminResumen>();

      return resultado ?? null;
    },

    async obtenerPorId(id) {
      const resultado = await db
        .prepare(
          `SELECT id, nombre, descripcion, modalidad, formato, fecha_inicio AS fechaInicio,
                  cupo, estado, creado_en AS creadoEn, actualizado_en AS actualizadoEn
             FROM torneos
            WHERE id = ?`,
        )
        .bind(id)
        .first<TorneoAdminResumen>();

      return resultado ?? null;
    },

    async crear(datos) {
      const ahora = new Date().toISOString();
      await db
        .prepare(
          `INSERT INTO torneos (
            id, nombre, descripcion, modalidad, formato, fecha_inicio, cupo, estado, creado_en, actualizado_en
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          datos.id,
          datos.nombre,
          datos.descripcion ?? null,
          datos.modalidad,
          datos.formato,
          datos.fechaInicio,
          datos.cupo,
          datos.estado,
          ahora,
          ahora,
        )
        .run();

      return {
        id: datos.id,
        nombre: datos.nombre,
        descripcion: datos.descripcion ?? null,
        modalidad: datos.modalidad,
        formato: datos.formato,
        fechaInicio: datos.fechaInicio,
        cupo: datos.cupo,
        estado: datos.estado,
        creadoEn: ahora,
        actualizadoEn: ahora,
      };
    },

    async actualizarEstado(id, nuevoEstado) {
      const ahora = new Date().toISOString();
      await db
        .prepare(
          `UPDATE torneos
              SET estado = ?, actualizado_en = ?
            WHERE id = ?`,
        )
        .bind(nuevoEstado, ahora, id)
        .run();
    },
  };
}
