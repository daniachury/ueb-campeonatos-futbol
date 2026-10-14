import { describe, expect, it } from 'vitest';
import type { TorneoAdminResumen } from '@shared/torneos';
import { AppError } from '../../core/errors';
import type { TorneosRepository } from './torneos.repository';
import { crearTorneosService } from './torneos.service';

function crearMockRepositorio(iniciales: TorneoAdminResumen[] = [], totalAprobados = 0) {
  const torneos: TorneoAdminResumen[] = [...iniciales];

  const repositorio: TorneosRepository = {
    async listarPorEstados() {
      return [];
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
      if (encontrado) encontrado.estado = nuevoEstado;
    },
    async contarEquiposAprobados(_id) {
      return totalAprobados;
    },
    async actualizar(id, datos) {
      const encontrado = torneos.find((t) => t.id === id);
      if (!encontrado) throw new Error('No encontrado');
      if (datos.nombre !== undefined) encontrado.nombre = datos.nombre;
      if (datos.descripcion !== undefined) encontrado.descripcion = datos.descripcion;
      if (datos.fechaInicio !== undefined) encontrado.fechaInicio = datos.fechaInicio;
      if (datos.cupo !== undefined) encontrado.cupo = datos.cupo;
      encontrado.actualizadoEn = new Date().toISOString();
      return { ...encontrado };
    },
    async obtenerImpactoEliminacion() {
      return { equiposInscritos: 0, partidos: 0, resultados: 0 };
    },
    async eliminarDefinitiva() {},
    async eliminarLogica() {},
  };

  return { repositorio, torneos };
}

describe('KAN-21 · Casos de uso de edición de torneos', () => {
  const torneoBorrador: TorneoAdminResumen = {
    id: 't-borrador',
    nombre: 'Torneo Bosque Borrador',
    modalidad: 'FUTBOL_11',
    formato: 'LIGA',
    fechaInicio: '2026-12-01',
    cupo: 8,
    estado: 'BORRADOR',
    creadoEn: '2026-10-01T00:00:00Z',
  };

  const torneoAbierto: TorneoAdminResumen = {
    id: 't-abierto',
    nombre: 'Torneo Bosque Abierto',
    modalidad: 'FUTBOL_11',
    formato: 'LIGA',
    fechaInicio: '2026-12-10',
    cupo: 8,
    estado: 'INSCRIPCIONES_ABIERTAS',
    creadoEn: '2026-10-01T00:00:00Z',
  };

  const torneoEnCurso: TorneoAdminResumen = {
    id: 't-en-curso',
    nombre: 'Torneo Bosque En Curso',
    modalidad: 'FUTBOL_11',
    formato: 'LIGA',
    fechaInicio: '2026-10-05',
    cupo: 8,
    estado: 'EN_CURSO',
    creadoEn: '2026-09-01T00:00:00Z',
  };

  const torneoFinalizado: TorneoAdminResumen = {
    id: 't-finalizado',
    nombre: 'Torneo Bosque Finalizado',
    modalidad: 'FUTBOL_11',
    formato: 'LIGA',
    fechaInicio: '2026-08-01',
    cupo: 8,
    estado: 'FINALIZADO',
    creadoEn: '2026-07-01T00:00:00Z',
  };

  it('Escenario 1: permite editar cupo y fecha en inscripciones abiertas', async () => {
    const { repositorio } = crearMockRepositorio([torneoAbierto], 5);
    const servicio = crearTorneosService(repositorio);

    const resultado = await servicio.editarTorneo('t-abierto', {
      cupo: 10,
      fechaInicio: '2026-12-20',
    });

    expect(resultado.cupo).toBe(10);
    expect(resultado.fechaInicio).toBe('2026-12-20');
  });

  it('Escenario 2: rechaza con 400 si el cupo es menor a los equipos ya aprobados', async () => {
    const { repositorio } = crearMockRepositorio([torneoAbierto], 5);
    const servicio = crearTorneosService(repositorio);

    await expect(
      servicio.editarTorneo('t-abierto', { cupo: 4 }),
    ).rejects.toThrow(AppError);
  });

  it('Escenario 3: en torneo en curso, permite cambiar nombre/descripción pero rechaza fecha o cupo con 409', async () => {
    const { repositorio } = crearMockRepositorio([torneoEnCurso]);
    const servicio = crearTorneosService(repositorio);

    // Permitido: nombre
    const actualizado = await servicio.editarTorneo('t-en-curso', {
      nombre: 'Nuevo Nombre En Curso',
    });
    expect(actualizado.nombre).toBe('Nuevo Nombre En Curso');

    // Rechazado: fecha
    await expect(
      servicio.editarTorneo('t-en-curso', { fechaInicio: '2026-12-30' }),
    ).rejects.toThrow(AppError);

    // Rechazado: cupo
    await expect(
      servicio.editarTorneo('t-en-curso', { cupo: 12 }),
    ).rejects.toThrow(AppError);
  });

  it('Escenario 4: rechaza con 409 editar un torneo finalizado o cancelado', async () => {
    const { repositorio } = crearMockRepositorio([torneoFinalizado]);
    const servicio = crearTorneosService(repositorio);

    await expect(
      servicio.editarTorneo('t-finalizado', { nombre: 'Intento Editar' }),
    ).rejects.toThrow(AppError);
  });

  it('Escenario 5: rechaza nombre duplicado de otro torneo con 409', async () => {
    const { repositorio } = crearMockRepositorio([torneoBorrador, torneoAbierto]);
    const servicio = crearTorneosService(repositorio);

    await expect(
      servicio.editarTorneo('t-borrador', { nombre: 'Torneo Bosque Abierto' }),
    ).rejects.toThrow(AppError);
  });
});
