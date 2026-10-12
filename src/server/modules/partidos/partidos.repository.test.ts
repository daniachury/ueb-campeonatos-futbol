import { describe, expect, it } from 'vitest';
import { crearD1Falsa } from '../../test/d1-falsa';
import { PartidoRepository } from './partidos.repository';

describe('PartidoRepository (KAN-35)', () => {
  it('obtenerPartidoPorId retorna el partido con datos de equipos y cancha', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM partidos p')) {
        return [
          {
            id: 'p-1',
            fecha_id: 'f-1',
            torneo_id: 't-1',
            local_id: 'eq-1',
            visitante_id: 'eq-2',
            estado: 'POR_PROGRAMAR',
            fecha_hora: null,
            cancha: null,
            cancha_id: null,
            local_nombre: 'Halcones',
            local_color: '#ff0000',
            visitante_nombre: 'Cóndores',
            visitante_color: '#00ff00',
            cancha_nombre: null,
            sede_nombre: null,
          },
        ];
      }
      return [];
    });

    const repo = new PartidoRepository(db);
    const partido = await repo.obtenerPartidoPorId('p-1');

    expect(partido).not.toBeNull();
    expect(partido?.id).toBe('p-1');
    expect(partido?.localNombre).toBe('Halcones');
    expect(partido?.visitanteNombre).toBe('Cóndores');
    expect(partido?.estado).toBe('POR_PROGRAMAR');
  });

  it('obtenerPartidoPorId retorna null si no existe', async () => {
    const { db } = crearD1Falsa(() => []);
    const repo = new PartidoRepository(db);
    const partido = await repo.obtenerPartidoPorId('no-existe');
    expect(partido).toBeNull();
  });

  it('obtenerCanchaConSede retorna la cancha con su sede si existe', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM canchas c')) {
        return [
          {
            id: 'cancha-1',
            nombre: 'Cancha Sintética 1',
            activa: 1,
            superficie: 'Sintética',
            sede_id: 'sede-1',
            sede_nombre: 'Complejo El Bosque',
          },
        ];
      }
      return [];
    });

    const repo = new PartidoRepository(db);
    const cancha = await repo.obtenerCanchaConSede('cancha-1');

    expect(cancha).not.toBeNull();
    expect(cancha?.nombre).toBe('Cancha Sintética 1');
    expect(cancha?.activa).toBe(1);
    expect(cancha?.sede_nombre).toBe('Complejo El Bosque');
  });

  it('obtenerPartidosProgramadosActivos lista todos los partidos en PROGRAMADO', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM partidos p')) {
        return [
          {
            id: 'p-1',
            local_id: 'eq-1',
            visitante_id: 'eq-2',
            cancha_id: 'c-1',
            fecha_hora: '2026-10-25T14:00:00.000Z',
            local_nombre: 'Halcones',
            visitante_nombre: 'Cóndores',
            cancha_nombre: 'Cancha 1',
            sede_nombre: 'El Bosque',
          },
        ];
      }
      return [];
    });

    const repo = new PartidoRepository(db);
    const partidos = await repo.obtenerPartidosProgramadosActivos();

    expect(partidos).toHaveLength(1);
    expect(partidos[0]?.canchaId).toBe('c-1');
    expect(partidos[0]?.fechaHora).toBe('2026-10-25T14:00:00.000Z');
  });

  it('programarPartido ejecuta UPDATE cambiando estado a PROGRAMADO', async () => {
    let sqlEjecutado = '';
    let paramsEjecutados: unknown[] = [];

    const { db } = crearD1Falsa((sql, params) => {
      sqlEjecutado = sql;
      paramsEjecutados = params;
      return [];
    });

    const repo = new PartidoRepository(db);
    await repo.programarPartido({
      id: 'p-1',
      canchaId: 'c-1',
      canchaTexto: 'El Bosque - Cancha 1',
      fechaHora: '2026-10-25T14:00:00.000Z',
    });

    expect(sqlEjecutado).toContain('UPDATE partidos');
    expect(sqlEjecutado).toContain("estado = 'PROGRAMADO'");
    expect(paramsEjecutados).toContain('c-1');
    expect(paramsEjecutados).toContain('El Bosque - Cancha 1');
    expect(paramsEjecutados).toContain('2026-10-25T14:00:00.000Z');
  });

  it('desprogramarPartido ejecuta UPDATE limpiando cancha y volviendo a POR_PROGRAMAR', async () => {
    let sqlEjecutado = '';
    const { db } = crearD1Falsa((sql) => {
      sqlEjecutado = sql;
      return [];
    });

    const repo = new PartidoRepository(db);
    await repo.desprogramarPartido('p-1');

    expect(sqlEjecutado).toContain('UPDATE partidos');
    expect(sqlEjecutado).toContain("cancha_id = NULL");
    expect(sqlEjecutado).toContain("estado = 'POR_PROGRAMAR'");
  });
});
