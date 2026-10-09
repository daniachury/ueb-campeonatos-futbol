import { describe, expect, it } from 'vitest';
import type { TorneoResumen } from '@shared/torneos';
import { ordenarParaListado } from './ordenar-torneos';

const torneo = (
  id: string,
  estado: TorneoResumen['estado'],
  fechaInicio: string,
): TorneoResumen => ({
  id,
  nombre: `Torneo ${id}`,
  estado,
  fechaInicio,
  cupo: 8,
});

describe('ordenarParaListado', () => {
  it('pone primero las inscripciones abiertas, luego en curso y al final los finalizados', () => {
    const resultado = ordenarParaListado([
      torneo('fin', 'FINALIZADO', '2026-01-10'),
      torneo('curso', 'EN_CURSO', '2026-09-01'),
      torneo('abierto', 'INSCRIPCIONES_ABIERTAS', '2026-12-01'),
    ]);

    expect(resultado.map((t) => t.id)).toEqual(['abierto', 'curso', 'fin']);
  });

  it('dentro del mismo estado ordena por la fecha de inicio más cercana', () => {
    const resultado = ordenarParaListado([
      torneo('tarde', 'INSCRIPCIONES_ABIERTAS', '2026-12-01'),
      torneo('pronto', 'INSCRIPCIONES_ABIERTAS', '2026-10-20'),
    ]);

    expect(resultado.map((t) => t.id)).toEqual(['pronto', 'tarde']);
  });

  it('deja al final cualquier estado que no sea público', () => {
    const resultado = ordenarParaListado([
      torneo('borrador', 'BORRADOR', '2026-01-01'),
      torneo('fin', 'FINALIZADO', '2026-05-01'),
    ]);

    expect(resultado.map((t) => t.id)).toEqual(['fin', 'borrador']);
  });

  it('no modifica la lista original', () => {
    const original = [
      torneo('b', 'FINALIZADO', '2026-01-01'),
      torneo('a', 'EN_CURSO', '2026-01-01'),
    ];

    ordenarParaListado(original);

    expect(original.map((t) => t.id)).toEqual(['b', 'a']);
  });
});
