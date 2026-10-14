import { describe, expect, it } from 'vitest';
import type { EstadoTorneo } from '@shared/constants';
import type {
  CrearTorneoDto,
  TorneoAdminResumen,
} from '@shared/torneos';
import { AppError } from '../../core/errors';
import type { TorneosRepository } from './torneos.repository';
import { crearTorneosService } from './torneos.service';

function crearMockRepositorio(iniciales: TorneoAdminResumen[] = []) {
  const torneos: TorneoAdminResumen[] = [...iniciales];
  const estadosPedidos: (readonly EstadoTorneo[])[] = [];

  const repositorio: TorneosRepository = {
    async listarPorEstados(estados) {
      estadosPedidos.push(estados);
      return torneos
        .filter((t) => estados.includes(t.estado))
        .map((t) => ({
          id: t.id,
          nombre: t.nombre,
          estado: t.estado,
          fechaInicio: t.fechaInicio,
          cupo: t.cupo,
        }));
    },
    async listarAdmin() {
      return [...torneos];
    },
    async buscarPorNombre(nombre) {
      const limpio = nombre.trim().toLowerCase();
      return torneos.find((t) => t.nombre.toLowerCase() === limpio) ?? null;
    },
    async obtenerPorId(id) {
      return torneos.find((t) => t.id === id) ?? null;
    },
    async crear(datos) {
      const nuevo: TorneoAdminResumen = {
        id: datos.id,
        nombre: datos.nombre,
        descripcion: datos.descripcion ?? null,
        modalidad: datos.modalidad,
        formato: datos.formato,
        fechaInicio: datos.fechaInicio,
        cupo: datos.cupo,
        estado: datos.estado,
        creadoEn: new Date().toISOString(),
      };
      torneos.push(nuevo);
      return nuevo;
    },
    async actualizarEstado(id, nuevoEstado) {
      const encontrado = torneos.find((t) => t.id === id);
      if (encontrado) {
        encontrado.estado = nuevoEstado;
        encontrado.actualizadoEn = new Date().toISOString();
      }
    },
    async contarEquiposAprobados(_id) {
      return 0;
    },
    async actualizar(id, datos) {
      const encontrado = torneos.find((t) => t.id === id);
      if (!encontrado) throw new Error('No encontrado');
      if (datos.nombre !== undefined) encontrado.nombre = datos.nombre;
      if (datos.descripcion !== undefined) encontrado.descripcion = datos.descripcion;
      if (datos.fechaInicio !== undefined) encontrado.fechaInicio = datos.fechaInicio;
      if (datos.cupo !== undefined) encontrado.cupo = datos.cupo;
      encontrado.actualizadoEn = new Date().toISOString();
      return encontrado;
    },
    async obtenerImpactoEliminacion(_id) {
      return { equiposInscritos: 0, partidos: 0, resultados: 0 };
    },
    async eliminarDefinitiva(id) {
      const idx = torneos.findIndex((t) => t.id === id);
      if (idx !== -1) torneos.splice(idx, 1);
    },
    async eliminarLogica(id) {
      const encontrado = torneos.find((t) => t.id === id);
      if (encontrado) encontrado.estado = 'CANCELADO';
    },
  };



  return { repositorio, estadosPedidos, torneos };
}

const torneosIniciales: TorneoAdminResumen[] = [
  {
    id: 'b',
    nombre: 'Copa Borrador',
    estado: 'BORRADOR',
    fechaInicio: '2026-11-01',
    cupo: 8,
    modalidad: 'FUTBOL_11',
    formato: 'LIGA',
    creadoEn: '2026-10-01T10:00:00Z',
  },
  {
    id: 'f',
    nombre: 'Torneo Finalizado',
    estado: 'FINALIZADO',
    fechaInicio: '2026-03-01',
    cupo: 8,
    modalidad: 'FUTBOL_11',
    formato: 'LIGA',
    creadoEn: '2026-01-01T10:00:00Z',
  },
  {
    id: 'a',
    nombre: 'Liga Abierta',
    estado: 'INSCRIPCIONES_ABIERTAS',
    fechaInicio: '2026-11-07',
    cupo: 8,
    modalidad: 'FUTBOL_11',
    formato: 'LIGA',
    creadoEn: '2026-10-05T10:00:00Z',
  },
  {
    id: 'x',
    nombre: 'Cancelado',
    estado: 'CANCELADO',
    fechaInicio: '2026-02-01',
    cupo: 8,
    modalidad: 'FUTBOL_11',
    formato: 'LIGA',
    creadoEn: '2026-01-10T10:00:00Z',
  },
];

describe('torneosService.listarPublicos', () => {
  it('sin filtro devuelve solo los estados públicos, en el orden del listado', async () => {
    const { repositorio, estadosPedidos } = crearMockRepositorio(torneosIniciales);
    const resultado = await crearTorneosService(repositorio).listarPublicos();

    expect(resultado.map((t) => t.id)).toEqual(['a', 'f']);
    expect(estadosPedidos[0]).toEqual(['INSCRIPCIONES_ABIERTAS', 'EN_CURSO', 'FINALIZADO']);
  });

  it('con filtro pide al repositorio únicamente ese estado', async () => {
    const { repositorio, estadosPedidos } = crearMockRepositorio(torneosIniciales);
    const resultado = await crearTorneosService(repositorio).listarPublicos('FINALIZADO');

    expect(resultado.map((t) => t.id)).toEqual(['f']);
    expect(estadosPedidos[0]).toEqual(['FINALIZADO']);
  });
});

