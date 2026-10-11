import { ROLES } from '../dominio/rol';
import { ErrorCorreoYaEsAdmin } from './errores/error-correo-ya-es-admin';
import { ErrorJugadorEnTorneoEnCurso } from './errores/error-jugador-en-torneo-en-curso';
import { ErrorJugadorNoEncontrado } from './errores/error-jugador-no-encontrado';
import type { GeneradorDeIdentificadores } from './puertos/generador-de-identificadores';
import type { Reloj } from './puertos/reloj';
import type { RepositorioDeAuditoria } from './puertos/repositorio-de-auditoria';
import type { RepositorioDeUsuarios } from './puertos/repositorio-de-usuarios';

/** Respuesta del caso de uso promover. */
export interface AdminPromovido {
  id: string;
  nombreCompleto: string;
  correo: string;
  telefono: string;
  rol: 'admin';
}

/**
 * Puerto para verificar si un jugador pertenece a un equipo con torneo EN_CURSO.
 * Se implementa con una query directa a D1 sin modificar el módulo de equipos.
 */
export interface RepositorioDeEquiposParaPromover {
  jugadorPerteneceAEquipoEnTorneoEnCurso(jugadorId: string): Promise<boolean>;
  removerJugadorDeEquipos(jugadorId: string): Promise<void>;
}

export interface DependenciasDePromoverJugadorAAdmin {
  repositorioDeUsuarios: RepositorioDeUsuarios;
  repositorioDeAuditoria: RepositorioDeAuditoria;
  repositorioDeEquipos: RepositorioDeEquiposParaPromover;
  generadorDeIdentificadores: GeneradorDeIdentificadores;
  reloj: Reloj;
}

/**
 * Caso de uso «Promover jugador a administrador» (KAN-18 · Escenario 3).
 *
 * - Bloquea si el jugador está en un equipo con torneo EN_CURSO.
 * - Cambia el rol a admin y lo saca de sus equipos.
 * - Registra la acción en auditoría.
 */
export class PromoverJugadorAAdmin {
  readonly #repositorioDeUsuarios: RepositorioDeUsuarios;
  readonly #repositorioDeAuditoria: RepositorioDeAuditoria;
  readonly #repositorioDeEquipos: RepositorioDeEquiposParaPromover;
  readonly #generadorDeIdentificadores: GeneradorDeIdentificadores;
  readonly #reloj: Reloj;

  constructor(dependencias: DependenciasDePromoverJugadorAAdmin) {
    this.#repositorioDeUsuarios = dependencias.repositorioDeUsuarios;
    this.#repositorioDeAuditoria = dependencias.repositorioDeAuditoria;
    this.#repositorioDeEquipos = dependencias.repositorioDeEquipos;
    this.#generadorDeIdentificadores = dependencias.generadorDeIdentificadores;
    this.#reloj = dependencias.reloj;
  }

  async ejecutar(jugadorId: string, adminCreadorId: string): Promise<AdminPromovido> {
    const ahora = this.#reloj.ahora();

    // 1. Buscar al jugador.
    const jugador = await this.#repositorioDeUsuarios.buscarPorId(jugadorId);
    if (jugador === null) {
      throw new ErrorJugadorNoEncontrado();
    }

    // 2. Si ya es admin, no hay nada que hacer.
    if (jugador.esAdministrador()) {
      throw new ErrorCorreoYaEsAdmin();
    }

    // 3. Bloquear si está en un equipo con torneo EN_CURSO (Escenario 3).
    const enTorneoEnCurso =
      await this.#repositorioDeEquipos.jugadorPerteneceAEquipoEnTorneoEnCurso(jugadorId);
    if (enTorneoEnCurso) {
      throw new ErrorJugadorEnTorneoEnCurso();
    }

    // 4. Promover en la base de datos.
    await this.#repositorioDeUsuarios.actualizarRol(jugadorId, ROLES.ADMINISTRADOR, ahora);

    // 5. Remover de equipos (traspaso de capitanía según UEB-Proyect-16).
    await this.#repositorioDeEquipos.removerJugadorDeEquipos(jugadorId);

    // 6. Registrar en auditoría.
    await this.#repositorioDeAuditoria.registrar({
      id: this.#generadorDeIdentificadores.generar(),
      adminCreadorId,
      usuarioId: jugadorId,
      accion: 'PROMOVER_JUGADOR',
      creadoEn: ahora,
    });

    const promovido = jugador.promoverAAdministrador(ahora);
    return {
      id: promovido.id,
      nombreCompleto: promovido.nombreCompleto.valor,
      correo: promovido.correo.valor,
      telefono: promovido.telefono.valor,
      rol: ROLES.ADMINISTRADOR,
    };
  }
}
