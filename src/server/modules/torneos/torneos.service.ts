import {
  ESTADOS_TORNEO_PUBLICOS,
  type EstadoTorneoPublico,
} from '@shared/constants';
import {
  obtenerFechaHoyBogota,
  type CrearTorneoDto,
  type TorneoAdminResumen,
  type TorneoResumen,
} from '@shared/torneos';
import { AppError } from '../../core/errors';
import { ordenarParaListado } from './domain/ordenar-torneos';
import type { TorneosRepository } from './torneos.repository';

/**
 * Casos de uso de torneos (Épica E3 · KAN-20, KAN-23).
 * Maneja las reglas de negocio, ciclo de vida e invariantes del torneo.
 */
export function crearTorneosService(repositorio: TorneosRepository) {
  return {
    /**
     * UEB-Proyect-10 (KAN-23): torneos visibles para jugadores.
     * Solo devuelve estados públicos (INSCRIPCIONES_ABIERTAS, EN_CURSO, FINALIZADO).
     */
    async listarPublicos(estado?: EstadoTorneoPublico): Promise<TorneoResumen[]> {
      const estados = estado ? [estado] : ESTADOS_TORNEO_PUBLICOS;
      const torneos = await repositorio.listarPorEstados(estados);
      return ordenarParaListado(torneos);
    },

    /**
     * UEB-Proyect-07 (KAN-20): listado completo de administración (incluye borradores).
     */
    async listarAdmin(): Promise<TorneoAdminResumen[]> {
      return repositorio.listarAdmin();
    },

    /**
     * Obtiene el detalle administrativo de un torneo.
     */
    async obtenerPorId(id: string): Promise<TorneoAdminResumen> {
      const torneo = await repositorio.obtenerPorId(id);
      if (!torneo) {
        throw new AppError(404, 'TORNEO_NO_ENCONTRADO', 'Torneo no encontrado');
      }
      return torneo;
    },

    /**
     * UEB-Proyect-07 (KAN-20) · Escenario 1 y 3.
     * Crea un torneo en estado BORRADOR con modalidad y formato fijos.
     */
    async crearTorneo(datos: CrearTorneoDto): Promise<TorneoAdminResumen> {
      const hoy = obtenerFechaHoyBogota();
      if (datos.fechaInicio < hoy) {
        throw new AppError(
          400,
          'FECHA_INVALIDA',
          'La fecha de inicio no puede ser anterior a hoy',
        );
      }

      const existente = await repositorio.buscarPorNombre(datos.nombre);
      if (existente) {
        throw new AppError(
          409,
          'NOMBRE_DUPLICADO',
          'Ya existe un torneo con ese nombre',
        );
      }

      const nuevoTorneoId = crypto.randomUUID();
      return repositorio.crear({
        id: nuevoTorneoId,
        nombre: datos.nombre.trim(),
        descripcion: datos.descripcion?.trim() || null,
        fechaInicio: datos.fechaInicio,
        cupo: datos.cupo,
        modalidad: 'FUTBOL_11',
        formato: 'LIGA',
        estado: 'BORRADOR',
      });
    },

    /**
     * UEB-Proyect-07 (KAN-20) · Escenario 2.
     * Transiciona irreversiblemente de BORRADOR a INSCRIPCIONES_ABIERTAS.
     */
    async abrirInscripciones(id: string): Promise<TorneoAdminResumen> {
      const torneo = await repositorio.obtenerPorId(id);
      if (!torneo) {
        throw new AppError(404, 'TORNEO_NO_ENCONTRADO', 'Torneo no encontrado');
      }

      if (torneo.estado !== 'BORRADOR') {
        throw new AppError(
          400,
          'ESTADO_INVALIDO',
          'Solo se pueden abrir inscripciones de torneos en estado borrador',
        );
      }

      await repositorio.actualizarEstado(id, 'INSCRIPCIONES_ABIERTAS');
      return {
        ...torneo,
        estado: 'INSCRIPCIONES_ABIERTAS',
      };
    },
  };
}

export type TorneosService = ReturnType<typeof crearTorneosService>;
