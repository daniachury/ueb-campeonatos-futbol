import {
  ESTADOS_TORNEO_PUBLICOS,
  type EstadoTorneoPublico,
} from '@shared/constants';
import {
  obtenerFechaHoyBogota,
  type CrearTorneoDto,
  type EditarTorneoDto,
  type TorneoAdminResumen,
  type TorneoResumen,
} from '@shared/torneos';
import { AppError } from '../../core/errors';
import { ordenarParaListado } from './domain/ordenar-torneos';
import type { ImpactoEliminacion, TorneosRepository } from './torneos.repository';



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

    /**
     * UEB-Proyect-08 (KAN-21): Editar torneo.
     * Respeta la matriz de edición por estado y validaciones de creación.
     */
    async editarTorneo(id: string, datos: EditarTorneoDto): Promise<TorneoAdminResumen> {
      const torneo = await repositorio.obtenerPorId(id);
      if (!torneo) {
        throw new AppError(404, 'TORNEO_NO_ENCONTRADO', 'Torneo no encontrado');
      }

      if (torneo.estado === 'FINALIZADO' || torneo.estado === 'CANCELADO') {
        throw new AppError(
          409,
          'ESTADO_NO_EDITABLE',
          'No se puede editar un torneo finalizado o cancelado',
        );
      }

      if (torneo.estado === 'EN_CURSO') {
        if (
          (datos.fechaInicio !== undefined && datos.fechaInicio !== torneo.fechaInicio) ||
          (datos.cupo !== undefined && datos.cupo !== torneo.cupo)
        ) {
          throw new AppError(409, 'CAMBIO_NO_PERMITIDO', 'No editable después del sorteo');
        }
      }

      if (datos.nombre && datos.nombre.trim().toLowerCase() !== torneo.nombre.toLowerCase()) {
        const existente = await repositorio.buscarPorNombre(datos.nombre);
        if (existente && existente.id !== id) {
          throw new AppError(409, 'NOMBRE_DUPLICADO', 'Ya existe un torneo con ese nombre');
        }
      }

      if (torneo.estado === 'INSCRIPCIONES_ABIERTAS' && datos.cupo !== undefined) {
        const totalAprobados = await repositorio.contarEquiposAprobados(id);
        if (datos.cupo < totalAprobados) {
          throw new AppError(
            400,
            'CUPO_MENOR_A_APROBADOS',
            `El cupo no puede ser menor a los ${totalAprobados} equipos ya aprobados`,
          );
        }
      }

      if (datos.fechaInicio) {
        const hoy = obtenerFechaHoyBogota();
        if (datos.fechaInicio < hoy) {
          throw new AppError(
            400,
            'FECHA_INVALIDA',
            'La fecha de inicio no puede ser anterior a hoy',
          );
        }
      }

      return repositorio.actualizar(id, {
        nombre: datos.nombre?.trim(),
        descripcion: datos.descripcion !== undefined ? (datos.descripcion?.trim() || null) : undefined,
        fechaInicio: datos.fechaInicio,
        cupo: datos.cupo,
      });
    },

    /**
     * UEB-Proyect-09 (KAN-22) · Escenario 1.
     * Retorna el impacto de eliminación (equipos inscritos, partidos y resultados).
     */
    async obtenerImpactoEliminacion(id: string): Promise<ImpactoEliminacion> {
      const torneo = await repositorio.obtenerPorId(id);
      if (!torneo) {
        throw new AppError(404, 'TORNEO_NO_ENCONTRADO', 'Torneo no encontrado');
      }
      return repositorio.obtenerImpactoEliminacion(id);
    },

    /**
     * UEB-Proyect-09 (KAN-22) · Escenario 2 y 3.
     * Elimina el torneo (definitiva si no tiene resultados, lógica CANCELADO si tiene resultados).
     * Requiere confirmación escribiendo exactamente el nombre del torneo.
     */
    async eliminarTorneo(
      id: string,
      confirmacionNombre: string,
    ): Promise<{ tipo: 'DEFINITIVA' | 'LOGICA'; mensaje: string }> {
      const torneo = await repositorio.obtenerPorId(id);
      if (!torneo) {
        throw new AppError(404, 'TORNEO_NO_ENCONTRADO', 'Torneo no encontrado');
      }

      if (confirmacionNombre.trim() !== torneo.nombre) {
        throw new AppError(
          400,
          'CONFIRMACION_INVALIDA',
          'El nombre ingresado no coincide exactamente con el nombre del torneo',
        );
      }

      const impacto = await repositorio.obtenerImpactoEliminacion(id);
      if (impacto.resultados > 0) {
        await repositorio.eliminarLogica(id);
        return {
          tipo: 'LOGICA',
          mensaje: 'Torneo cancelado exitosamente conservando el histórico de resultados',
        };
      } else {
        await repositorio.eliminarDefinitiva(id);
        return {
          tipo: 'DEFINITIVA',
          mensaje: 'Torneo y todos sus registros asociados eliminados definitivamente',
        };
      }
    },
  };
}

export type TorneosService = ReturnType<typeof crearTorneosService>;
