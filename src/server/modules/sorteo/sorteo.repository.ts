import { D1Database, D1PreparedStatement } from '@cloudflare/workers-types';
import { ResultadoFixtureGenerado, EquipoSorteo } from './domain/generador-fixture';
import { FixtureTorneoResponse, FechaFixtureResumen, PartidoFixtureResumen, EstadoPartido } from '../../../shared/sorteo/contrato-sorteo';
import { EstadoTorneo } from '../../../shared/constants';

export interface TorneoSorteoInfo {
  id: string;
  nombre: string;
  estado: EstadoTorneo;
  cupo: number;
}

export class SorteoRepository {
  constructor(private readonly db: D1Database) {}

  async obtenerTorneo(torneoId: string): Promise<TorneoSorteoInfo | null> {
    const row = await this.db
      .prepare('SELECT id, nombre, estado, cupo FROM torneos WHERE id = ?')
      .bind(torneoId)
      .first<{ id: string; nombre: string; estado: EstadoTorneo; cupo: number }>();

    return row || null;
  }

  async obtenerEquiposAprobados(torneoId: string): Promise<EquipoSorteo[]> {
    const { results } = await this.db
      .prepare(
        `SELECT e.id, e.nombre, e.color
         FROM inscripciones i
         JOIN equipos e ON i.equipo_id = e.id
         WHERE i.torneo_id = ? AND i.estado = 'APROBADO'
         ORDER BY e.nombre ASC`,
      )
      .bind(torneoId)
      .all<EquipoSorteo>();

    return results || [];
  }

  async contarSolicitudesPendientes(torneoId: string): Promise<number> {
    const row = await this.db
      .prepare(
        `SELECT COUNT(*) as count FROM inscripciones WHERE torneo_id = ? AND estado = 'PENDIENTE'`,
      )
      .bind(torneoId)
      .first<{ count: number }>();

    return row?.count || 0;
  }

  async tieneResultadosRegistrados(torneoId: string): Promise<boolean> {
    const row = await this.db
      .prepare(
        `SELECT COUNT(*) as count
         FROM partidos
         WHERE torneo_id = ? AND (goles_local IS NOT NULL OR goles_visitante IS NOT NULL OR estado = 'JUGADO')`,
      )
      .bind(torneoId)
      .first<{ count: number }>();

    return (row?.count || 0) > 0;
  }

  async guardarSorteoInicial(
    torneoId: string,
    fixture: ResultadoFixtureGenerado,
  ): Promise<void> {
    const ahora = new Date().toISOString();
    const batchOps: D1PreparedStatement[] = [];

    // 1. Rechazar solicitudes pendientes automáticamente con motivo "Inscripciones cerradas"
    batchOps.push(
      this.db
        .prepare(
          `UPDATE inscripciones
           SET estado = 'RECHAZADO',
               motivo_rechazo = 'Inscripciones cerradas',
               fecha_resolucion = ?
           WHERE torneo_id = ? AND estado = 'PENDIENTE'`,
        )
        .bind(ahora, torneoId),
    );

    // 2. Insertar fechas y partidos generados
    for (const fecha of fixture.fechas) {
      const fechaId = crypto.randomUUID();
      batchOps.push(
        this.db
          .prepare(
            `INSERT INTO fechas (id, torneo_id, numero, equipo_descansa_id, creado_en)
             VALUES (?, ?, ?, ?, ?)`,
          )
          .bind(fechaId, torneoId, fecha.numero, fecha.equipoDescansaId, ahora),
      );

      for (const partido of fecha.partidos) {
        const partidoId = crypto.randomUUID();
        batchOps.push(
          this.db
            .prepare(
              `INSERT INTO partidos (id, fecha_id, torneo_id, local_id, visitante_id, estado, creado_en, actualizado_en)
               VALUES (?, ?, ?, ?, ?, 'POR_PROGRAMAR', ?, ?)`,
            )
            .bind(partidoId, fechaId, torneoId, partido.localId, partido.visitanteId, ahora, ahora),
        );
      }
    }

    // 3. Actualizar estado del torneo a EN_CURSO
    batchOps.push(
      this.db
        .prepare(
          `UPDATE torneos
           SET estado = 'EN_CURSO', actualizado_en = ?
           WHERE id = ?`,
        )
        .bind(ahora, torneoId),
    );

    if (typeof this.db.batch === 'function') {
      await this.db.batch(batchOps);
    } else {
      for (const op of batchOps) {
        await op.run();
      }
    }
  }

