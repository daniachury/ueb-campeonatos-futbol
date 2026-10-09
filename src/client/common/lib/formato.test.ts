import { describe, expect, it } from 'vitest';
import { formatearFecha } from './formato';

describe('formatearFecha', () => {
  it('muestra la fecha en español sin correrse un día por la zona horaria', () => {
    expect(formatearFecha('2026-11-07')).toMatch(/^7\D.*nov.*2026$/);
  });

  it('devuelve el texto original si la fecha no es válida', () => {
    expect(formatearFecha('por definir')).toBe('por definir');
  });
});
