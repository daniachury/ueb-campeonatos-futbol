import { describe, expect, it } from 'vitest';
import { crearD1Falsa } from '../../test/d1-falsa';
import { SedeRepository } from './sedes.repository';

describe('SedeRepository (KAN-34)', () => {
  it('crearSede inserta una sede y la retorna', async () => {
    let sqlEjecutado = '';
    const { db } = crearD1Falsa((sql) => {
      sqlEjecutado = sql;
      return [];
    });

    const repo = new SedeRepository(db);
    const sede = await repo.crearSede({
      id: 'sede-1',
      nombre: 'Complejo El Bosque',
      direccion: 'Av. Cra 9 # 131A-02',
      ciudad: 'Bogotá',
      indicaciones: 'Portería norte',
    });

    expect(sqlEjecutado).toContain('INSERT INTO sedes');
    expect(sede.id).toBe('sede-1');
    expect(sede.nombre).toBe('Complejo El Bosque');
  });

  it('obtenerSedes lista todas las sedes con sus canchas y conteos', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM sedes')) {
        return [
          {
            id: 's-1',
            nombre: 'Complejo El Bosque',
            direccion: 'Cra 9',
            ciudad: 'Bogotá',
            indicaciones: null,
            creado_en: '2026-10-11T10:00:00Z',
            actualizado_en: '2026-10-11T10:00:00Z',
          },
        ];
      }
      if (sql.includes('FROM canchas')) {
        return [
          {
            id: 'c-1',
            sede_id: 's-1',
            nombre: 'Cancha 1',
            superficie: 'Sintética',
            activa: 1,
            partidos_programados: 2,
            creado_en: '2026-10-11T10:00:00Z',
            actualizado_en: '2026-10-11T10:00:00Z',
          },
        ];
      }
      return [];
    });

    const repo = new SedeRepository(db);
    const sedes = await repo.obtenerSedes();

    expect(sedes).toHaveLength(1);
    expect(sedes[0].nombre).toBe('Complejo El Bosque');
    expect(sedes[0].totalCanchas).toBe(1);
    expect(sedes[0].totalPartidosProgramados).toBe(2);
    expect(sedes[0].canchas[0].nombre).toBe('Cancha 1');
  });

  it('buscarPorNombre encuentra sede insensible a mayúsculas', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('WHERE LOWER(nombre) = LOWER(?)')) {
        return [{ id: 's-1', nombre: 'Complejo El Bosque' }];
      }
      return [];
    });

    const repo = new SedeRepository(db);
    const sede = await repo.buscarSedePorNombre('complejo el bosque');
    expect(sede).not.toBeNull();
    expect(sede?.id).toBe('s-1');
  });

  it('crearCancha inserta una cancha vinculada a la sede', async () => {
    let sqlEjecutado = '';
    const { db } = crearD1Falsa((sql) => {
      sqlEjecutado = sql;
      return [];
    });

    const repo = new SedeRepository(db);
    const cancha = await repo.crearCancha({
      id: 'c-1',
      sedeId: 's-1',
      nombre: 'Cancha 1',
      superficie: 'Sintética',
      activa: true,
    });

    expect(sqlEjecutado).toContain('INSERT INTO canchas');
    expect(cancha.nombre).toBe('Cancha 1');
    expect(cancha.activa).toBe(true);
  });

  it('buscarCanchaPorSedeYNombre encuentra duplicados en la misma sede', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('WHERE sede_id = ? AND LOWER(nombre) = LOWER(?)')) {
        return [{ id: 'c-1', nombre: 'Cancha 1' }];
      }
      return [];
    });

    const repo = new SedeRepository(db);
    const cancha = await repo.buscarCanchaPorSedeYNombre('s-1', 'cancha 1');
    expect(cancha).not.toBeNull();
    expect(cancha?.id).toBe('c-1');
  });

  it('contarPartidosProgramadosEnCancha retorna el total de partidos pendientes', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM partidos') && sql.includes('cancha_id = ?')) {
        return [{ count: 3 }];
      }
      return [];
    });

    const repo = new SedeRepository(db);
    const total = await repo.contarPartidosProgramadosEnCancha('c-1');
    expect(total).toBe(3);
  });

  it('contarPartidosProgramadosEnSede retorna la suma de todas sus canchas', async () => {
    const { db } = crearD1Falsa((sql) => {
      if (sql.includes('FROM partidos') && sql.includes('c.sede_id = ?')) {
        return [{ count: 5 }];
      }
      return [];
    });

    const repo = new SedeRepository(db);
    const total = await repo.contarPartidosProgramadosEnSede('s-1');
    expect(total).toBe(5);
  });
});
