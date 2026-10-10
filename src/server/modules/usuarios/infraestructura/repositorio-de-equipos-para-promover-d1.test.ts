import { describe, expect, it } from 'vitest';
import { crearD1Falsa } from '../../../test/d1-falsa';
import { RepositorioDeEquiposParaPromoverD1 } from './repositorio-de-equipos-para-promover-d1';

describe('RepositorioDeEquiposParaPromoverD1 (KAN-18 · Escenario 3)', () => {
  describe('jugadorPerteneceAEquipoEnTorneoEnCurso', () => {
    it('retorna true si encuentra una fila con torneo EN_CURSO', async () => {
      const { db } = crearD1Falsa((sql) => {
        if (sql.includes('EN_CURSO')) return [{ existe: 1 }];
        return [];
      });

      const repo = new RepositorioDeEquiposParaPromoverD1(db);
      const enCurso = await repo.jugadorPerteneceAEquipoEnTorneoEnCurso('jugador-1');
      expect(enCurso).toBe(true);
    });

    it('retorna false si no encuentra torneos EN_CURSO', async () => {
      const { db } = crearD1Falsa(() => []);

      const repo = new RepositorioDeEquiposParaPromoverD1(db);
      const enCurso = await repo.jugadorPerteneceAEquipoEnTorneoEnCurso('jugador-libre');
      expect(enCurso).toBe(false);
    });
  });

  describe('removerJugadorDeEquipos', () => {
    it('traspasa la capitanía al siguiente miembro activo si el jugador es capitán', async () => {
      const { db, consultas } = crearD1Falsa((sql) => {
        if (sql.includes('SELECT e.id FROM equipos')) {
          return [{ id: 'equipo-100' }];
        }
        if (sql.includes('SELECT me.usuario_id')) {
          return [{ usuario_id: 'siguiente-capitan-id' }];
        }
        return [];
      });

      const repo = new RepositorioDeEquiposParaPromoverD1(db);
      await repo.removerJugadorDeEquipos('capitan-actual');

      const updates = consultas.filter((c) => c.sql.includes('UPDATE'));
      expect(updates).toHaveLength(2);

      // Traspaso de capitanía
      expect(updates[0]!.sql).toContain('UPDATE equipos SET capitan_id = ?');
      expect(updates[0]!.parametros).toEqual(['siguiente-capitan-id', 'equipo-100']);

      // Desactivación de membrecía
      expect(updates[1]!.sql).toContain('UPDATE miembros_equipo SET activo = 0');
      expect(updates[1]!.parametros).toEqual(['capitan-actual']);
    });

    it('desactiva el equipo si no hay más miembros activos', async () => {
      const { db, consultas } = crearD1Falsa((sql) => {
        if (sql.includes('SELECT e.id FROM equipos')) {
          return [{ id: 'equipo-solitario' }];
        }
        if (sql.includes('SELECT me.usuario_id')) {
          return [];
        }
        return [];
      });

      const repo = new RepositorioDeEquiposParaPromoverD1(db);
      await repo.removerJugadorDeEquipos('capitan-solo');

      const updates = consultas.filter((c) => c.sql.includes('UPDATE'));
      expect(updates).toHaveLength(2);

      // Desactivación del equipo
      expect(updates[0]!.sql).toContain('UPDATE equipos SET activo = 0');
      expect(updates[0]!.parametros).toEqual(['equipo-solitario']);

      // Desactivación de membrecía
      expect(updates[1]!.sql).toContain('UPDATE miembros_equipo SET activo = 0');
      expect(updates[1]!.parametros).toEqual(['capitan-solo']);
    });
  });
});
