import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../core/errors';
import type { PartidoRepository } from './partidos.repository';
import { PartidoService } from './partidos.service';
import type { PartidoDetalleProgramacion } from '../../../shared/partidos/contrato-partidos';

function crearRepoMock(partidoInicial?: Partial<PartidoDetalleProgramacion>): PartidoRepository {
  let partidoActual: PartidoDetalleProgramacion | null = partidoInicial
    ? ({
        id: 'p-1',
        fechaId: 'f-1',
        torneoId: 't-1',
        localId: 'eq-1',
        visitanteId: 'eq-2',
        localNombre: 'Halcones',
        visitanteNombre: 'Cóndores',
        estado: 'POR_PROGRAMAR',
        fechaHora: null,
        canchaId: null,
        cancha: null,
        ...partidoInicial,
      } as PartidoDetalleProgramacion)
    : null;

  return {
    obtenerPartidoPorId: vi.fn(async (id: string) => {
      if (partidoActual && partidoActual.id === id) return partidoActual;
      return null;
    }),
    obtenerCanchaConSede: vi.fn(async (canchaId: string) => {
      if (canchaId === 'cancha-inactiva') {
        return {
          id: 'cancha-inactiva',
          nombre: 'Cancha Inactiva',
          activa: 0,
          superficie: null,
          sede_id: 's-1',
          sede_nombre: 'Sede Norte',
        };
      }
      if (canchaId === 'cancha-activa') {
        return {
          id: 'cancha-activa',
          nombre: 'Cancha 1',
          activa: 1,
          superficie: 'Sintética',
          sede_id: 's-1',
          sede_nombre: 'Sede Norte',
        };
      }
      return null;
    }),
    obtenerPartidosProgramadosActivos: vi.fn(async () => [
      {
        id: 'p-otro',
        localId: 'eq-3',
        localNombre: 'Águilas',
        visitanteId: 'eq-4',
        visitanteNombre: 'Tigres',
        canchaId: 'cancha-activa',
        canchaNombre: 'Cancha 1',
        sedeNombre: 'Sede Norte',
        fechaHora: '2026-10-25T14:00:00.000Z',
      },
    ]),
    programarPartido: vi.fn(async ({ canchaId, canchaTexto, fechaHora }) => {
      if (partidoActual) {
        partidoActual = {
          ...partidoActual,
          canchaId,
          cancha: canchaTexto,
          fechaHora,
          estado: 'PROGRAMADO',
        };
      }
    }),
    desprogramarPartido: vi.fn(async () => {
      if (partidoActual) {
        partidoActual = {
          ...partidoActual,
          canchaId: null,
          cancha: null,
          fechaHora: null,
          estado: 'POR_PROGRAMAR',
        };
      }
    }),
  } as unknown as PartidoRepository;
}

describe('PartidoService (KAN-35)', () => {
  it('obtenerPartidoPorId retorna el partido si existe', async () => {
    const repo = crearRepoMock({ id: 'p-1' });
    const service = new PartidoService(repo);

    const partido = await service.obtenerPartidoPorId('p-1');
    expect(partido.id).toBe('p-1');
    expect(partido.localNombre).toBe('Halcones');
  });

  it('obtenerPartidoPorId lanza error 404 si no existe', async () => {
    const repo = crearRepoMock();
    const service = new PartidoService(repo);

    await expect(service.obtenerPartidoPorId('no-existe')).rejects.toThrow(AppError);
  });

  it('programarPartido lanza error de validación ante DTO inválido', async () => {
    const repo = crearRepoMock({ id: 'p-1' });
    const service = new PartidoService(repo);

    await expect(
      service.programarPartido('p-1', {
        canchaId: '',
        fechaHora: 'fecha-mala',
      }),
    ).rejects.toThrow(AppError);
  });

  it('programarPartido lanza error si el partido ya está en estado JUGADO', async () => {
    const repo = crearRepoMock({ id: 'p-1', estado: 'JUGADO' });
    const service = new PartidoService(repo);

    await expect(
      service.programarPartido('p-1', {
        canchaId: 'cancha-activa',
        fechaHora: '2026-10-25T14:00:00.000Z',
      }),
    ).rejects.toThrow(/ya ha sido jugado/i);
  });

  it('programarPartido lanza error si la cancha no existe o está inactiva', async () => {
    const repo = crearRepoMock({ id: 'p-1' });
    const service = new PartidoService(repo);

    // Cancha inexistente
    await expect(
      service.programarPartido('p-1', {
        canchaId: 'cancha-fantasma',
        fechaHora: '2026-10-25T14:00:00.000Z',
      }),
    ).rejects.toThrow(/no existe o no se encuentra activa/i);

    // Cancha inactiva
    await expect(
      service.programarPartido('p-1', {
        canchaId: 'cancha-inactiva',
        fechaHora: '2026-10-25T14:00:00.000Z',
      }),
    ).rejects.toThrow(/no existe o no se encuentra activa/i);
  });

  it('programarPartido lanza conflicto 409 si hay cruce en la cancha', async () => {
    const repo = crearRepoMock({ id: 'p-1' });
    const service = new PartidoService(repo);

    // En el mock ya hay un partido en 'cancha-activa' a las 14:00
    await expect(
      service.programarPartido('p-1', {
        canchaId: 'cancha-activa',
        fechaHora: '2026-10-25T14:30:00.000Z',
      }),
    ).rejects.toThrow(/Cruce de horario/i);
  });

  it('programarPartido programa exitosamente y actualiza a PROGRAMADO', async () => {
    const repo = crearRepoMock({ id: 'p-1' });
    const service = new PartidoService(repo);

    // Horario libre: a las 18:00
    const partidoActualizado = await service.programarPartido('p-1', {
      canchaId: 'cancha-activa',
      fechaHora: '2026-10-25T18:00:00.000Z',
    });

    expect(partidoActualizado.estado).toBe('PROGRAMADO');
    expect(partidoActualizado.canchaId).toBe('cancha-activa');
    expect(partidoActualizado.fechaHora).toBe('2026-10-25T18:00:00.000Z');
    expect(partidoActualizado.cancha).toBe('Sede Norte - Cancha 1');
  });

  it('desprogramarPartido limpia la programación y revierte a POR_PROGRAMAR', async () => {
    const repo = crearRepoMock({
      id: 'p-1',
      estado: 'PROGRAMADO',
      canchaId: 'cancha-activa',
      fechaHora: '2026-10-25T18:00:00.000Z',
    });
    const service = new PartidoService(repo);

    const resultado = await service.desprogramarPartido('p-1');
    expect(resultado.estado).toBe('POR_PROGRAMAR');
    expect(resultado.canchaId).toBeNull();
    expect(resultado.fechaHora).toBeNull();
  });

  it('desprogramarPartido rechaza si el partido ya está JUGADO', async () => {
    const repo = crearRepoMock({ id: 'p-1', estado: 'JUGADO' });
    const service = new PartidoService(repo);

    await expect(service.desprogramarPartido('p-1')).rejects.toThrow(/ya ha sido jugado/i);
  });
});
