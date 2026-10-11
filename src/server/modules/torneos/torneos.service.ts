import { ESTADOS_TORNEO_PUBLICOS, type EstadoTorneoPublico } from '@shared/constants';
import type { TorneoResumen } from '@shared/torneos';
import { ordenarParaListado } from './domain/ordenar-torneos';
import type { TorneosRepository } from './torneos.repository';
import { errores } from '../../core/errors';
import type { CrearTorneo } from '@shared/torneos';


export function crearTorneosService(repositorio: TorneosRepository) {
  return {

    async listarPublicos(estado?: EstadoTorneoPublico): Promise<TorneoResumen[]> {
      const estados = estado ? [estado] : ESTADOS_TORNEO_PUBLICOS;
      const torneos = await repositorio.listarPorEstados(estados);
      return ordenarParaListado(torneos);
    },
    async crear(datos: CrearTorneo): Promise<TorneoResumen> {
      if (!repositorio.crear) throw new Error('Repositorio de torneos no soporta creación');
      const hoy = new Date().toISOString().slice(0, 10);
      if (datos.fechaInicio < hoy) throw errores.validacion({ fechaInicio: 'La fecha de inicio no puede ser anterior a hoy' });
      try {
        return await repositorio.crear({ id: crypto.randomUUID(), nombre: datos.nombre, descripcion: datos.descripcion, fechaInicio: datos.fechaInicio, cupo: datos.cupo });
      } catch (error) {
        if (error instanceof Error && /unique/i.test(error.message)) throw errores.conflicto('TORNEO_NOMBRE_DUPLICADO', 'Ya existe un torneo con ese nombre');
        throw error;
      }
    },
    async abrirInscripciones(id: string): Promise<void> {
      if (!repositorio.abrirInscripciones) throw new Error('Repositorio de torneos no soporta transiciones');
      if (!(await repositorio.abrirInscripciones(id))) throw errores.conflicto('TRANSICION_INVALIDA', 'El torneo no está en estado Borrador');
    },
  };
}

export type TorneosService = ReturnType<typeof crearTorneosService>;
