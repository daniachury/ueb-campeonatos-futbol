import type { D1Database } from '@cloudflare/workers-types';
import type {
  CanchaDisponibleSelector,
  CanchaResumen,
  EditarCanchaDto,
  EditarSedeDto,
  SedeResumen,
  SuperficieCancha,
} from '../../../shared/sedes/contrato-sedes';

interface SedeFila {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  indicaciones: string | null;
  creado_en: string;
  actualizado_en: string;
}

interface CanchaFila {
  id: string;
  sede_id: string;
  nombre: string;
  superficie: string | null;
  activa: number;
  partidos_programados?: number;
  creado_en: string;
  actualizado_en: string;
}

export class SedeRepository {
  constructor(private readonly db: D1Database) {}

  async crearSede(data: {
    id: string;
    nombre: string;
    direccion: string;
    ciudad: string;
    indicaciones?: string | null;
  }): Promise<SedeResumen> {
    const ahora = new Date().toISOString();
    await this.db
      .prepare(
        `INSERT INTO sedes (id, nombre, direccion, ciudad, indicaciones, creado_en, actualizado_en)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        data.id,
        data.nombre,
        data.direccion,
        data.ciudad,
        data.indicaciones ?? null,
        ahora,
        ahora,
      )
      .run();

    return {
      id: data.id,
      nombre: data.nombre,
      direccion: data.direccion,
      ciudad: data.ciudad,
      indicaciones: data.indicaciones ?? null,
      totalCanchas: 0,
      totalPartidosProgramados: 0,
      canchas: [],
      creadoEn: ahora,
      actualizadoEn: ahora,
    };
  }

  async obtenerSedes(): Promise<SedeResumen[]> {
    const sedesRes = await this.db
      .prepare(
        `SELECT id, nombre, direccion, ciudad, indicaciones, creado_en, actualizado_en
         FROM sedes
         ORDER BY nombre ASC`,
      )
      .all<SedeFila>();

    const sedesFilas = sedesRes.results || [];
    if (sedesFilas.length === 0) return [];

    const canchasRes = await this.db
      .prepare(
        `SELECT c.id, c.sede_id, c.nombre, c.superficie, c.activa, c.creado_en, c.actualizado_en,
                COUNT(p.id) as partidos_programados
         FROM canchas c
         LEFT JOIN partidos p ON p.cancha_id = c.id AND p.estado IN ('POR_PROGRAMAR', 'PROGRAMADO')
         GROUP BY c.id
         ORDER BY c.nombre ASC`,
      )
      .all<CanchaFila>();

    const canchasFilas = canchasRes.results || [];

    const canchasPorSede = new Map<string, CanchaResumen[]>();
    for (const f of canchasFilas) {
      const lista = canchasPorSede.get(f.sede_id) ?? [];
      lista.push({
        id: f.id,
        sedeId: f.sede_id,
        nombre: f.nombre,
        superficie: (f.superficie as SuperficieCancha) ?? null,
        activa: Boolean(f.activa),
        partidosProgramados: Number(f.partidos_programados ?? 0),
        creadoEn: f.creado_en,
        actualizadoEn: f.actualizado_en,
      });
      canchasPorSede.set(f.sede_id, lista);
    }

    return sedesFilas.map((s) => {
      const canchas = canchasPorSede.get(s.id) ?? [];
      const totalPartidos = canchas.reduce((acc, c) => acc + c.partidosProgramados, 0);
      return {
        id: s.id,
        nombre: s.nombre,
        direccion: s.direccion,
        ciudad: s.ciudad,
        indicaciones: s.indicaciones,
        totalCanchas: canchas.length,
        totalPartidosProgramados: totalPartidos,
        canchas,
        creadoEn: s.creado_en,
        actualizadoEn: s.actualizado_en,
      };
    });
  }

  async obtenerSedePorId(id: string): Promise<SedeResumen | null> {
    const sede = await this.db
      .prepare(
        `SELECT id, nombre, direccion, ciudad, indicaciones, creado_en, actualizado_en
         FROM sedes WHERE id = ?`,
      )
      .bind(id)
      .first<SedeFila>();

    if (!sede) return null;

    const canchasRes = await this.db
      .prepare(
        `SELECT c.id, c.sede_id, c.nombre, c.superficie, c.activa, c.creado_en, c.actualizado_en,
                COUNT(p.id) as partidos_programados
         FROM canchas c
         LEFT JOIN partidos p ON p.cancha_id = c.id AND p.estado IN ('POR_PROGRAMAR', 'PROGRAMADO')
         WHERE c.sede_id = ?
         GROUP BY c.id
         ORDER BY c.nombre ASC`,
      )
      .bind(id)
      .all<CanchaFila>();

    const canchas: CanchaResumen[] = (canchasRes.results || []).map((f) => ({
      id: f.id,
      sedeId: f.sede_id,
      nombre: f.nombre,
      superficie: (f.superficie as SuperficieCancha) ?? null,
      activa: Boolean(f.activa),
      partidosProgramados: Number(f.partidos_programados ?? 0),
      creadoEn: f.creado_en,
      actualizadoEn: f.actualizado_en,
    }));

    const totalPartidos = canchas.reduce((acc, c) => acc + c.partidosProgramados, 0);

    return {
      id: sede.id,
      nombre: sede.nombre,
      direccion: sede.direccion,
      ciudad: sede.ciudad,
      indicaciones: sede.indicaciones,
      totalCanchas: canchas.length,
      totalPartidosProgramados: totalPartidos,
      canchas,
      creadoEn: sede.creado_en,
      actualizadoEn: sede.actualizado_en,
    };
  }

  async buscarSedePorNombre(nombre: string): Promise<SedeResumen | null> {
    const sede = await this.db
      .prepare(
        `SELECT id, nombre, direccion, ciudad, indicaciones, creado_en, actualizado_en
         FROM sedes WHERE LOWER(nombre) = LOWER(?)`,
      )
      .bind(nombre.trim())
      .first<SedeFila>();

    if (!sede) return null;

    return {
      id: sede.id,
      nombre: sede.nombre,
      direccion: sede.direccion,
      ciudad: sede.ciudad,
      indicaciones: sede.indicaciones,
      totalCanchas: 0,
      totalPartidosProgramados: 0,
      canchas: [],
      creadoEn: sede.creado_en,
      actualizadoEn: sede.actualizado_en,
    };
  }

  async actualizarSede(id: string, data: EditarSedeDto): Promise<SedeResumen> {
    const ahora = new Date().toISOString();
    const actualizaciones: string[] = ['actualizado_en = ?'];
    const parametros: unknown[] = [ahora];

    if (data.nombre !== undefined) {
      actualizaciones.push('nombre = ?');
      parametros.push(data.nombre.trim());
    }
    if (data.direccion !== undefined) {
      actualizaciones.push('direccion = ?');
      parametros.push(data.direccion.trim());
    }
    if (data.ciudad !== undefined) {
      actualizaciones.push('ciudad = ?');
      parametros.push(data.ciudad.trim());
    }
    if (data.indicaciones !== undefined) {
      actualizaciones.push('indicaciones = ?');
      parametros.push(data.indicaciones ? data.indicaciones.trim() : null);
    }

    parametros.push(id);

    await this.db
      .prepare(`UPDATE sedes SET ${actualizaciones.join(', ')} WHERE id = ?`)
      .bind(...parametros)
      .run();

    const sedeActualizada = await this.obtenerSedePorId(id);
    if (!sedeActualizada) {
      throw new Error(`Sede no encontrada tras actualizar: ${id}`);
    }
    return sedeActualizada;
  }

  async eliminarSede(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM sedes WHERE id = ?').bind(id).run();
  }

  async contarPartidosProgramadosEnSede(sedeId: string): Promise<number> {
    const row = await this.db
      .prepare(
        `SELECT COUNT(*) as count
         FROM partidos p
         JOIN canchas c ON p.cancha_id = c.id
         WHERE c.sede_id = ? AND p.estado IN ('POR_PROGRAMAR', 'PROGRAMADO')`,
      )
      .bind(sedeId)
      .first<{ count: number }>();

    return row?.count ?? 0;
  }

  async crearCancha(data: {
    id: string;
    sedeId: string;
    nombre: string;
    superficie?: SuperficieCancha | null;
    activa: boolean;
  }): Promise<CanchaResumen> {
    const ahora = new Date().toISOString();
    await this.db
      .prepare(
        `INSERT INTO canchas (id, sede_id, nombre, superficie, activa, creado_en, actualizado_en)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        data.id,
        data.sedeId,
        data.nombre,
        data.superficie ?? null,
        data.activa ? 1 : 0,
        ahora,
        ahora,
      )
      .run();

    return {
      id: data.id,
      sedeId: data.sedeId,
      nombre: data.nombre,
      superficie: data.superficie ?? null,
      activa: data.activa,
      partidosProgramados: 0,
      creadoEn: ahora,
      actualizadoEn: ahora,
    };
  }

