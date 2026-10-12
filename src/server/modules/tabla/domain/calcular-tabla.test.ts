import { describe, expect, it } from 'vitest';
import { calcularTabla } from './calcular-tabla';

describe('calcular tabla', () => {
  it('ordena por puntos y diferencia de goles', () => {
    const tabla = calcularTabla([{ equipoId: 'a', equipo: 'A', partidosJugados: 1, ganados: 1, empatados: 0, perdidos: 0, golesFavor: 2, golesContra: 0, puntos: 3 }, { equipoId: 'b', equipo: 'B', partidosJugados: 1, ganados: 1, empatados: 0, perdidos: 0, golesFavor: 1, golesContra: 0, puntos: 3 }]);
    expect(tabla[0]?.equipoId).toBe('a');
  });
});
