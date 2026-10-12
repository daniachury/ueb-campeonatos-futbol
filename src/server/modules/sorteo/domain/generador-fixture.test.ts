import { describe, it, expect } from 'vitest';
import { generarFixtureRoundRobin, EquipoSorteo } from './generador-fixture';

function crearEquipos(n: number): EquipoSorteo[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `eq-${i + 1}`,
    nombre: `Equipo ${i + 1}`,
  }));
}

describe('generadorFixtureRoundRobin (Algoritmo método del círculo)', () => {
  it('lanza error si hay menos de 3 equipos aprobados (Escenario 3)', () => {
    expect(() => generarFixtureRoundRobin(crearEquipos(2))).toThrowError(
      'Se necesitan al menos 3 equipos aprobados para sortear',
    );
    expect(() => generarFixtureRoundRobin([])).toThrowError(
      'Se necesitan al menos 3 equipos aprobados para sortear',
    );
  });

  it('Escenario 1: Sorteo con número par de equipos (8 equipos)', () => {
    const equipos = crearEquipos(8);
    const fixture = generarFixtureRoundRobin(equipos);

    expect(fixture.totalEquipos).toBe(8);
    expect(fixture.totalFechas).toBe(7);
    expect(fixture.totalPartidos).toBe(28); // 8 * 7 / 2

    for (const fecha of fixture.fechas) {
      expect(fecha.partidos.length).toBe(4);
      expect(fecha.equipoDescansaId).toBeNull();
    }
  });

  it('Escenario 2: Sorteo con número impar de equipos (5 equipos)', () => {
    const equipos = crearEquipos(5);
    const fixture = generarFixtureRoundRobin(equipos);

    expect(fixture.totalEquipos).toBe(5);
    expect(fixture.totalFechas).toBe(5);
    expect(fixture.totalPartidos).toBe(10); // 5 * 4 / 2

    const descansosPorEquipo: Record<string, number> = {};

    for (const fecha of fixture.fechas) {
      expect(fecha.partidos.length).toBe(2);
      expect(fecha.equipoDescansaId).not.toBeNull();
      if (fecha.equipoDescansaId) {
        descansosPorEquipo[fecha.equipoDescansaId] =
          (descansosPorEquipo[fecha.equipoDescansaId] || 0) + 1;
      }
    }

    // Cada equipo descansa exactamente una vez
    for (const eq of equipos) {
      expect(descansosPorEquipo[eq.id]).toBe(1);
    }
  });

  it('Caso N = 3: 3 fechas, 1 partido por fecha, 3 descansos totales', () => {
    const equipos = crearEquipos(3);
    const fixture = generarFixtureRoundRobin(equipos);

    expect(fixture.totalFechas).toBe(3);
    expect(fixture.totalPartidos).toBe(3);

    const descansos = fixture.fechas.map((f) => f.equipoDescansaId);
    expect(new Set(descansos).size).toBe(3);
  });

  it('Caso N = 4: 3 fechas, 2 partidos por fecha, 6 partidos totales', () => {
    const equipos = crearEquipos(4);
    const fixture = generarFixtureRoundRobin(equipos);

    expect(fixture.totalFechas).toBe(3);
    expect(fixture.totalPartidos).toBe(6);
  });

  it('Caso N = 20: 19 fechas, 10 partidos por fecha, 190 partidos totales', () => {
    const equipos = crearEquipos(20);
    const fixture = generarFixtureRoundRobin(equipos);

    expect(fixture.totalFechas).toBe(19);
    expect(fixture.totalPartidos).toBe(190);
  });

  it('cumple invariantes para todos los tamaños de N entre 3 y 12', () => {
    for (let n = 3; n <= 12; n++) {
      const equipos = crearEquipos(n);
      const fixture = generarFixtureRoundRobin(equipos);

      const totalEsperadoPartidos = (n * (n - 1)) / 2;
      expect(fixture.totalPartidos).toBe(totalEsperadoPartidos);

      const enfrentamientos = new Set<string>();
      const conteoLocal: Record<string, number> = {};
      const conteoVisitante: Record<string, number> = {};

      for (const eq of equipos) {
        conteoLocal[eq.id] = 0;
        conteoVisitante[eq.id] = 0;
      }

      for (const fecha of fixture.fechas) {
        const equiposEnFecha = new Set<string>();

        if (fecha.equipoDescansaId) {
          equiposEnFecha.add(fecha.equipoDescansaId);
        }

        for (const partido of fecha.partidos) {
          // No puede jugar contra sí mismo
          expect(partido.localId).not.toBe(partido.visitanteId);

          // En la misma fecha no puede jugar dos veces
          expect(equiposEnFecha.has(partido.localId)).toBe(false);
          expect(equiposEnFecha.has(partido.visitanteId)).toBe(false);
          equiposEnFecha.add(partido.localId);
          equiposEnFecha.add(partido.visitanteId);

          conteoLocal[partido.localId]++;
          conteoVisitante[partido.visitanteId]++;

          // Clave de pareja canónica (sin importar orden)
          const pareja = [partido.localId, partido.visitanteId].sort().join(' vs ');
          expect(enfrentamientos.has(pareja)).toBe(false);
          enfrentamientos.add(pareja);
        }
      }

      // Todas las parejas posibles se enfrentaron exactamente 1 vez
      expect(enfrentamientos.size).toBe(totalEsperadoPartidos);

      // Escenario 5: Balance de local y visitante
      // Ningún equipo es local en más de la mitad redondeada hacia arriba de sus partidos (n-1)
      const maximoLocaliasPermitidas = Math.ceil((n - 1) / 2);
      for (const eq of equipos) {
        expect(conteoLocal[eq.id]).toBeLessThanOrEqual(maximoLocaliasPermitidas);
      }
    }
  });

  it('permite inyectar función de barajado para orden determinista', () => {
    const equipos = crearEquipos(4);
    // shuffle inverso
    const fixture = generarFixtureRoundRobin(equipos, {
      barajar: (items) => [...items].reverse(),
    });

    expect(fixture.totalPartidos).toBe(6);
    expect(fixture.fechas.length).toBe(3);
  });
});
