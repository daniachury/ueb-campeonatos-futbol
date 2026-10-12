import { describe, it, expect } from 'vitest';
import { estimarFixture } from './contrato-sorteo';

describe('estimarFixture', () => {
  it('invalida si hay menos de 3 equipos', () => {
    const res1 = estimarFixture(2);
    expect(res1.valido).toBe(false);
    expect(res1.mensaje).toBe('Se necesitan al menos 3 equipos aprobados para sortear');

    const res0 = estimarFixture(0);
    expect(res0.valido).toBe(false);
  });

  it('calcula correctamente para 3 equipos (impar)', () => {
    const res = estimarFixture(3);
    expect(res.valido).toBe(true);
    expect(res.totalFechas).toBe(3);
    expect(res.partidosPorFecha).toBe(1);
    expect(res.totalPartidos).toBe(3);
    expect(res.tieneDescanso).toBe(true);
  });

  it('calcula correctamente para 4 equipos (par)', () => {
    const res = estimarFixture(4);
    expect(res.valido).toBe(true);
    expect(res.totalFechas).toBe(3);
    expect(res.partidosPorFecha).toBe(2);
    expect(res.totalPartidos).toBe(6);
    expect(res.tieneDescanso).toBe(false);
  });

  it('calcula correctamente para 8 equipos (par)', () => {
    const res = estimarFixture(8);
    expect(res.valido).toBe(true);
    expect(res.totalFechas).toBe(7);
    expect(res.partidosPorFecha).toBe(4);
    expect(res.totalPartidos).toBe(28);
    expect(res.tieneDescanso).toBe(false);
  });

  it('calcula correctamente para 20 equipos (máximo)', () => {
    const res = estimarFixture(20);
    expect(res.valido).toBe(true);
    expect(res.totalFechas).toBe(19);
    expect(res.partidosPorFecha).toBe(10);
    expect(res.totalPartidos).toBe(190);
    expect(res.tieneDescanso).toBe(false);
  });
});
