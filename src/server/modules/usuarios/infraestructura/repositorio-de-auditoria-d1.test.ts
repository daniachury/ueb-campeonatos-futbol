import { describe, expect, it } from 'vitest';
import { crearD1Falsa } from '../../../test/d1-falsa';
import { RepositorioDeAuditoriaD1 } from './repositorio-de-auditoria-d1';

describe('RepositorioDeAuditoriaD1 (KAN-18 · Escenario 1)', () => {
  it('registra una fila en la tabla auditoria_admins con los datos exactos', async () => {
    const { db, consultas } = crearD1Falsa();
    const repo = new RepositorioDeAuditoriaD1(db);

    const creadoEn = new Date('2026-10-10T15:30:00.000Z');
    await repo.registrar({
      id: 'audit-001',
      adminCreadorId: 'admin-creador',
      usuarioId: 'nuevo-admin',
      accion: 'CREAR_ADMIN',
      creadoEn,
    });

    expect(consultas).toHaveLength(1);
    const consulta = consultas[0]!;
    expect(consulta.sql).toContain('INSERT INTO auditoria_admins');
    expect(consulta.parametros).toEqual([
      'audit-001',
      'admin-creador',
      'nuevo-admin',
      'CREAR_ADMIN',
      '2026-10-10T15:30:00.000Z',
    ]);
  });
});
