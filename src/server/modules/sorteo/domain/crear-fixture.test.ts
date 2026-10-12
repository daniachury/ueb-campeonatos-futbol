import { describe, expect, it } from 'vitest';
import { crearFixture } from './crear-fixture';

describe('crear fixture', () => {
  it('crea todos los cruces una vez', () => {
    const partidos = crearFixture(['a', 'b', 'c', 'd']);
    expect(partidos).toHaveLength(6);
    expect(new Set(partidos.map((partido) => [partido.localId, partido.visitanteId].sort().join('-'))).size).toBe(6);
  });
});
