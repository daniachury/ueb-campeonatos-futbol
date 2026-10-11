import { unAdministrador, unJugador } from '../fabricas/fabrica-de-usuarios';
import { unTorneo } from '../fabricas/fabrica-de-torneos';
import { nuevoId, sufijoEnLetras } from '../identificadores';
import type {
  EquipoDePrueba,
  InscripcionDePrueba,
  TorneoDePrueba,
  UsuarioDePrueba,
} from '../modelos';
import type { AlmacenDeDatosDePrueba } from '../puertos/almacen-de-datos';

/** Mínimo de jugadores para aprobar una inscripción (src/shared/constants.ts · REGLAS). */
const JUGADORES_POR_EQUIPO = 11;

export interface TorneoConSolicitudes {
  torneo: TorneoDePrueba;
  equipos: EquipoDePrueba[];
  inscripciones: InscripcionDePrueba[];
}

/**
 * Prepara las situaciones de partida de las pruebas («Dado que…») en lenguaje del negocio.
 * Depende solo del puerto AlmacenDeDatosDePrueba, no de cómo se guardan los datos.
 */
export class PreparadorDeEscenarios {
  readonly #almacen: AlmacenDeDatosDePrueba;

  constructor(almacen: AlmacenDeDatosDePrueba) {
    this.#almacen = almacen;
  }

  async jugadorRegistrado(usuario: UsuarioDePrueba = unJugador().construir()) {
    await this.#almacen.guardarUsuario(usuario);
    return usuario;
  }

  async administradorRegistrado(usuario: UsuarioDePrueba = unAdministrador().construir()) {
    await this.#almacen.guardarUsuario(usuario);
    return usuario;
  }

  /**
   * Torneo con inscripciones abiertas y `cantidadDeEquipos` solicitudes PENDIENTES,
   * cada equipo con la plantilla mínima para poder aprobarse.
   */
  async torneoConSolicitudesPendientes(cantidadDeEquipos: number): Promise<TorneoConSolicitudes> {
    const torneo = unTorneo().construir();
    await this.#almacen.guardarTorneo(torneo);

    const equipos: EquipoDePrueba[] = [];
    const inscripciones: InscripcionDePrueba[] = [];
    for (let numero = 1; numero <= cantidadDeEquipos; numero++) {
      const equipo = await this.#equipoConPlantillaCompleta(`Equipo ${numero} ${sufijoEnLetras()}`);
      const inscripcion: InscripcionDePrueba = {
        id: nuevoId('inscripcion-e2e'),
        torneoId: torneo.id,
        equipoId: equipo.id,
        estado: 'PENDIENTE',
      };
      await this.#almacen.guardarInscripcion(inscripcion);
      equipos.push(equipo);
      inscripciones.push(inscripcion);
    }
    return { torneo, equipos, inscripciones };
  }

  /** Torneo listo para sortear: todas sus solicitudes ya están APROBADAS. */
  async torneoListoParaSortear(cantidadDeEquipos: number): Promise<TorneoConSolicitudes> {
    const escenario = await this.torneoConSolicitudesPendientes(0);
    for (let numero = 1; numero <= cantidadDeEquipos; numero++) {
      const equipo = await this.#equipoConPlantillaCompleta(`Equipo ${numero} ${sufijoEnLetras()}`);
      const inscripcion: InscripcionDePrueba = {
        id: nuevoId('inscripcion-e2e'),
        torneoId: escenario.torneo.id,
        equipoId: equipo.id,
        estado: 'APROBADO',
      };
      await this.#almacen.guardarInscripcion(inscripcion);
      escenario.equipos.push(equipo);
      escenario.inscripciones.push(inscripcion);
    }
    return escenario;
  }

  /** Jugador que es capitán de un equipo inscrito y aprobado en un torneo EN_CURSO. */
  async jugadorEnTorneoEnCurso(): Promise<UsuarioDePrueba> {
    const jugador = await this.jugadorRegistrado();
    const torneo = unTorneo().enEstado('EN_CURSO').construir();
    await this.#almacen.guardarTorneo(torneo);
    const equipo = await this.#equipoConPlantillaCompleta(`Equipo ${sufijoEnLetras()}`, jugador);
    await this.#almacen.guardarInscripcion({
      id: nuevoId('inscripcion-e2e'),
      torneoId: torneo.id,
      equipoId: equipo.id,
      estado: 'APROBADO',
    });
    return jugador;
  }

  async #equipoConPlantillaCompleta(
    nombre: string,
    capitan?: UsuarioDePrueba,
  ): Promise<EquipoDePrueba> {
    const jugadores = capitan ? [capitan] : [];
    while (jugadores.length < JUGADORES_POR_EQUIPO) {
      jugadores.push(await this.jugadorRegistrado());
    }
    const equipo: EquipoDePrueba = {
      id: nuevoId('equipo-e2e'),
      nombre,
      capitanId: jugadores[0]?.id ?? null,
      jugadorIds: jugadores.map((jugador) => jugador.id),
    };
    await this.#almacen.guardarEquipo(equipo);
    return equipo;
  }
}
