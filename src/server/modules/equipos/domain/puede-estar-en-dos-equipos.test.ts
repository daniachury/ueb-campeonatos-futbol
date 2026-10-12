import { describe, expect, it } from 'vitest';
import { puedeUnirseAlEquipo } from './puede-estar-en-dos-equipos';

describe('regla de equipos por torneo', () => {
  it('permite unirse si no está en otro equipo del torneo', () => {
    expect(puedeUnirseAlEquipo('jugador-2', 'torneo-1', [{ torneoId: 'torneo-1', equipoId: 'equipo-1', usuarioIds: ['jugador-1'] }])).toBe(true);
  });

  it('impide estar en dos equipos del mismo torneo', () => {
    expect(puedeUnirseAlEquipo('jugador-1', 'torneo-1', [{ torneoId: 'torneo-1', equipoId: 'equipo-1', usuarioIds: ['jugador-1'] }])).toBe(false);
  });

  it('permite estar en equipos de torneos diferentes', () => {
    expect(puedeUnirseAlEquipo('jugador-1', 'torneo-2', [{ torneoId: 'torneo-1', equipoId: 'equipo-1', usuarioIds: ['jugador-1'] }])).toBe(true);
  });
});
