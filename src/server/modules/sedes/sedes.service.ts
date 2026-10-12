import { AppError } from '../../core/errors';
import {
  CanchaDisponibleSelector,
  CanchaResumen,
  CrearCanchaDto,
  CrearSedeDto,
  EditarCanchaDto,
  EditarSedeDto,
  esquemaCrearCancha,
  esquemaCrearSede,
  esquemaEditarCancha,
  esquemaEditarSede,
  SedeResumen,
} from '../../../shared/sedes/contrato-sedes';
import { SedeRepository } from './sedes.repository';

export class SedeService {
  constructor(private readonly repo: SedeRepository) {}

  async crearSede(dto: CrearSedeDto): Promise<SedeResumen> {
    const datos = esquemaCrearSede.parse(dto);

    const existente = await this.repo.buscarSedePorNombre(datos.nombre);
    if (existente) {
      throw new AppError(409, 'SEDE_DUPLICADA', 'Ya existe una sede con ese nombre');
    }

    const id = crypto.randomUUID();
    return this.repo.crearSede({
      id,
      nombre: datos.nombre,
      direccion: datos.direccion,
      ciudad: datos.ciudad,
      indicaciones: datos.indicaciones,
    });
  }

  async obtenerSedes(): Promise<SedeResumen[]> {
    return this.repo.obtenerSedes();
  }

  async obtenerSedePorId(id: string): Promise<SedeResumen> {
    const sede = await this.repo.obtenerSedePorId(id);
    if (!sede) {
      throw new AppError(404, 'SEDE_NO_ENCONTRADA', 'La sede no existe');
    }
    return sede;
  }

  async actualizarSede(id: string, dto: EditarSedeDto): Promise<SedeResumen> {
    const datos = esquemaEditarSede.parse(dto);
    const sedeActual = await this.obtenerSedePorId(id);

    if (datos.nombre && datos.nombre.toLowerCase() !== sedeActual.nombre.toLowerCase()) {
      const existente = await this.repo.buscarSedePorNombre(datos.nombre);
      if (existente && existente.id !== id) {
        throw new AppError(409, 'SEDE_DUPLICADA', 'Ya existe una sede con ese nombre');
      }
    }

    return this.repo.actualizarSede(id, datos);
  }

  async eliminarSede(id: string): Promise<void> {
    await this.obtenerSedePorId(id);

    const totalPartidos = await this.repo.contarPartidosProgramadosEnSede(id);
    if (totalPartidos > 0) {
      throw new AppError(
        409,
        'SEDE_CON_PARTIDOS',
        `No se puede eliminar: tiene ${totalPartidos} partidos programados. Reprográmalos o desactiva la cancha`,
      );
    }

    await this.repo.eliminarSede(id);
  }

  async crearCancha(sedeId: string, dto: CrearCanchaDto): Promise<CanchaResumen> {
    const datos = esquemaCrearCancha.parse(dto);
    await this.obtenerSedePorId(sedeId);

    const existente = await this.repo.buscarCanchaPorSedeYNombre(sedeId, datos.nombre);
    if (existente) {
      throw new AppError(
        409,
        'CANCHA_DUPLICADA',
        'Ya existe una cancha con ese nombre en esta sede',
      );
    }

    const id = crypto.randomUUID();
    return this.repo.crearCancha({
      id,
      sedeId,
      nombre: datos.nombre,
      superficie: datos.superficie,
      activa: datos.activa,
    });
  }

  async obtenerCanchaPorId(sedeId: string, canchaId: string): Promise<CanchaResumen> {
    const cancha = await this.repo.obtenerCanchaPorId(canchaId);
    if (!cancha || cancha.sedeId !== sedeId) {
      throw new AppError(404, 'CANCHA_NO_ENCONTRADA', 'La cancha no existe');
    }
    return cancha;
  }

  async actualizarCancha(
    sedeId: string,
    canchaId: string,
    dto: EditarCanchaDto,
  ): Promise<CanchaResumen> {
    const datos = esquemaEditarCancha.parse(dto);
    const canchaActual = await this.obtenerCanchaPorId(sedeId, canchaId);

    if (datos.nombre && datos.nombre.toLowerCase() !== canchaActual.nombre.toLowerCase()) {
      const existente = await this.repo.buscarCanchaPorSedeYNombre(sedeId, datos.nombre);
      if (existente && existente.id !== canchaId) {
        throw new AppError(
          409,
          'CANCHA_DUPLICADA',
          'Ya existe una cancha con ese nombre en esta sede',
        );
      }
    }

    return this.repo.actualizarCancha(sedeId, canchaId, datos);
  }

  async eliminarCancha(sedeId: string, canchaId: string): Promise<void> {
    await this.obtenerCanchaPorId(sedeId, canchaId);

    const totalPartidos = await this.repo.contarPartidosProgramadosEnCancha(canchaId);
    if (totalPartidos > 0) {
      throw new AppError(
        409,
        'CANCHA_CON_PARTIDOS',
        `No se puede eliminar: tiene ${totalPartidos} partidos programados. Reprográmalos o desactiva la cancha`,
      );
    }

    await this.repo.eliminarCancha(canchaId);
  }

  async obtenerCanchasDisponibles(): Promise<CanchaDisponibleSelector[]> {
    return this.repo.obtenerCanchasDisponibles();
  }
}
