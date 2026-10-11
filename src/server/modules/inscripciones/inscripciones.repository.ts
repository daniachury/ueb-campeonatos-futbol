import type { EstadoInscripcion, EstadoTorneo } from '@shared/constants';
import type {
  EquipoDisponibleParaInscripcion,
  SolicitudInscripcionResumen,
} from '@shared/inscripciones/contrato-inscripciones';
import type { ConflictoJugador } from './domain/validador-inscripciones';

export interface TorneoDb {
  id: string;
  nombre: string;
  cupo: number;
  estado: EstadoTorneo;
}

export interface InscripcionDb {
  id: string;
  torneo_id: string;
  equipo_id: string;
  estado: EstadoInscripcion;
  motivo: string | null;
  solicitada_por: string | null;
  aprobada_por: string | null;
  creada_en: string;
  actualizada_en: string;
}

export interface DetalleEquipoDb {
  id: string;
  nombre: string;
  color: string | null;
  capitanId: string | null;
  capitanNombre: string;
  cantidadJugadores: number;
}

export interface InscripcionesRepository {
  buscarTorneoPorId(torneoId: string): Promise<TorneoDb | null>;
  contarEquiposAprobados(torneoId: string): Promise<number>;
  buscarInscripcionPorId(id: string): Promise<InscripcionDb | null>;
  listarInscripcionesPorTorneo(torneoId: string): Promise<SolicitudInscripcionResumen[]>;
  buscarDetalleEquipo(equipoId: string): Promise<DetalleEquipoDb | null>;
  buscarConflictosJugadores(torneoId: string, equipoId: string): Promise<ConflictoJugador[]>;
  actualizarEstadoInscripcion(params: {
    id: string;
    estado: EstadoInscripcion;
    motivo?: string | null;
    aprobadaPor?: string | null;
  }): Promise<void>;
  crearInscripcion(params: {
    id: string;
    torneoId: string;
    equipoId: string;
    estado: EstadoInscripcion;
    aprobadaPor?: string | null;
    solicitadaPor?: string | null;
    motivo?: string | null;
  }): Promise<void>;
  listarEquiposDisponibles(params: {
    torneoId: string;
    busqueda?: string;
  }): Promise<EquipoDisponibleParaInscripcion[]>;
}