  async obtenerCanchaPorId(id: string): Promise<CanchaResumen | null> {
    const f = await this.db
      .prepare(
        `SELECT c.id, c.sede_id, c.nombre, c.superficie, c.activa, c.creado_en, c.actualizado_en,
                COUNT(p.id) as partidos_programados
         FROM canchas c
         LEFT JOIN partidos p ON p.cancha_id = c.id AND p.estado IN ('POR_PROGRAMAR', 'PROGRAMADO')
         WHERE c.id = ?
         GROUP BY c.id`,
      )
      .bind(id)
      .first<CanchaFila>();

    if (!f) return null;

    return {
      id: f.id,
      sedeId: f.sede_id,
      nombre: f.nombre,
      superficie: (f.superficie as SuperficieCancha) ?? null,
      activa: Boolean(f.activa),
      partidosProgramados: Number(f.partidos_programados ?? 0),
      creadoEn: f.creado_en,
      actualizadoEn: f.actualizado_en,
    };
  }

  async buscarCanchaPorSedeYNombre(
    sedeId: string,
    nombre: string,
  ): Promise<CanchaResumen | null> {
    const f = await this.db
      .prepare(
        `SELECT id, sede_id, nombre, superficie, activa, creado_en, actualizado_en
         FROM canchas
         WHERE sede_id = ? AND LOWER(nombre) = LOWER(?)`,
      )
      .bind(sedeId, nombre.trim())
      .first<CanchaFila>();

    if (!f) return null;

    return {
      id: f.id,
      sedeId: f.sede_id,
      nombre: f.nombre,
      superficie: (f.superficie as SuperficieCancha) ?? null,
      activa: Boolean(f.activa),
      partidosProgramados: 0,
      creadoEn: f.creado_en,
      actualizadoEn: f.actualizado_en,
    };
  }

