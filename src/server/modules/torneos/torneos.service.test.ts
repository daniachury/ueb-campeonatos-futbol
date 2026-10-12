import { describe, expect, it } from 'vitest';
import type { EstadoTorneo } from '@shared/constants';
import type { TorneoResumen } from '@shared/torneos';
import type { TorneosRepository } from './torneos.repository';
import { crearTorneosService } from './torneos.service';

/** Repositorio en memoria: permite probar el servicio sin base de datos. */
function repositorioEnMemoria(torneos: TorneoResumen[]) {
  const estadosPedidos: (readonly EstadoTorneo[])[] = [];
  const repositorio: TorneosRepository = {
    async listarPorEstados(estados) {
      estadosPedidos.push(estados);
      return torneos.filter((t) => estados.includes(t.estado));
    },
  };
  return { repositorio, estadosPedidos };
}

const torneos: TorneoResumen[] = [
  { id: 'b', nombre: 'Borrador', estado: 'BORRADOR', fechaInicio: '2026-11-01', cupo: 8 },
  { id: 'f', nombre: 'Finalizado', estado: 'FINALIZADO', fechaInicio: '2026-03-01', cupo: 8 },
  {
    id: 'a',
    nombre: 'Abierto',
    estado: 'INSCRIPCIONES_ABIERTAS',
    fechaInicio: '2026-11-07',
    cupo: 8,
  },
  { id: 'x', nombre: 'Cancelado', estado: 'CANCELADO', fechaInicio: '2026-02-01', cupo: 8 },
];

describe('torneosService.listarPublicos', () => {
  it('sin filtro devuelve solo los estados públicos, en el orden del listado', async () => {
    const { repositorio, estadosPedidos } = repositorioEnMemoria(torneos);

    const resultado = await crearTorneosService(repositorio).listarPublicos();

    expect(resultado.map((t) => t.id)).toEqual(['a', 'f']);
    expect(estadosPedidos[0]).toEqual(['INSCRIPCIONES_ABIERTAS', 'EN_CURSO', 'FINALIZADO']);
  });

  it('con filtro pide al repositorio únicamente ese estado', async () => {
    const { repositorio, estadosPedidos } = repositorioEnMemoria(torneos);

    const resultado = await crearTorneosService(repositorio).listarPublicos('FINALIZADO');

    expect(resultado.map((t) => t.id)).toEqual(['f']);
    expect(estadosPedidos[0]).toEqual(['FINALIZADO']);
  });
});
