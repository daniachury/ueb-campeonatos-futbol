import { describe, expect, it } from 'vitest';
import { convertirEnClave, describirRangoDeLaSemana, obtenerDiasDeLaSemana } from './semana';

describe('semana', () => {
  it('arma la semana de lunes a domingo que contiene la fecha', () => {
    const dias = obtenerDiasDeLaSemana(new Date(2026, 9, 15)); // jueves 15 de octubre

    expect(dias.map((dia) => `${dia.inicial}${dia.numero}`)).toEqual([
      'L12',
      'M13',
      'M14',
      'J15',
      'V16',
      'S17',
      'D18',
    ]);
    expect(dias[2]?.nombre).toBe('miércoles');
  });

  it('un domingo pertenece a la semana que empezó el lunes anterior', () => {
    const dias = obtenerDiasDeLaSemana(new Date(2026, 9, 18));

    expect(dias[0]?.numero).toBe(12);
  });

  it('describe el rango en el formato del diseño', () => {
    expect(describirRangoDeLaSemana(obtenerDiasDeLaSemana(new Date(2026, 9, 15)))).toBe(
      '12 al 18 de oct',
    );
    expect(describirRangoDeLaSemana(obtenerDiasDeLaSemana(new Date(2026, 9, 1)))).toBe(
      '28 de sep al 4 de oct',
    );
  });

  it('la clave usa la fecha local AAAA-MM-DD', () => {
    expect(convertirEnClave(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