  async repetirSorteo(
    torneoId: string,
    fixture: ResultadoFixtureGenerado,
  ): Promise<void> {
    const ahora = new Date().toISOString();
    const batchOps: D1PreparedStatement[] = [];

    // 1. Eliminar partidos anteriores del torneo
    batchOps.push(
      this.db.prepare('DELETE FROM partidos WHERE torneo_id = ?').bind(torneoId),
    );

    // 2. Eliminar fechas anteriores del torneo
    batchOps.push(
      this.db.prepare('DELETE FROM fechas WHERE torneo_id = ?').bind(torneoId),
    );

    // 3. Insertar las nuevas fechas y partidos
    for (const fecha of fixture.fechas) {
      const fechaId = crypto.randomUUID();
      batchOps.push(
        this.db
          .prepare(
            `INSERT INTO fechas (id, torneo_id, numero, equipo_descansa_id, creado_en)
             VALUES (?, ?, ?, ?, ?)`,
          )
          .bind(fechaId, torneoId, fecha.numero, fecha.equipoDescansaId, ahora),
      );

      for (const partido of fecha.partidos) {
        const partidoId = crypto.randomUUID();
        batchOps.push(
          this.db
            .prepare(
              `INSERT INTO partidos (id, fecha_id, torneo_id, local_id, visitante_id, estado, creado_en, actualizado_en)
               VALUES (?, ?, ?, ?, ?, 'POR_PROGRAMAR', ?, ?)`,
            )
            .bind(partidoId, fechaId, torneoId, partido.localId, partido.visitanteId, ahora, ahora),
        );
      }
    }

    // 4. Actualizar timestamp del torneo
    batchOps.push(
      this.db
        .prepare('UPDATE torneos SET actualizado_en = ? WHERE id = ?')
        .bind(ahora, torneoId),
    );

    if (typeof this.db.batch === 'function') {
      await this.db.batch(batchOps);
    } else {
      for (const op of batchOps) {
        await op.run();
      }
    }
  }

  async obtenerFixtureTorneo(torneoId: string): Promise<FixtureTorneoResponse> {
    // 1. Obtener fechas
    const { results: fechasRows } = await this.db
      .prepare(
        `SELECT f.id, f.torneo_id, f.numero, f.equipo_descansa_id,
                e.nombre as descansa_nombre, e.color as descansa_color
         FROM fechas f
         LEFT JOIN equipos e ON f.equipo_descansa_id = e.id
         WHERE f.torneo_id = ?
         ORDER BY f.numero ASC`,
      )
      .bind(torneoId)
      .all<{
        id: string;
        torneo_id: string;
        numero: number;
        equipo_descansa_id: string | null;
        descansa_nombre: string | null;
        descansa_color: string | null;
      }>();

    // 2. Obtener partidos
    const { results: partidosRows } = await this.db
      .prepare(
        `SELECT p.id, p.fecha_id, p.torneo_id, p.local_id, p.visitante_id,
                p.estado, p.goles_local, p.goles_visitante, p.fecha_hora, p.cancha,
                el.nombre as local_nombre, el.color as local_color,
                ev.nombre as visitante_nombre, ev.color as visitante_color
         FROM partidos p
         JOIN equipos el ON p.local_id = el.id
         JOIN equipos ev ON p.visitante_id = ev.id
         WHERE p.torneo_id = ?
         ORDER BY p.creado_en ASC`,
      )
      .bind(torneoId)
      .all<{
        id: string;
        fecha_id: string;
        torneo_id: string;
        local_id: string;
        visitante_id: string;
        estado: EstadoPartido;
        goles_local: number | null;
        goles_visitante: number | null;
        fecha_hora: string | null;
        cancha: string | null;
        local_nombre: string;
        local_color: string | null;
        visitante_nombre: string;
        visitante_color: string | null;
      }>();

    const tieneResultados = (partidosRows || []).some(
      (p) => p.goles_local !== null || p.goles_visitante !== null || p.estado === 'JUGADO',
    );

    const partidosPorFechaId = new Map<string, PartidoFixtureResumen[]>();
    for (const p of partidosRows || []) {
      const list = partidosPorFechaId.get(p.fecha_id) || [];
      list.push({
        id: p.id,
        fechaId: p.fecha_id,
        torneoId: p.torneo_id,
        local: {
          id: p.local_id,
          nombre: p.local_nombre,
          color: p.local_color,
        },
        visitante: {
          id: p.visitante_id,
          nombre: p.visitante_nombre,
          color: p.visitante_color,
        },
        estado: p.estado,
        golesLocal: p.goles_local,
        golesVisitante: p.goles_visitante,
        fechaHora: p.fecha_hora,
        cancha: p.cancha,
      });
      partidosPorFechaId.set(p.fecha_id, list);
    }

    const fechas: FechaFixtureResumen[] = (fechasRows || []).map((f) => ({
      id: f.id,
      torneoId: f.torneo_id,
      numero: f.numero,
      equipoDescansa: f.equipo_descansa_id
        ? {
            id: f.equipo_descansa_id,
            nombre: f.descansa_nombre || 'Equipo',
            color: f.descansa_color,
          }
        : null,
      partidos: partidosPorFechaId.get(f.id) || [],
    }));

    const equiposSet = new Set<string>();
    for (const p of partidosRows || []) {
      equiposSet.add(p.local_id);
      equiposSet.add(p.visitante_id);
    }
    for (const f of fechasRows || []) {
      if (f.equipo_descansa_id) equiposSet.add(f.equipo_descansa_id);
    }

    return {
      torneoId,
      totalEquipos: equiposSet.size,
      totalFechas: fechas.length,
      totalPartidos: (partidosRows || []).length,
      puedeRepetirSorteo: !tieneResultados && fechas.length > 0,
      fechas,
    };
  }
}
