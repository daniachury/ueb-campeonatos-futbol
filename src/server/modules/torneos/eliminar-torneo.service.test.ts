import { describe, expect, it } from 'vitest';
import type { TorneoAdminResumen } from '@shared/torneos';
import { AppError } from '../../core/errors';
import type { TorneosRepository } from './torneos.repository';
import { crearTorneosService } from './torneos.service';

function crearMockRepositorio(iniciales: TorneoAdminResumen[] = [], resultados = 0) {
  const torneos: TorneoAdminResumen[] = [...iniciales];
  let definitivaLlamada = false;
  let logicaLlamada = false;

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
      return 0;
    },
    async actualizar(id, datos) {
      const encontrado = torneos.find((t) => t.id === id);
      if (!encontrado) throw new Error('No encontrado');
      if (datos.nombre !== undefined) encontrado.nombre = datos.nombre;
      return { ...encontrado };
    },
    async obtenerImpactoEliminacion(_id) {
      return {
        equiposInscritos: 4,
        partidos: 6,
        resultados,
      };
    },
    async eliminarDefinitiva(id) {
      definitivaLlamada = true;
      const idx = torneos.findIndex((t) => t.id === id);
      if (idx !== -1) torneos.splice(idx, 1);
    },
    async eliminarLogica(id) {
      logicaLlamada = true;
      const encontrado = torneos.find((t) => t.id === id);
      if (encontrado) encontrado.estado = 'CANCELADO';
    },
  };

  return {
    repositorio,
    torneos,
    fueEliminacionDefinitiva: () => definitivaLlamada,
    fueEliminacionLogica: () => logicaLlamada,
  };
}

describe('KAN-22 · Casos de uso de eliminación de torneos', () => {
  const torneoSinResultados: TorneoAdminResumen = {
    id: 't-sin-res',
    nombre: 'Copa El Bosque',
    modalidad: 'FUTBOL_11',
    formato: 'LIGA',
    fechaInicio: '2026-11-20',
    cupo: 8,
    estado: 'BORRADOR',
    creadoEn: '2026-10-01T00:00:00Z',
  };

  const torneoConResultados: TorneoAdminResumen = {
    id: 't-con-res',
    nombre: 'Liga Universitaria',
    modalidad: 'FUTBOL_11',
    formato: 'LIGA',
    fechaInicio: '2026-10-01',
    cupo: 8,
    estado: 'EN_CURSO',
    creadoEn: '2026-09-01T00:00:00Z',
  };

  it('Escenario 1: rechaza la eliminación con 400 si el nombre no coincide exactamente', async () => {
    const { repositorio } = crearMockRepositorio([torneoSinResultados], 0);
    const servicio = crearTorneosService(repositorio);

    await expect(
      servicio.eliminarTorneo('t-sin-res', 'Nombre Equivocado'),
    ).rejects.toThrow(AppError);
  });

  it('Escenario 2: torneo sin resultados se elimina DEFINITIVAMENTE', async () => {
    const { repositorio, fueEliminacionDefinitiva, torneos } = crearMockRepositorio(
      [torneoSinResultados],
      0,
    );
    const servicio = crearTorneosService(repositorio);

    const res = await servicio.eliminarTorneo('t-sin-res', 'Copa El Bosque');
    expect(res.tipo).toBe('DEFINITIVA');
    expect(fueEliminacionDefinitiva()).toBe(true);
    expect(torneos.find((t) => t.id === 't-sin-res')).toBeUndefined();
  });

  it('Escenario 3: torneo con resultados se elimina LÓGICAMENTE pasando a CANCELADO', async () => {
    const { repositorio, fueEliminacionLogica, torneos } = crearMockRepositorio(
      [torneoConResultados],
      3,
    );
    const servicio = crearTorneosService(repositorio);

    const res = await servicio.eliminarTorneo('t-con-res', 'Liga Universitaria');
    expect(res.tipo).toBe('LOGICA');
    expect(fueEliminacionLogica()).toBe(true);
    const actualizado = torneos.find((t) => t.id === 't-con-res');
    expect(actualizado?.estado).toBe('CANCELADO');
  });

  it('retorna 404 si el torneo a eliminar no existe', async () => {
    const { repositorio } = crearMockRepositorio([], 0);
    const servicio = crearTorneosService(repositorio);

    await expect(
      servicio.eliminarTorneo('id-inexistente', 'Copa El Bosque'),
    ).rejects.toThrow(AppError);
  });
});
