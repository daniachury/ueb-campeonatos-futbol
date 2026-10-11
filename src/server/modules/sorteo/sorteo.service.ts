import { SorteoRepository } from './sorteo.repository';
import {
  generarFixtureRoundRobin,
  OpcionesSorteo,
} from './domain/generador-fixture';
import { AppError } from '../../core/errors';
import {
  estimarFixture,
  FixtureTorneoResponse,
  ResumenEstimadoFixture,
} from '../../../shared/sorteo/contrato-sorteo';
import { REGLAS } from '../../../shared/constants';

export interface VistaPreviaSorteoResponse extends ResumenEstimadoFixture {
  torneoId: string;
  solicitudesPendientes: number;
}

export class SorteoService {
  constructor(private readonly repo: SorteoRepository) {}

  async obtenerVistaPrevia(torneoId: string): Promise<VistaPreviaSorteoResponse> {
    const torneo = await this.repo.obtenerTorneo(torneoId);
    if (!torneo) {
      throw new AppError(404, 'TORNEO_NO_ENCONTRADO', 'El torneo especificado no existe');
    }

    const aprobados = await this.repo.obtenerEquiposAprobados(torneoId);
    const pendientes = await this.repo.contarSolicitudesPendientes(torneoId);
    const resumen = estimarFixture(aprobados.length);

    return {
      ...resumen,
      torneoId,
      solicitudesPendientes: pendientes,
    };
  }

  async ejecutarSorteo(
    torneoId: string,
    opciones?: OpcionesSorteo,
  ): Promise<FixtureTorneoResponse> {
    const torneo = await this.repo.obtenerTorneo(torneoId);
    if (!torneo) {
      throw new AppError(404, 'TORNEO_NO_ENCONTRADO', 'El torneo especificado no existe');
    }

    if (torneo.estado === 'EN_CURSO' || torneo.estado === 'FINALIZADO' || torneo.estado === 'CANCELADO') {
      throw new AppError(
        409,
        'TORNEO_NO_MODIFICABLE',
        'El torneo ya inició o no se encuentra en inscripciones abiertas',
      );
    }

    const equipos = await this.repo.obtenerEquiposAprobados(torneoId);
    if (equipos.length < REGLAS.EQUIPOS_POR_TORNEO_MIN) {
      throw new AppError(
        400,
        'EQUIPOS_INSUFICIENTES',
        `Se necesitan al menos ${REGLAS.EQUIPOS_POR_TORNEO_MIN} equipos aprobados para sortear`,
      );
    }

    const fixtureGenerado = generarFixtureRoundRobin(equipos, opciones);

    // Guardado atómico en SQLite D1
    await this.repo.guardarSorteoInicial(torneoId, fixtureGenerado);

    return this.repo.obtenerFixtureTorneo(torneoId);
  }

  async repetirSorteo(
    torneoId: string,
    opciones?: OpcionesSorteo,
  ): Promise<FixtureTorneoResponse> {
    const torneo = await this.repo.obtenerTorneo(torneoId);
    if (!torneo) {
      throw new AppError(404, 'TORNEO_NO_ENCONTRADO', 'El torneo especificado no existe');
    }

    if (torneo.estado !== 'EN_CURSO') {
      throw new AppError(
        409,
        'TORNEO_NO_EN_CURSO',
        'Solo se puede repetir el sorteo en un torneo que esté en curso',
      );
    }

    const tieneResultados = await this.repo.tieneResultadosRegistrados(torneoId);
    if (tieneResultados) {
      throw new AppError(
        409,
        'SORTEO_CON_RESULTADOS',
        'No se puede repetir el sorteo porque ya existen partidos con resultados registrados',
      );
    }

    const equipos = await this.repo.obtenerEquiposAprobados(torneoId);
    if (equipos.length < REGLAS.EQUIPOS_POR_TORNEO_MIN) {
      throw new AppError(
        400,
        'EQUIPOS_INSUFICIENTES',
        `Se necesitan al menos ${REGLAS.EQUIPOS_POR_TORNEO_MIN} equipos aprobados para sortear`,
      );
    }

    const nuevoFixture = generarFixtureRoundRobin(equipos, opciones);

    await this.repo.repetirSorteo(torneoId, nuevoFixture);

    return this.repo.obtenerFixtureTorneo(torneoId);
  }

  async obtenerFixture(torneoId: string): Promise<FixtureTorneoResponse> {
    const torneo = await this.repo.obtenerTorneo(torneoId);
    if (!torneo) {
      throw new AppError(404, 'TORNEO_NO_ENCONTRADO', 'El torneo especificado no existe');
    }

    return this.repo.obtenerFixtureTorneo(torneoId);
  }
}
