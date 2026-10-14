import type { D1Database } from '@cloudflare/workers-types';
import type { PartidoDetalleProgramacion } from '../../../shared/partidos/contrato-partidos';
import type { EstadoPartido } from '../../../shared/sorteo/contrato-sorteo';
import type { PartidoProgramadoExistente } from './domain/validador-cruces';

export interface CanchaConSedeFila {
  id: string;
  nombre: string;
  activa: number;
  superficie: string | null;
  sede_id: string;
  sede_nombre: string;
}

export class PartidoRepository {
  constructor(private readonly db: D1Database) {}

  async obtenerPartidoPorId(id: string): Promise<PartidoDetalleProgramacion | null> {
    const fila = await this.db
      .prepare(
        `SELECT p.id, p.fecha_id, p.torneo_id, p.local_id, p.visitante_id,
                p.estado, p.fecha_hora, p.cancha, p.cancha_id,
                el.nombre as local_nombre, el.color as local_color,
                ev.nombre as visitante_nombre, ev.color as visitante_color,
                c.nombre as cancha_nombre, s.nombre as sede_nombre
         FROM partidos p
         JOIN equipos el ON p.local_id = el.id
         JOIN equipos ev ON p.visitante_id = ev.id
         LEFT JOIN canchas c ON p.cancha_id = c.id
         LEFT JOIN sedes s ON c.sede_id = s.id
         WHERE p.id = ?`,
      )
      .bind(id)
      .first<{
        id: string;
        fecha_id: string;
        torneo_id: string;
        local_id: string;
        visitante_id: string;
        estado: EstadoPartido;
        fecha_hora: string | null;
        cancha: string | null;
        cancha_id: string | null;
        local_nombre: string;
        local_color: string | null;
        visitante_nombre: string;
        visitante_color: string | null;
        cancha_nombre: string | null;
        sede_nombre: string | null;
      }>();

    if (!fila) return null;

    return {
      id: fila.id,
      fechaId: fila.fecha_id,
      torneoId: fila.torneo_id,
      localId: fila.local_id,
      visitanteId: fila.visitante_id,
      localNombre: fila.local_nombre,
      localColor: fila.local_color,
      visitanteNombre: fila.visitante_nombre,
      visitanteColor: fila.visitante_color,
      estado: fila.estado,
      fechaHora: fila.fecha_hora,
      canchaId: fila.cancha_id,
      cancha: fila.cancha,
      canchaNombre: fila.cancha_nombre,
      sedeNombre: fila.sede_nombre,
    };
  }

  async obtenerCanchaConSede(canchaId: string): Promise<CanchaConSedeFila | null> {
    const fila = await this.db
      .prepare(
        `SELECT c.id, c.nombre, c.activa, c.superficie, s.id as sede_id, s.nombre as sede_nombre
         FROM canchas c
         JOIN sedes s ON c.sede_id = s.id
         WHERE c.id = ?`,
      )
      .bind(canchaId)
      .first<CanchaConSedeFila>();

    return fila ?? null;
  }

  async obtenerPartidosProgramadosActivos(): Promise<PartidoProgramadoExistente[]> {
    const { results } = await this.db
      .prepare(
        `SELECT p.id, p.local_id, p.visitante_id, p.cancha_id, p.fecha_hora,
                el.nombre as local_nombre, ev.nombre as visitante_nombre,
                c.nombre as cancha_nombre, s.nombre as sede_nombre
         FROM partidos p
         JOIN equipos el ON p.local_id = el.id
         JOIN equipos ev ON p.visitante_id = ev.id
         LEFT JOIN canchas c ON p.cancha_id = c.id
         LEFT JOIN sedes s ON c.sede_id = s.id
         WHERE p.estado = 'PROGRAMADO' AND p.fecha_hora IS NOT NULL`,
      )
      .all<{
        id: string;
        local_id: string;
        visitante_id: string;
        cancha_id: string | null;
        fecha_hora: string;
        local_nombre: string;
        visitante_nombre: string;
        cancha_nombre: string | null;
        sede_nombre: string | null;
      }>();

    return (results || []).map((r) => ({
      id: r.id,
      localId: r.local_id,
      localNombre: r.local_nombre,
      visitanteId: r.visitante_id,
      visitanteNombre: r.visitante_nombre,
      canchaId: r.cancha_id,
      canchaNombre: r.cancha_nombre,
      sedeNombre: r.sede_nombre,
      fechaHora: r.fecha_hora,
    }));
  }

  async programarPartido(datos: {
    id: string;
    canchaId: string;
    canchaTexto: string;
    fechaHora: string;
  }): Promise<void> {
    const ahora = new Date().toISOString();
    await this.db
      .prepare(
        `UPDATE partidos
         SET cancha_id = ?, cancha = ?, fecha_hora = ?, estado = 'PROGRAMADO', actualizado_en = ?
         WHERE id = ?`,
      )
      .bind(datos.canchaId, datos.canchaTexto, datos.fechaHora, ahora, datos.id)
      .run();
  }

  async desprogramarPartido(id: string): Promise<void> {
    const ahora = new Date().toISOString();
    await this.db
      .prepare(
        `UPDATE partidos
         SET cancha_id = NULL, cancha = NULL, fecha_hora = NULL, estado = 'POR_PROGRAMAR', actualizado_en = ?
         WHERE id = ?`,
      )
      .bind(ahora, id)
      .run();
  }

  async obtenerTorneoFechaInicio(torneoId: string): Promise<string | null> {
    const fila = await this.db
      .prepare(`SELECT fecha_inicio FROM torneos WHERE id = ?`)
      .bind(torneoId)
      .first<{ fecha_inicio: string }>();
    return fila?.fecha_inicio ?? null;
  }
}
