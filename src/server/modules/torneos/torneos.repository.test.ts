import { describe, expect, it } from 'vitest';
import { crearD1Falsa } from '../../test/d1-falsa';
import { crearTorneosRepository } from './torneos.repository';

describe('TorneosRepository (D1 SQLite)', () => {
  it('listarPorEstados devuelve lista vacía si el arreglo de estados está vacío', async () => {
    const { db, consultas } = crearD1Falsa();
    const repo = crearTorneosRepository(db);

    const resultado = await repo.listarPorEstados([]);
    expect(resultado).toEqual([]);
    expect(consultas).toHaveLength(0);
  });

  it('listarPorEstados ejecuta consulta con marcadores de estado', async () => {
    const { db, consultas } = crearD1Falsa(() => [
      { id: 't1', nombre: 'Torneo 1', estado: 'INSCRIPCIONES_ABIERTAS', fechaInicio: '2026-11-01', cupo: 8 },
    ]);
    const repo = crearTorneosRepository(db);

    const resultado = await repo.listarPorEstados(['INSCRIPCIONES_ABIERTAS', 'EN_CURSO']);
    expect(resultado).toHaveLength(1);
    expect(consultas[0]?.sql).toContain('WHERE estado IN (?, ?)');
    expect(consultas[0]?.parametros).toEqual(['INSCRIPCIONES_ABIERTAS', 'EN_CURSO']);
  });

  it('listarAdmin consulta todos los torneos ordenados por creado_en DESC', async () => {
    const { db, consultas } = crearD1Falsa(() => [
      {
        id: 't-admin',
        nombre: 'Copa Admin',
        descripcion: 'Desc',
        modalidad: 'FUTBOL_11',
        formato: 'LIGA',
        fechaInicio: '2026-12-01',
        cupo: 10,
        estado: 'BORRADOR',
        creadoEn: '2026-10-01T12:00:00Z',
      },
    ]);
    const repo = crearTorneosRepository(db);

    const resultado = await repo.listarAdmin();
    expect(resultado).toHaveLength(1);
    expect(resultado[0]?.nombre).toBe('Copa Admin');
    expect(consultas[0]?.sql).toContain('ORDER BY creado_en DESC');
  });

  it('buscarPorNombre ejecuta búsqueda case-insensitive', async () => {
    const { db, consultas } = crearD1Falsa((_sql, params) => {
      if (String(params[0]).toLowerCase() === 'copa el bosque') {
        return [
          {
            id: 't-123',
            nombre: 'Copa El Bosque',
            estado: 'BORRADOR',
            fechaInicio: '2026-11-20',
            cupo: 8,
          },
        ];
      }
      return [];
    });
    const repo = crearTorneosRepository(db);

    const encontrado = await repo.buscarPorNombre('  Copa El Bosque  ');
    expect(encontrado?.id).toBe('t-123');
    expect(consultas[0]?.sql).toContain('WHERE LOWER(nombre) = LOWER(?)');
    expect(consultas[0]?.parametros).toEqual(['Copa El Bosque']);
  });

  it('obtenerPorId retorna el registro correspondiente', async () => {
    const { db, consultas } = crearD1Falsa(() => [
      {
        id: 't-id',
        nombre: 'Torneo Buscado',
        estado: 'BORRADOR',
        fechaInicio: '2026-11-10',
        cupo: 12,
      },
    ]);
    const repo = crearTorneosRepository(db);

    const resultado = await repo.obtenerPorId('t-id');
    expect(resultado?.nombre).toBe('Torneo Buscado');
    expect(consultas[0]?.sql).toContain('WHERE id = ?');
    expect(consultas[0]?.parametros).toEqual(['t-id']);
  });

  it('crear inserta el torneo y devuelve el registro creado', async () => {
    const { db, consultas } = crearD1Falsa();
    const repo = crearTorneosRepository(db);

    const nuevo = await repo.crear({
      id: 'uuid-1',
      nombre: 'Nuevo Torneo',
      descripcion: 'Detalle',
      fechaInicio: '2026-12-01',
      cupo: 8,
      modalidad: 'FUTBOL_11',
      formato: 'LIGA',
      estado: 'BORRADOR',
    });

    expect(nuevo.id).toBe('uuid-1');
    expect(nuevo.nombre).toBe('Nuevo Torneo');
    expect(nuevo.estado).toBe('BORRADOR');
    expect(consultas[0]?.sql).toContain('INSERT INTO torneos');
    expect(consultas[0]?.parametros[0]).toBe('uuid-1');
    expect(consultas[0]?.parametros[1]).toBe('Nuevo Torneo');
  });

  it('actualizarEstado actualiza el estado y fecha de modificación', async () => {
    const { db, consultas } = crearD1Falsa();
    const repo = crearTorneosRepository(db);

    await repo.actualizarEstado('t-1', 'INSCRIPCIONES_ABIERTAS');
    expect(consultas[0]?.sql).toContain('UPDATE torneos');
    expect(consultas[0]?.parametros[0]).toBe('INSCRIPCIONES_ABIERTAS');
    expect(consultas[0]?.parametros[2]).toBe('t-1');
  });
});
