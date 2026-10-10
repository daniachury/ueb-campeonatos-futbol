import { describe, expect, it } from 'vitest';
import { obtenerIniciales, obtenerPrimerNombre } from './texto';

describe('texto', () => {
  it.each([
    ['Laura Gómez', 'LG'],
    ['camilo andrés rojas', 'CA'],
    ['  Ana  ', 'A'],
  ])('obtenerIniciales(%s) → %s', (nombre, iniciales) => {
    expect(obtenerIniciales(nombre)).toBe(iniciales);
  });

  it('obtenerPrimerNombre toma la primera palabra', () => {
    expect(obtenerPrimerNombre(' Camilo Rojas')).toBe('Camilo');
  });
});
