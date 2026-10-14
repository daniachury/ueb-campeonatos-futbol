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

export interface ParametrosActualizarTorneoRepo {
  nombre?: string;
  descripcion?: string | null;
  fechaInicio?: string;
  cupo?: number;
}

export interface ImpactoEliminacion {
  equiposInscritos: number;
  partidos: number;
  resultados: number;
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
  actualizar(id: string, datos: ParametrosActualizarTorneoRepo): Promise<TorneoAdminResumen>;
  contarEquiposAprobados(id: string): Promise<number>;
  obtenerImpactoEliminacion(id: string): Promise<ImpactoEliminacion>;
  eliminarDefinitiva(id: string): Promise<void>;
  eliminarLogica(id: string): Promise<void>;
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

    async contarEquiposAprobados(id) {
      const fila = await db
        .prepare(
          `SELECT COUNT(*) AS total
             FROM inscripciones
            WHERE torneo_id = ? AND estado = 'APROBADO'`,
        )
        .bind(id)
        .first<{ total: number }>();
      return fila?.total ?? 0;
    },

    async actualizar(id, datos) {
      const asignaciones: string[] = [];
      const valores: (string | number | null)[] = [];

      if (datos.nombre !== undefined) {
        asignaciones.push('nombre = ?');
        valores.push(datos.nombre);
      }
      if (datos.descripcion !== undefined) {
        asignaciones.push('descripcion = ?');
        valores.push(datos.descripcion);
      }
      if (datos.fechaInicio !== undefined) {
        asignaciones.push('fecha_inicio = ?');
        valores.push(datos.fechaInicio);
      }
      if (datos.cupo !== undefined) {
        asignaciones.push('cupo = ?');
        valores.push(datos.cupo);
      }

      const ahora = new Date().toISOString();
      asignaciones.push('actualizado_en = ?');
      valores.push(ahora);
      valores.push(id);

      await db
        .prepare(`UPDATE torneos SET ${asignaciones.join(', ')} WHERE id = ?`)
        .bind(...valores)
        .run();

      const actualizado = await this.obtenerPorId(id);
      if (!actualizado) throw new Error('Torneo no encontrado tras actualizar');
      return actualizado;
    },

    async obtenerImpactoEliminacion(id) {
      const [resInscripciones, resPartidos, resResultados] = await Promise.all([
        db
          .prepare(`SELECT COUNT(*) AS total FROM inscripciones WHERE torneo_id = ?`)
          .bind(id)
          .first<{ total: number }>(),
        db
          .prepare(`SELECT COUNT(*) AS total FROM partidos WHERE torneo_id = ?`)
          .bind(id)
          .first<{ total: number }>(),
        db
          .prepare(
            `SELECT COUNT(*) AS total FROM partidos WHERE torneo_id = ? AND (estado = 'JUGADO' OR goles_local IS NOT NULL)`,
          )
          .bind(id)
          .first<{ total: number }>(),
      ]);

      return {
        equiposInscritos: resInscripciones?.total ?? 0,
        partidos: resPartidos?.total ?? 0,
        resultados: resResultados?.total ?? 0,
      };
    },

    async eliminarDefinitiva(id) {
      await db.batch([
        db.prepare(`DELETE FROM partidos WHERE torneo_id = ?`).bind(id),
        db.prepare(`DELETE FROM fechas WHERE torneo_id = ?`).bind(id),
        db.prepare(`DELETE FROM inscripciones WHERE torneo_id = ?`).bind(id),
        db.prepare(`DELETE FROM torneos WHERE id = ?`).bind(id),
      ]);
    },

    async eliminarLogica(id) {
      const ahora = new Date().toISOString();
      await db.batch([
        db
          .prepare(`UPDATE torneos SET estado = 'CANCELADO', actualizado_en = ? WHERE id = ?`)
          .bind(ahora, id),
        db
          .prepare(
            `UPDATE partidos SET estado = 'CANCELADO', cancha = NULL WHERE torneo_id = ? AND estado <> 'JUGADO'`,
          )
          .bind(id),
      ]);
    },
  };
}
