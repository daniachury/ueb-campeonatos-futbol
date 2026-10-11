import { describe, it, expect } from 'vitest';
import { SorteoRepository } from './sorteo.repository';
import { crearD1Falsa } from '../../test/d1-falsa';
import { ResultadoFixtureGenerado } from './domain/generador-fixture';

const fixtureEjemplo: ResultadoFixtureGenerado = {
  totalEquipos: 3,
  totalFechas: 3,
  totalPartidos: 3,
  fechas: [
    {
      numero: 1,
      equipoDescansaId: 'eq-3',
      partidos: [{ localId: 'eq-1', visitanteId: 'eq-2' }],
    },
    {
      numero: 2,
      equipoDescansaId: 'eq-2',
      partidos: [{ localId: 'eq-3', visitanteId: 'eq-1' }],
    },
    {
      numero: 3,
      equipoDescansaId: 'eq-1',
      partidos: [{ localId: 'eq-2', visitanteId: 'eq-3' }],
    },
  ],
};

describe('SorteoRepository', () => {
  it('obtiene torneo o null', async () => {
    const { db } = crearD1Falsa((sql, params) => {
      if (sql.includes('SELECT id, nombre, estado, cupo FROM torneos')) {
        if (params && params[0] === 't-1') {
          return [{ id: 't-1', nombre: 'Copa El Bosque', estado: 'INSCRIPCIONES_ABIERTAS', cupo: 8 }];
        }
        return [];
      }
      return [];
    });
    const repo = new SorteoRepository(db);

    const t = await repo.obtenerTorneo('t-1');
    expect(t?.nombre).toBe('Copa El Bosque');

    const t404 = await repo.obtenerTorneo('t-404');
    expect(t404).toBeNull();
  });

  it('obtiene equipos aprobados y cuenta pendientes', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes("WHERE i.torneo_id = ? AND i.estado = 'APROBADO'")) {
        return [{ id: 'eq-1', nombre: 'Tigres', color: '#ff0000' }];
      }
      if (sql.includes("WHERE torneo_id = ? AND estado = 'PENDIENTE'")) {
        return [{ count: 3 }];
      }
      return [];
    });
    const repo = new SorteoRepository(db);

    const aprobados = await repo.obtenerEquiposAprobados('t-1');
    expect(aprobados.length).toBe(1);

    const pendientes = await repo.contarSolicitudesPendientes('t-1');
    expect(pendientes).toBe(3);
  });

  it('verifica si existen resultados registrados', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM partidos') && sql.includes('COUNT(*)')) {
        return [{ count: 2 }];
      }
      return [];
    });
    const repo = new SorteoRepository(db);

    const tiene = await repo.tieneResultadosRegistrados('t-1');
    expect(tiene).toBe(true);
  });

  it('guarda sorteo inicial en batch', async () => {
    const sentenciasEjecutadas: string[] = [];
    const { db } = crearD1Falsa((sql) => {
      sentenciasEjecutadas.push(sql);
      return [];
    });
    const repo = new SorteoRepository(db);

    await repo.guardarSorteoInicial('t-1', fixtureEjemplo);

    expect(sentenciasEjecutadas.some((s) => s.includes('UPDATE inscripciones'))).toBe(true);
    expect(sentenciasEjecutadas.some((s) => s.includes('INSERT INTO fechas'))).toBe(true);
    expect(sentenciasEjecutadas.some((s) => s.includes('INSERT INTO partidos'))).toBe(true);
    expect(sentenciasEjecutadas.some((s) => s.includes('UPDATE torneos'))).toBe(true);
  });

  it('repite sorteo borrando anteriores y guardando nuevas fechas', async () => {
    const sentenciasEjecutadas: string[] = [];
    const { db } = crearD1Falsa((sql) => {
      sentenciasEjecutadas.push(sql);
      return [];
    });
    const repo = new SorteoRepository(db);

    await repo.repetirSorteo('t-1', fixtureEjemplo);

    expect(sentenciasEjecutadas.some((s) => s.includes('DELETE FROM partidos'))).toBe(true);
    expect(sentenciasEjecutadas.some((s) => s.includes('DELETE FROM fechas'))).toBe(true);
    expect(sentenciasEjecutadas.some((s) => s.includes('INSERT INTO fechas'))).toBe(true);
    expect(sentenciasEjecutadas.some((s) => s.includes('INSERT INTO partidos'))).toBe(true);
  });

  it('obtiene fixture completo del torneo estructurado por fechas', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('SELECT f.id, f.torneo_id, f.numero')) {
        return [
          {
            id: 'f-1',
            torneo_id: 't-1',
            numero: 1,
            equipo_descansa_id: 'eq-3',
            descansa_nombre: 'Águilas',
            descansa_color: '#333333',
          },
        ];
      }
      if (sql.includes('SELECT p.id, p.fecha_id, p.torneo_id')) {
        return [
          {
            id: 'p-1',
            fecha_id: 'f-1',
            torneo_id: 't-1',
            local_id: 'eq-1',
            visitante_id: 'eq-2',
            estado: 'POR_PROGRAMAR',
            goles_local: null,
            goles_visitante: null,
            fecha_hora: null,
            cancha: null,
            local_nombre: 'Tigres',
            local_color: '#ff0000',
            visitante_nombre: 'Leones',
            visitante_color: '#00ff00',
          },
        ];
      }
      return [];
    });
    const repo = new SorteoRepository(db);

    const fixture = await repo.obtenerFixtureTorneo('t-1');
    expect(fixture.torneoId).toBe('t-1');
    expect(fixture.totalFechas).toBe(1);
    expect(fixture.totalPartidos).toBe(1);
    expect(fixture.puedeRepetirSorteo).toBe(true);
    expect(fixture.fechas[0].equipoDescansa?.nombre).toBe('Águilas');
    expect(fixture.fechas[0].partidos[0].local.nombre).toBe('Tigres');
  });
});
