import type {
  BandejaInscripcionesResponse,
  EquipoDisponibleParaInscripcion,
} from '@shared/inscripciones/contrato-inscripciones';
import { AppError, errores } from '../../core/errors';
import {
  validarCondicionesDeInscripcion,
  validarTorneoPermiteModificacion,
} from './domain/validador-inscripciones';
import type { InscripcionesRepository } from './inscripciones.repository';

export interface InscripcionesService {
  obtenerBandeja(torneoId: string): Promise<BandejaInscripcionesResponse>;
  aprobarInscripcion(inscripcionId: string, adminId: string): Promise<void>;
  rechazarInscripcion(inscripcionId: string, adminId: string, motivo: string): Promise<void>;
  retirarInscripcion(inscripcionId: string, adminId: string, motivo: string): Promise<void>;
  inscribirDirectamente(torneoId: string, equipoId: string, adminId: string): Promise<string>;
  buscarEquiposDisponibles(
    torneoId: string,
    busqueda?: string,
  ): Promise<EquipoDisponibleParaInscripcion[]>;
  solicitarInscripcion(torneoId: string, equipoId: string, usuarioId: string): Promise<string>;
  cancelarSolicitud(inscripcionId: string, usuarioId: string): Promise<void>;
}

export function crearInscripcionesService(
  repository: InscripcionesRepository,
): InscripcionesService {
  return {
    async obtenerBandeja(torneoId: string): Promise<BandejaInscripcionesResponse> {
      const torneo = await repository.buscarTorneoPorId(torneoId);
      if (!torneo) {
        throw errores.noEncontrado('Torneo');
      }

      const solicitudes = await repository.listarInscripcionesPorTorneo(torneoId);
      const equiposAprobados = await repository.contarEquiposAprobados(torneoId);

      const pendientes = solicitudes.filter((s) => s.estado === 'PENDIENTE');
      const aprobados = solicitudes.filter((s) => s.estado === 'APROBADO');
      const rechazados = solicitudes.filter((s) => s.estado === 'RECHAZADO');

      const cupoCompleto = equiposAprobados >= torneo.cupo;
      const torneoEnCurso =
        torneo.estado === 'EN_CURSO' ||
        torneo.estado === 'FINALIZADO' ||
        torneo.estado === 'CANCELADO';

      return {
        torneo: {
          id: torneo.id,
          nombre: torneo.nombre,
          cupo: torneo.cupo,
          estado: torneo.estado,
          equiposAprobados,
        },
        pendientes,
        aprobados,
        rechazados,
        contadorAprobados: `${equiposAprobados}/${torneo.cupo}`,
        cupoCompleto,
        torneoEnCurso,
      };
    },

    async aprobarInscripcion(inscripcionId: string, adminId: string): Promise<void> {
      const inscripcion = await repository.buscarInscripcionPorId(inscripcionId);
      if (!inscripcion) {
        throw errores.noEncontrado('Solicitud de inscripción');
      }

      if (inscripcion.estado !== 'PENDIENTE') {
        throw errores.conflicto(
          'ESTADO_INVALIDO',
          'Solo se pueden aprobar solicitudes en estado Pendiente',
        );
      }

      const torneo = await repository.buscarTorneoPorId(inscripcion.torneo_id);
      if (!torneo) {
        throw errores.noEncontrado('Torneo');
      }

      validarTorneoPermiteModificacion(torneo.estado);

      const equiposAprobados = await repository.contarEquiposAprobados(torneo.id);
      const equipo = await repository.buscarDetalleEquipo(inscripcion.equipo_id);
      if (!equipo) {
        throw errores.noEncontrado('Equipo');
      }

      const conflictos = await repository.buscarConflictosJugadores(
        torneo.id,
        inscripcion.equipo_id,
      );

      validarCondicionesDeInscripcion({
        torneoEstado: torneo.estado,
        equiposAprobados,
        cupo: torneo.cupo,
        cantidadJugadores: equipo.cantidadJugadores,
        conflictos,
      });

      await repository.actualizarEstadoInscripcion({
        id: inscripcion.id,
        estado: 'APROBADO',
        aprobadaPor: adminId,
      });
    },

    async rechazarInscripcion(
      inscripcionId: string,
      adminId: string,
      motivo: string,
    ): Promise<void> {
      const inscripcion = await repository.buscarInscripcionPorId(inscripcionId);
      if (!inscripcion) {
        throw errores.noEncontrado('Solicitud de inscripción');
      }

      if (inscripcion.estado !== 'PENDIENTE') {
        throw errores.conflicto(
          'ESTADO_INVALIDO',
          'Solo se pueden rechazar solicitudes en estado Pendiente',
        );
      }

      const torneo = await repository.buscarTorneoPorId(inscripcion.torneo_id);
      if (!torneo) {
        throw errores.noEncontrado('Torneo');
      }

      validarTorneoPermiteModificacion(torneo.estado);

      await repository.actualizarEstadoInscripcion({
        id: inscripcion.id,
        estado: 'RECHAZADO',
        motivo,
        aprobadaPor: adminId,
      });
    },

    async retirarInscripcion(
      inscripcionId: string,
      adminId: string,
      motivo: string,
    ): Promise<void> {
      const inscripcion = await repository.buscarInscripcionPorId(inscripcionId);
      if (!inscripcion) {
        throw errores.noEncontrado('Solicitud de inscripción');
      }

      if (inscripcion.estado !== 'APROBADO') {
        throw errores.conflicto(
          'ESTADO_INVALIDO',
          'Solo se pueden retirar solicitudes en estado Aprobado',
        );
      }

      const torneo = await repository.buscarTorneoPorId(inscripcion.torneo_id);
      if (!torneo) {
        throw errores.noEncontrado('Torneo');
      }

      validarTorneoPermiteModificacion(torneo.estado);

      if (torneo.estado !== 'INSCRIPCIONES_ABIERTAS') {
        throw errores.conflicto(
          'TORNEO_NO_PERMITE_RETIRO',
          'Solo se pueden retirar equipos mientras las inscripciones sigan abiertas',
        );
      }

      await repository.actualizarEstadoInscripcion({
        id: inscripcion.id,
        estado: 'RETIRADO',
        motivo,
        aprobadaPor: adminId,
      });
    },

    async inscribirDirectamente(
      torneoId: string,
      equipoId: string,
      adminId: string,
    ): Promise<string> {
      const torneo = await repository.buscarTorneoPorId(torneoId);
      if (!torneo) {
        throw errores.noEncontrado('Torneo');
      }

      validarTorneoPermiteModificacion(torneo.estado);

      const equipo = await repository.buscarDetalleEquipo(equipoId);
      if (!equipo) {
        throw errores.noEncontrado('Equipo');
      }

      const solicitudes = await repository.listarInscripcionesPorTorneo(torneoId);
      const yaInscrito = solicitudes.some(
        (s) => s.equipoId === equipoId && (s.estado === 'PENDIENTE' || s.estado === 'APROBADO'),
      );
      if (yaInscrito) {
        throw errores.conflicto(
          'EQUIPO_YA_INSCRITO',
          'El equipo ya cuenta con una solicitud activa en este torneo',
        );
      }

      const equiposAprobados = await repository.contarEquiposAprobados(torneoId);
      const conflictos = await repository.buscarConflictosJugadores(torneoId, equipoId);

      validarCondicionesDeInscripcion({
        torneoEstado: torneo.estado,
        equiposAprobados,
        cupo: torneo.cupo,
        cantidadJugadores: equipo.cantidadJugadores,
        conflictos,
      });

      const nuevoId = crypto.randomUUID();
      await repository.crearInscripcion({
        id: nuevoId,
        torneoId,
        equipoId,
        estado: 'APROBADO',
        aprobadaPor: adminId,
      });

      return nuevoId;
    },

    async buscarEquiposDisponibles(
      torneoId: string,
      busqueda = '',
    ): Promise<EquipoDisponibleParaInscripcion[]> {
      const torneo = await repository.buscarTorneoPorId(torneoId);
      if (!torneo) {
        throw errores.noEncontrado('Torneo');
      }
      return repository.listarEquiposDisponibles({ torneoId, busqueda });
    },

    async solicitarInscripcion(
      torneoId: string,
      equipoId: string,
      usuarioId: string,
    ): Promise<string> {
      const equipo = await repository.buscarDetalleEquipo(equipoId);
      if (!equipo) {
        throw errores.noEncontrado('Equipo');
      }

      if (equipo.capitanId !== usuarioId) {
        throw new AppError(403, 'SIN_PERMISO', 'Solo el capitán del equipo puede solicitar la inscripción');
      }

      const torneo = await repository.buscarTorneoPorId(torneoId);
      if (!torneo) {
        throw errores.noEncontrado('Torneo');
      }

      if (torneo.estado !== 'INSCRIPCIONES_ABIERTAS') {
        throw errores.conflicto(
          'INSCRIPCIONES_CERRADAS',
          'Las inscripciones de este torneo no están abiertas',
        );
      }

      const solicitudes = await repository.listarInscripcionesPorTorneo(torneoId);
      const yaInscrito = solicitudes.some(
        (s) => s.equipoId === equipoId && (s.estado === 'PENDIENTE' || s.estado === 'APROBADO'),
      );
      if (yaInscrito) {
        throw errores.conflicto(
          'EQUIPO_YA_INSCRITO',
          'Tu equipo ya tiene una solicitud en este torneo',
        );
      }

      const equiposAprobados = await repository.contarEquiposAprobados(torneoId);
      if (equiposAprobados >= torneo.cupo) {
        throw errores.conflicto(
          'CUPO_COMPLETO',
          'El torneo ya completó su cupo de equipos',
        );
      }

      if (equipo.cantidadJugadores < 11) {
        throw errores.conflicto(
          'PLANTILLA_INCOMPLETA',
          `Se necesitan al menos 11 jugadores para inscribirse (tienes ${equipo.cantidadJugadores})`,
        );
      }

      if (equipo.cantidadJugadores > 25) {
        throw errores.conflicto(
          'PLANTILLA_EXCEDIDA',
          `El equipo tiene ${equipo.cantidadJugadores} jugadores; el máximo permitido es 25`,
        );
      }

      const conflictos = await repository.buscarConflictosJugadores(torneoId, equipoId);
      if (conflictos.length > 0) {
        const nombres = conflictos
          .map((c) => `${c.nombreJugador} (${c.otroEquipoNombre})`)
          .join(', ');
        throw errores.conflicto(
          'CONFLICTO_JUGADORES',
          `Jugadores en conflicto: ${nombres}`,
        );
      }

      const nuevoId = crypto.randomUUID();
      await repository.crearInscripcion({
        id: nuevoId,
        torneoId,
        equipoId,
        estado: 'PENDIENTE',
        solicitadaPor: usuarioId,
      });

      return nuevoId;
    },

    async cancelarSolicitud(inscripcionId: string, usuarioId: string): Promise<void> {
      const inscripcion = await repository.buscarInscripcionPorId(inscripcionId);
      if (!inscripcion) {
        throw errores.noEncontrado('Solicitud de inscripción');
      }

      const equipo = await repository.buscarDetalleEquipo(inscripcion.equipo_id);
      if (!equipo || equipo.capitanId !== usuarioId) {
        throw new AppError(403, 'SIN_PERMISO', 'Solo el capitán puede cancelar la solicitud');
      }

      if (inscripcion.estado !== 'PENDIENTE') {
        throw errores.conflicto(
          'ESTADO_INVALIDO',
          'No se puede cancelar una solicitud que ya fue procesada',
        );
      }

      await repository.actualizarEstadoInscripcion({
        id: inscripcion.id,
        estado: 'CANCELADO',
      });
    },
  };
}