export function crearInscripcionesRepository(db: D1Database): InscripcionesRepository {
  return {
    async buscarTorneoPorId(torneoId: string): Promise<TorneoDb | null> {
      const res = await db
        .prepare('SELECT id, nombre, cupo, estado FROM torneos WHERE id = ?')
        .bind(torneoId)
        .first<TorneoDb>();
      return res ?? null;
    },

    async contarEquiposAprobados(torneoId: string): Promise<number> {
      const res = await db
        .prepare(
          "SELECT COUNT(*) as total FROM inscripciones WHERE torneo_id = ? AND estado = 'APROBADO'",
        )
        .bind(torneoId)
        .first<{ total: number }>();
      return res?.total ?? 0;
    },

    async buscarInscripcionPorId(id: string): Promise<InscripcionDb | null> {
      const res = await db
        .prepare(
          'SELECT id, torneo_id, equipo_id, estado, motivo, solicitada_por, aprobada_por, creada_en, actualizada_en FROM inscripciones WHERE id = ?',
        )
        .bind(id)
        .first<InscripcionDb>();
      return res ?? null;
    },

    async listarInscripcionesPorTorneo(torneoId: string): Promise<SolicitudInscripcionResumen[]> {
      const query = `
        SELECT
          i.id,
          i.torneo_id as torneoId,
          i.equipo_id as equipoId,
          e.nombre as equipoNombre,
          e.color as equipoColor,
          COALESCE(u.nombre_completo, 'Sin capitán') as capitanNombre,
          (SELECT COUNT(*) FROM equipo_jugadores ej WHERE ej.equipo_id = i.equipo_id) as cantidadJugadores,
          i.estado,
          i.motivo,
          i.aprobada_por as aprobadoPor,
          i.creada_en as fechaSolicitud,
          i.actualizada_en as fechaResolucion
        FROM inscripciones i
        JOIN equipos e ON e.id = i.equipo_id
        LEFT JOIN usuarios u ON u.id = e.capitan_id
        WHERE i.torneo_id = ?
        ORDER BY i.creada_en ASC
      `;
      const res = await db.prepare(query).bind(torneoId).all<SolicitudInscripcionResumen>();
      return res.results ?? [];
    },

    async buscarDetalleEquipo(equipoId: string): Promise<DetalleEquipoDb | null> {
      const query = `
        SELECT
          e.id,
          e.nombre,
          e.color,
          e.capitan_id as capitanId,
          COALESCE(u.nombre_completo, 'Sin capitán') as capitanNombre,
          (SELECT COUNT(*) FROM equipo_jugadores ej WHERE ej.equipo_id = e.id) as cantidadJugadores
        FROM equipos e
        LEFT JOIN usuarios u ON u.id = e.capitan_id
        WHERE e.id = ?
      `;
      const res = await db.prepare(query).bind(equipoId).first<DetalleEquipoDb>();
      return res ?? null;
    },

    async buscarConflictosJugadores(
      torneoId: string,
      equipoId: string,
    ): Promise<ConflictoJugador[]> {
      const query = `
        SELECT DISTINCT
          u.id as jugadorId,
          u.nombre_completo as nombreJugador,
          otro_e.id as otroEquipoId,
          otro_e.nombre as otroEquipoNombre
        FROM equipo_jugadores ej_este
        JOIN usuarios u ON u.id = ej_este.usuario_id
        JOIN equipo_jugadores ej_otro ON ej_otro.usuario_id = ej_este.usuario_id AND ej_otro.equipo_id != ej_este.equipo_id
        JOIN equipos otro_e ON otro_e.id = ej_otro.equipo_id
        JOIN inscripciones i_otra ON i_otra.equipo_id = otro_e.id
        WHERE ej_este.equipo_id = ?
          AND i_otra.torneo_id = ?
          AND i_otra.estado IN ('PENDIENTE', 'APROBADO')
      `;
      const res = await db.prepare(query).bind(equipoId, torneoId).all<ConflictoJugador>();
      return res.results ?? [];
    },

    async actualizarEstadoInscripcion({
      id,
      estado,
      motivo = null,
      aprobadaPor = null,
    }: {
      id: string;
      estado: EstadoInscripcion;
      motivo?: string | null;
      aprobadaPor?: string | null;
    }): Promise<void> {
      const ahora = new Date().toISOString();
      await db
        .prepare(
          `UPDATE inscripciones
           SET estado = ?, motivo = ?, aprobada_por = ?, actualizada_en = ?
           WHERE id = ?`,
        )
        .bind(estado, motivo, aprobadaPor, ahora, id)
        .run();
    },

    async crearInscripcion({
      id,
      torneoId,
      equipoId,
      estado,
      aprobadaPor = null,
      solicitadaPor = null,
      motivo = null,
    }: {
      id: string;
      torneoId: string;
      equipoId: string;
      estado: EstadoInscripcion;
      aprobadaPor?: string | null;
      solicitadaPor?: string | null;
      motivo?: string | null;
    }): Promise<void> {
      const ahora = new Date().toISOString();
      await db
        .prepare(
          `INSERT INTO inscripciones (id, torneo_id, equipo_id, estado, motivo, solicitada_por, aprobada_por, creada_en, actualizada_en)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(id, torneoId, equipoId, estado, motivo, solicitadaPor, aprobadaPor, ahora, ahora)
        .run();
    },

    async listarEquiposDisponibles({
      torneoId,
      busqueda = '',
    }: {
      torneoId: string;
      busqueda?: string;
    }): Promise<EquipoDisponibleParaInscripcion[]> {
      const filtro = `%${busqueda.trim()}%`;
      const query = `
        SELECT
          e.id,
          e.nombre,
          e.color,
          COALESCE(u.nombre_completo, 'Sin capitán') as capitanNombre,
          (SELECT COUNT(*) FROM equipo_jugadores ej WHERE ej.equipo_id = e.id) as cantidadJugadores
        FROM equipos e
        LEFT JOIN usuarios u ON u.id = e.capitan_id
        WHERE e.activo = 1
          AND e.id NOT IN (
            SELECT equipo_id FROM inscripciones WHERE torneo_id = ? AND estado IN ('PENDIENTE', 'APROBADO')
          )
          AND (? = '%%' OR e.nombre LIKE ?)
        ORDER BY e.nombre ASC
        LIMIT 20
      `;
      const res = await db
        .prepare(query)
        .bind(torneoId, filtro, filtro)
        .all<EquipoDisponibleParaInscripcion>();
      return res.results ?? [];
    },
  };
}
