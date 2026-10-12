import type { EstadoTorneo } from '@shared/constants';
import type { TorneoResumen } from '@shared/torneos';


export interface TorneosRepository {
  listarPorEstados(estados: readonly EstadoTorneo[]): Promise<TorneoResumen[]>;
  listarTodos?(): Promise<TorneoResumen[]>;
  crear?(datos: { id: string; nombre: string; descripcion: string; fechaInicio: string; cupo: number }): Promise<TorneoResumen>;
  abrirInscripciones?(id: string): Promise<boolean>;
  editar?(id: string, datos: { nombre: string; descripcion: string; fechaInicio: string; cupo: number }): Promise<boolean>;
  eliminar?(id: string): Promise<boolean>;
}

export function crearTorneosRepository(db: D1Database): TorneosRepository {
  return {
    async listarTodos() {
      const { results } = await db.prepare(`SELECT id, nombre, descripcion, estado, fecha_inicio AS fechaInicio, cupo FROM torneos ORDER BY fecha_inicio ASC`).all<TorneoResumen>();
      return results;
    },
    async listarPorEstados(estados) {
      if (estados.length === 0) return [];

      const marcadores = estados.map(() => '?').join(', ');
      const { results } = await db
        .prepare(
          `SELECT id, nombre, descripcion, estado, fecha_inicio AS fechaInicio, cupo
             FROM torneos
            WHERE estado IN (${marcadores})`,
        )
        .bind(...estados)
        .all<TorneoResumen>();

      return results;
    },
    async crear(datos) {
      await db.prepare(`INSERT INTO torneos (id, nombre, descripcion, fecha_inicio, cupo) VALUES (?, ?, ?, ?, ?)`)
        .bind(datos.id, datos.nombre, datos.descripcion || null, datos.fechaInicio, datos.cupo).run();
      return { id: datos.id, nombre: datos.nombre, descripcion: datos.descripcion, estado: 'BORRADOR', fechaInicio: datos.fechaInicio, cupo: datos.cupo };
    },
    async abrirInscripciones(id) {
      const resultado = await db.prepare(`UPDATE torneos SET estado = 'INSCRIPCIONES_ABIERTAS', actualizado_en = CURRENT_TIMESTAMP WHERE id = ? AND estado = 'BORRADOR'`).bind(id).run();
      return resultado.meta.changes > 0;
    },
    async editar(id, datos) {
      const resultado = await db.prepare(`UPDATE torneos SET nombre = ?, descripcion = ?, fecha_inicio = ?, cupo = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ? AND estado IN ('BORRADOR', 'INSCRIPCIONES_ABIERTAS')`).bind(datos.nombre, datos.descripcion || null, datos.fechaInicio, datos.cupo, id).run();
      return resultado.meta.changes > 0;
    },
    async eliminar(id) {
      const resultado = await db.prepare(`DELETE FROM torneos WHERE id = ? AND estado IN ('BORRADOR', 'INSCRIPCIONES_ABIERTAS')`).bind(id).run();
      return resultado.meta.changes > 0;
    },
  };
}
