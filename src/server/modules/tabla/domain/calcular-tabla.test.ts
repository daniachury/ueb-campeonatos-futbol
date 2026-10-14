import { describe, expect, it } from 'vitest';
import { calcularTabla } from './calcular-tabla';

describe('calcular tabla', () => {
  it('ordena por puntos y diferencia de goles', () => {
    const tabla = calcularTabla([{ equipoId: 'a', equipo: 'A', partidosJugados: 1, ganados: 1, empatados: 0, perdidos: 0, golesFavor: 2, golesContra: 0, puntos: 3 }, { equipoId: 'b', equipo: 'B', partidosJugados: 1, ganados: 1, empatados: 0, perdidos: 0, golesFavor: 1, golesContra: 0, puntos: 3 }]);
    expect(tabla[0]?.equipoId).toBe('a');
  });

  describe('KAN-39 · Calcular la tabla de posiciones', () => {
    it('Escenario 2: Caso de verificación oficial de Jira (4 equipos, 3 resultados)', () => {
      const filas = [
        { equipoId: 'eq-b', equipo: 'B', partidosJugados: 1, ganados: 0, empatados: 0, perdidos: 1, golesFavor: 0, golesContra: 2, puntos: 0, faltas: 8 },
        { equipoId: 'eq-d', equipo: 'D', partidosJugados: 1, ganados: 0, empatados: 1, perdidos: 0, golesFavor: 1, golesContra: 1, puntos: 1, faltas: 7 },
        { equipoId: 'eq-a', equipo: 'A', partidosJugados: 2, ganados: 1, empatados: 1, perdidos: 0, golesFavor: 3, golesContra: 1, puntos: 4, faltas: 19 },
        { equipoId: 'eq-c', equipo: 'C', partidosJugados: 2, ganados: 0, empatados: 2, perdidos: 0, golesFavor: 2, golesContra: 2, puntos: 2, faltas: 19 },
      ];

      const resultado = calcularTabla(filas);

      expect(resultado[0]?.equipo).toBe('A');
      expect(resultado[0]?.puntos).toBe(4);

      expect(resultado[1]?.equipo).toBe('C');
      expect(resultado[1]?.puntos).toBe(2);

      expect(resultado[2]?.equipo).toBe('D');
      expect(resultado[2]?.puntos).toBe(1);

      expect(resultado[3]?.equipo).toBe('B');
      expect(resultado[3]?.puntos).toBe(0);
    });

    it('Escenario 3: Desempate por diferencia de gol (mismos puntos)', () => {
      const filas = [
        { equipoId: 'eq-1', equipo: 'Tigres', partidosJugados: 2, ganados: 2, empatados: 0, perdidos: 0, golesFavor: 4, golesContra: 2, puntos: 6 }, // DG: +2
        { equipoId: 'eq-2', equipo: 'Leones', partidosJugados: 2, ganados: 2, empatados: 0, perdidos: 0, golesFavor: 6, golesContra: 2, puntos: 6 }, // DG: +4
      ];

      const resultado = calcularTabla(filas);
      expect(resultado[0]?.equipo).toBe('Leones');
      expect(resultado[1]?.equipo).toBe('Tigres');
    });

    it('Escenario 4: Desempate por goles a favor (mismos puntos y misma DG)', () => {
      const filas = [
        { equipoId: 'eq-1', equipo: 'Equipo A', partidosJugados: 2, ganados: 1, empatados: 0, perdidos: 1, golesFavor: 5, golesContra: 2, puntos: 3 }, // DG: +3, GF: 5
        { equipoId: 'eq-2', equipo: 'Equipo B', partidosJugados: 2, ganados: 1, empatados: 0, perdidos: 1, golesFavor: 8, golesContra: 5, puntos: 3 }, // DG: +3, GF: 8
      ];

      const resultado = calcularTabla(filas);
      expect(resultado[0]?.equipo).toBe('Equipo B');
      expect(resultado[1]?.equipo).toBe('Equipo A');
    });

    it('Escenario 5: Desempate por juego limpio / menos faltas (mismos pts, DG y GF)', () => {
      const filas = [
        { equipoId: 'eq-1', equipo: 'Equipo A', partidosJugados: 1, ganados: 1, empatados: 0, perdidos: 0, golesFavor: 2, golesContra: 1, puntos: 3, faltas: 25 },
        { equipoId: 'eq-2', equipo: 'Equipo B', partidosJugados: 1, ganados: 1, empatados: 0, perdidos: 0, golesFavor: 2, golesContra: 1, puntos: 3, faltas: 20 },
      ];

      const resultado = calcularTabla(filas);
      expect(resultado[0]?.equipo).toBe('Equipo B');
      expect(resultado[1]?.equipo).toBe('Equipo A');
    });

    it('Escenario 6: Desempate alfabético por nombre si hay empate total', () => {
      const filas = [
        { equipoId: 'eq-z', equipo: 'Zorros', partidosJugados: 1, ganados: 0, empatados: 0, perdidos: 0, golesFavor: 0, golesContra: 0, puntos: 0 },
        { equipoId: 'eq-a', equipo: 'Águilas', partidosJugados: 1, ganados: 0, empatados: 0, perdidos: 0, golesFavor: 0, golesContra: 0, puntos: 0 },
      ];

      const resultado = calcularTabla(filas);
      expect(resultado[0]?.equipo).toBe('Águilas');
      expect(resultado[1]?.equipo).toBe('Zorros');
    });
  });
});