  async actualizarCancha(
    _sedeId: string,
    canchaId: string,
    data: EditarCanchaDto,
  ): Promise<CanchaResumen> {
    const ahora = new Date().toISOString();
    const actualizaciones: string[] = ['actualizado_en = ?'];
    const parametros: unknown[] = [ahora];

    if (data.nombre !== undefined) {
      actualizaciones.push('nombre = ?');
      parametros.push(data.nombre.trim());
    }
    if (data.superficie !== undefined) {
      actualizaciones.push('superficie = ?');
      parametros.push(data.superficie ?? null);
    }
    if (data.activa !== undefined) {
      actualizaciones.push('activa = ?');
      parametros.push(data.activa ? 1 : 0);
    }

    parametros.push(canchaId);

    await this.db
      .prepare(`UPDATE canchas SET ${actualizaciones.join(', ')} WHERE id = ?`)
      .bind(...parametros)
      .run();

    const cancha = await this.obtenerCanchaPorId(canchaId);
    if (!cancha) {
      throw new Error(`Cancha no encontrada tras actualizar: ${canchaId}`);
    }
    return cancha;
  }

  async eliminarCancha(canchaId: string): Promise<void> {
    await this.db.prepare('DELETE FROM canchas WHERE id = ?').bind(canchaId).run();
  }

  async contarPartidosProgramadosEnCancha(canchaId: string): Promise<number> {
    const row = await this.db
      .prepare(
        `SELECT COUNT(*) as count
         FROM partidos
         WHERE cancha_id = ? AND estado IN ('POR_PROGRAMAR', 'PROGRAMADO')`,
      )
      .bind(canchaId)
      .first<{ count: number }>();

    return row?.count ?? 0;
  }

  async obtenerCanchasDisponibles(): Promise<CanchaDisponibleSelector[]> {
    const res = await this.db
      .prepare(
        `SELECT c.id, c.nombre, c.sede_id, s.nombre as sede_nombre, c.superficie
         FROM canchas c
         JOIN sedes s ON c.sede_id = s.id
         WHERE c.activa = 1
         ORDER BY s.nombre ASC, c.nombre ASC`,
      )
      .all<{
        id: string;
        nombre: string;
        sede_id: string;
        sede_nombre: string;
        superficie: string | null;
      }>();

    return (res.results || []).map((r) => ({
      id: r.id,
      nombre: r.nombre,
      sedeId: r.sede_id,
      sedeNombre: r.sede_nombre,
      superficie: (r.superficie as SuperficieCancha) ?? null,
    }));
  }
}
