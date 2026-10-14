import { AppError, errores } from '../../core/errors';
import {
  esquemaProgramarPartido,
  type PartidoDetalleProgramacion,
  type ProgramarPartidoDto,
} from '../../../shared/partidos/contrato-partidos';
import { obtenerFechaCalendarioBogota, verificarCrucesHorarios } from './domain/validador-cruces';
import type { PartidoRepository } from './partidos.repository';

export class PartidoService {
  constructor(private readonly repo: PartidoRepository) {}

  async obtenerPartidoPorId(partidoId: string): Promise<PartidoDetalleProgramacion> {
    const partido = await this.repo.obtenerPartidoPorId(partidoId);
    if (!partido) {
      throw errores.noEncontrado('Partido');
    }
    return partido;
  }

  async programarPartido(
    partidoId: string,
    dto: ProgramarPartidoDto,
  ): Promise<PartidoDetalleProgramacion> {
    // 1. Validar esquema Zod
    const validacion = esquemaProgramarPartido.safeParse(dto);
    if (!validacion.success) {
      throw errores.validacion(validacion.error.flatten().fieldErrors);
    }
    const { canchaId, fechaHora } = validacion.data;

    // 2. Obtener el partido y verificar estado
    const partido = await this.obtenerPartidoPorId(partidoId);
    if (partido.estado === 'JUGADO') {
      throw new AppError(
        400,
        'PARTIDO_YA_JUGADO',
        'No se puede programar o modificar un partido que ya ha sido jugado',
      );
    }

    // 3. Validar fecha contra inicio del torneo (KAN-35 · Escenario 4)
    if (partido.torneoId && this.repo.obtenerTorneoFechaInicio) {
      const fechaInicioTorneo = await this.repo.obtenerTorneoFechaInicio(partido.torneoId);
      if (fechaInicioTorneo) {
        const fechaPartidoBogota = obtenerFechaCalendarioBogota(new Date(fechaHora));
        if (fechaPartidoBogota < fechaInicioTorneo) {
          const partes = fechaInicioTorneo.split('-').map(Number);
          const dia = partes[2];
          const mes = partes[1];
          const mesesAbrev = [
            'ene',
            'feb',
            'mar',
            'abr',
            'may',
            'jun',
            'jul',
            'ago',
            'sep',
            'oct',
            'nov',
            'dic',
          ];
          const mesTexto = mesesAbrev[(mes || 1) - 1];
          throw new AppError(
            400,
            'FECHA_ANTERIOR_A_TORNEO',
            `La fecha no puede ser anterior al inicio del torneo (${dia} ${mesTexto})`,
          );
        }
      }
    }

    // 4. Verificar que la cancha exista y esté activa
    const cancha = await this.repo.obtenerCanchaConSede(canchaId);
    if (!cancha || !cancha.activa) {
      throw new AppError(
        400,
        'CANCHA_NO_DISPONIBLE',
        'La cancha seleccionada no existe o no se encuentra activa',
      );
    }

    // 5. Validar cruces de horarios en el dominio puro
    const otrosPartidos = await this.repo.obtenerPartidosProgramadosActivos();
    const resultadoCruces = verificarCrucesHorarios({
      partidoId: partido.id,
      localId: partido.localId,
      visitanteId: partido.visitanteId,
      canchaId,
      fechaHora,
      otrosPartidos,
    });

    if (resultadoCruces.hayConflicto && resultadoCruces.conflicto) {
      throw errores.conflicto(
        'CRUCE_HORARIO',
        resultadoCruces.conflicto.mensaje,
        resultadoCruces.conflicto,
      );
    }

    // 6. Guardar programación
    const canchaTexto = `${cancha.sede_nombre} - ${cancha.nombre}`;
    await this.repo.programarPartido({
      id: partidoId,
      canchaId,
      canchaTexto,
      fechaHora,
    });

    // 7. Retornar partido actualizado
    return await this.obtenerPartidoPorId(partidoId);
  }

  async desprogramarPartido(partidoId: string): Promise<PartidoDetalleProgramacion> {
    const partido = await this.obtenerPartidoPorId(partidoId);
    if (partido.estado === 'JUGADO') {
      throw new AppError(
        400,
        'PARTIDO_YA_JUGADO',
        'No se puede desprogramar un partido que ya ha sido jugado',
      );
    }

    await this.repo.desprogramarPartido(partidoId);
    return await this.obtenerPartidoPorId(partidoId);
  }
}
