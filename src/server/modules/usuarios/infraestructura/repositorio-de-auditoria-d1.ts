import type {
  RepositorioDeAuditoria,
  RegistroDeAuditoria,
} from '../aplicacion/puertos/repositorio-de-auditoria';

/**
 * Adaptador D1 para la tabla auditoria_admins (KAN-18 · Escenario 1).
 * Registra quién creó/promovió a quién y cuándo.
 */
export class RepositorioDeAuditoriaD1 implements RepositorioDeAuditoria {
  readonly #baseDeDatos: D1Database;

  constructor(baseDeDatos: D1Database) {
    this.#baseDeDatos = baseDeDatos;
  }

  async registrar(entrada: RegistroDeAuditoria): Promise<void> {
    await this.#baseDeDatos
      .prepare(
        `INSERT INTO auditoria_admins (id, admin_creador_id, usuario_id, accion, creado_en)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(
        entrada.id,
        entrada.adminCreadorId,
        entrada.usuarioId,
        entrada.accion,
        entrada.creadoEn.toISOString(),
      )
      .run();
  }
}