describe('torneosService.crearTorneo (KAN-20)', () => {
  it('crea un torneo en estado BORRADOR con modalidad FUTBOL_11 y formato LIGA', async () => {
    const { repositorio } = crearMockRepositorio();
    const service = crearTorneosService(repositorio);

    const dto: CrearTorneoDto = {
      nombre: 'Copa El Bosque 2026',
      descripcion: 'Torneo universitario de fin de año',
      fechaInicio: '2026-12-01',
      cupo: 8,
      modalidad: 'FUTBOL_11',
      formato: 'LIGA',
    };

    const creado = await service.crearTorneo(dto);

    expect(creado.id).toBeDefined();
    expect(creado.nombre).toBe('Copa El Bosque 2026');
    expect(creado.estado).toBe('BORRADOR');
    expect(creado.modalidad).toBe('FUTBOL_11');
    expect(creado.formato).toBe('LIGA');
    expect(creado.cupo).toBe(8);
  });

  it('lanza 409 NOMBRE_DUPLICADO si el nombre ya existe (sin distinguir mayúsculas)', async () => {
    const { repositorio } = crearMockRepositorio([
      {
        id: '1',
        nombre: 'Copa El Bosque 2026',
        estado: 'BORRADOR',
        fechaInicio: '2026-12-01',
        cupo: 8,
        modalidad: 'FUTBOL_11',
        formato: 'LIGA',
        creadoEn: '2026-10-01T10:00:00Z',
      },
    ]);
    const service = crearTorneosService(repositorio);

    const dto: CrearTorneoDto = {
      nombre: 'copa el bosque 2026',
      fechaInicio: '2026-12-10',
      cupo: 10,
      modalidad: 'FUTBOL_11',
      formato: 'LIGA',
    };

    await expect(service.crearTorneo(dto)).rejects.toThrowError(AppError);
    await expect(service.crearTorneo(dto)).rejects.toMatchObject({
      status: 409,
      codigo: 'NOMBRE_DUPLICADO',
      message: 'Ya existe un torneo con ese nombre',
    });
  });

  it('lanza 400 FECHA_INVALIDA si la fecha de inicio es anterior a hoy', async () => {
    const { repositorio } = crearMockRepositorio();
    const service = crearTorneosService(repositorio);

    const dto: CrearTorneoDto = {
      nombre: 'Torneo Ayer',
      fechaInicio: '2020-01-01',
      cupo: 8,
      modalidad: 'FUTBOL_11',
      formato: 'LIGA',
    };

    await expect(service.crearTorneo(dto)).rejects.toMatchObject({
      status: 400,
      codigo: 'FECHA_INVALIDA',
      message: 'La fecha de inicio no puede ser anterior a hoy',
    });
  });
});

describe('torneosService.abrirInscripciones (KAN-20)', () => {
  it('transiciona un torneo de BORRADOR a INSCRIPCIONES_ABIERTAS', async () => {
    const { repositorio } = crearMockRepositorio([
      {
        id: 't-borrador',
        nombre: 'Torneo Para Abrir',
        estado: 'BORRADOR',
        fechaInicio: '2026-11-15',
        cupo: 12,
        modalidad: 'FUTBOL_11',
        formato: 'LIGA',
        creadoEn: '2026-10-01T10:00:00Z',
      },
    ]);
    const service = crearTorneosService(repositorio);

    const actualizado = await service.abrirInscripciones('t-borrador');

    expect(actualizado.estado).toBe('INSCRIPCIONES_ABIERTAS');
  });

  it('lanza 404 si el torneo no existe', async () => {
    const { repositorio } = crearMockRepositorio();
    const service = crearTorneosService(repositorio);

    await expect(service.abrirInscripciones('inexistente')).rejects.toMatchObject({
      status: 404,
      codigo: 'TORNEO_NO_ENCONTRADO',
    });
  });

  it('lanza 400 si el torneo ya no está en estado BORRADOR', async () => {
    const { repositorio } = crearMockRepositorio([
      {
        id: 't-abierto',
        nombre: 'Ya Abierto',
        estado: 'INSCRIPCIONES_ABIERTAS',
        fechaInicio: '2026-11-15',
        cupo: 12,
        modalidad: 'FUTBOL_11',
        formato: 'LIGA',
        creadoEn: '2026-10-01T10:00:00Z',
      },
    ]);
    const service = crearTorneosService(repositorio);

    await expect(service.abrirInscripciones('t-abierto')).rejects.toMatchObject({
      status: 400,
      codigo: 'ESTADO_INVALIDO',
      message: 'Solo se pueden abrir inscripciones de torneos en estado borrador',
    });
  });
});

describe('torneosService.listarAdmin y obtenerPorId', () => {
  it('listarAdmin retorna todos los torneos', async () => {
    const { repositorio } = crearMockRepositorio(torneosIniciales);
    const service = crearTorneosService(repositorio);

    const todos = await service.listarAdmin();
    expect(todos.length).toBe(4);
  });

  it('obtenerPorId retorna el torneo solicitado o 404', async () => {
    const { repositorio } = crearMockRepositorio(torneosIniciales);
    const service = crearTorneosService(repositorio);

    const t = await service.obtenerPorId('b');
    expect(t.nombre).toBe('Copa Borrador');

    await expect(service.obtenerPorId('no-existe')).rejects.toMatchObject({
      status: 404,
    });
  });
});
