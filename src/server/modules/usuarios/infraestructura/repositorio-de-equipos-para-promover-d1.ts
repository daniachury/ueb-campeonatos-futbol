import type { RepositorioDeEquiposParaPromover } from '../aplicacion/promover-jugador-a-admin';

/**
 * Adaptador D1 para las operaciones de equipos que necesita la promoción de jugadores (KAN-18).
 * Usa queries directas sobre las tablas existentes sin modificar el módulo de equipos.
 */
export class RepositorioDeEquiposParaPromoverD1 implements RepositorioDeEquiposParaPromover {
  readonly #baseDeDatos: D1Database;

  constructor(baseDeDatos: D1Database) {
    this.#baseDeDatos = baseDeDatos;
  }

  /**
   * Verifica si el jugador pertenece a algún equipo inscrito en un torneo EN_CURSO.
   * Escenario 3: si es verdad, la promoción queda bloqueada.
   */
  async jugadorPerteneceAEquipoEnTorneoEnCurso(jugadorId: string): Promise<boolean> {
    const fila = await this.#baseDeDatos
      .prepare(
        `SELECT 1 AS existe
           FROM miembros_equipo me
           JOIN inscripciones i ON i.equipo_id = me.equipo_id
           JOIN torneos t       ON t.id = i.torneo_id
          WHERE me.usuario_id = ?
            AND t.estado = 'EN_CURSO'
          LIMIT 1`,
      )
      .bind(jugadorId)
      .first();

    return fila !== null;
  }

  /**
   * Remueve al jugador de todos los equipos a los que pertenece.
   * Si era capitán, transfiere la capitanía al siguiente miembro activo
   * (traspaso de capitanía según UEB-Proyect-16).
   */
  async removerJugadorDeEquipos(jugadorId: string): Promise<void> {
    // Obtener equipos donde es capitán.
    const equiposComoCapitan = await this.#baseDeDatos
      .prepare(`SELECT e.id FROM equipos e WHERE e.capitan_id = ? AND e.activo = 1`)
      .bind(jugadorId)
      .all<{ id: string }>();

    // Traspasar capitanía al siguiente miembro activo.
    for (const equipo of equiposComoCapitan.results) {
      const siguienteCapitan = await this.#baseDeDatos
        .prepare(
          `SELECT me.usuario_id
             FROM miembros_equipo me
            WHERE me.equipo_id = ?
              AND me.usuario_id != ?
              AND me.activo = 1
            LIMIT 1`,
        )
        .bind(equipo.id, jugadorId)
        .first<{ usuario_id: string }>();

      if (siguienteCapitan !== null) {
        await this.#baseDeDatos
          .prepare('UPDATE equipos SET capitan_id = ? WHERE id = ?')
          .bind(siguienteCapitan.usuario_id, equipo.id)
          .run();
      } else {
        // Sin miembros activos: desactivar el equipo.
        await this.#baseDeDatos
          .prepare('UPDATE equipos SET activo = 0 WHERE id = ?')
          .bind(equipo.id)
          .run();
      }
    }

    // Remover al jugador de todos sus equipos.
    await this.#baseDeDatos
      .prepare('UPDATE miembros_equipo SET activo = 0 WHERE usuario_id = ?')
      .bind(jugadorId)
      .run();
  }
}
