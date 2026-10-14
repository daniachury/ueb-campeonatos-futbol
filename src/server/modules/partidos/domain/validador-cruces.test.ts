import { describe, expect, it } from 'vitest';
import {
  haySolapamientoHorario,
  verificarCrucesHorarios,
  type PartidoProgramadoExistente,
} from './validador-cruces';

describe('validador-cruces (KAN-35 · Dominio Puro)', () => {
  describe('haySolapamientoHorario', () => {
    it('detecta solapamiento cuando inician al mismo tiempo', () => {
      const ini1 = new Date('2026-10-25T14:00:00.000Z');
      const ini2 = new Date('2026-10-25T14:00:00.000Z');
      expect(haySolapamientoHorario(ini1, 120, ini2, 120)).toBe(true);
    });

    it('detecta solapamiento cuando el segundo inicia 60 minutos después (duración 120m)', () => {
      const ini1 = new Date('2026-10-25T14:00:00.000Z');
      const ini2 = new Date('2026-10-25T15:00:00.000Z');
      expect(haySolapamientoHorario(ini1, 120, ini2, 120)).toBe(true);
    });

    it('detecta solapamiento cuando el segundo inicia 30 minutos antes (duración 120m)', () => {
      const ini1 = new Date('2026-10-25T14:00:00.000Z');
      const ini2 = new Date('2026-10-25T13:30:00.000Z');
      expect(haySolapamientoHorario(ini1, 120, ini2, 120)).toBe(true);
    });

    it('no detecta solapamiento para partidos consecutivos exactos (14:00 a 16:00 y 16:00 a 18:00)', () => {
      const ini1 = new Date('2026-10-25T14:00:00.000Z');
      const ini2 = new Date('2026-10-25T16:00:00.000Z');
      expect(haySolapamientoHorario(ini1, 120, ini2, 120)).toBe(false);
    });

    it('no detecta solapamiento para partidos en fechas u horarios separados', () => {
      const ini1 = new Date('2026-10-25T10:00:00.000Z');
      const ini2 = new Date('2026-10-25T16:00:00.000Z');
      expect(haySolapamientoHorario(ini1, 120, ini2, 120)).toBe(false);
    });
  });

  describe('verificarCrucesHorarios', () => {
    const otrosPartidosBase: PartidoProgramadoExistente[] = [
      {
        id: 'p-existente-1',
        localId: 'eq-tigres',
        localNombre: 'Tigres FC',
        visitanteId: 'eq-leones',
        visitanteNombre: 'Leones FC',
        canchaId: 'cancha-norte-1',
        canchaNombre: 'Cancha 1 Sintética',
        sedeNombre: 'Sede Norte',
        fechaHora: '2026-10-25T14:00:00.000Z',
      },
      {
        id: 'p-existente-2',
        localId: 'eq-aguilas',
        localNombre: 'Águilas Doradas',
        visitanteId: 'eq-condores',
        visitanteNombre: 'Cóndores FC',
        canchaId: 'cancha-sur-2',
        canchaNombre: 'Cancha 2 Césped',
        sedeNombre: 'Sede Sur',
        fechaHora: '2026-10-25T16:30:00.000Z',
      },
    ];

    it('permite programar en una cancha libre y con equipos sin conflicto', () => {
      const res = verificarCrucesHorarios({
        partidoId: 'p-nuevo',
        localId: 'eq-halcones',
        visitanteId: 'eq-lobos',
        canchaId: 'cancha-norte-2',
        fechaHora: '2026-10-25T14:00:00.000Z',
        otrosPartidos: otrosPartidosBase,
      });

      expect(res.hayConflicto).toBe(false);
      expect(res.conflicto).toBeUndefined();
    });

    it('detecta cruce de cancha si se programa en la misma cancha a la misma hora', () => {
      const res = verificarCrucesHorarios({
        partidoId: 'p-nuevo',
        localId: 'eq-halcones',
        visitanteId: 'eq-lobos',
        canchaId: 'cancha-norte-1',
        fechaHora: '2026-10-25T14:30:00.000Z',
        otrosPartidos: otrosPartidosBase,
      });

      expect(res.hayConflicto).toBe(true);
      expect(res.conflicto?.tipo).toBe('CANCHA');
      expect(res.conflicto?.mensaje).toContain('Cruce de horario');
      expect(res.conflicto?.mensaje).toContain('Cancha 1 Sintética');
      expect(res.conflicto?.partidoIdEnConflicto).toBe('p-existente-1');
    });

    it('detecta cruce si el equipo local ya juega en otra cancha en ese horario', () => {
      const res = verificarCrucesHorarios({
        partidoId: 'p-nuevo',
        localId: 'eq-tigres', // Ya juega a las 14:00 en cancha-norte-1
        visitanteId: 'eq-lobos',
        canchaId: 'cancha-sur-2',
        fechaHora: '2026-10-25T14:00:00.000Z',
        otrosPartidos: otrosPartidosBase,
      });

      expect(res.hayConflicto).toBe(true);
      expect(res.conflicto?.tipo).toBe('EQUIPO_LOCAL');
      expect(res.conflicto?.mensaje).toContain('Tigres FC');
    });

    it('detecta cruce si el equipo visitante ya juega en otra cancha en ese horario', () => {
      const res = verificarCrucesHorarios({
        partidoId: 'p-nuevo',
        localId: 'eq-lobos',
        visitanteId: 'eq-leones', // Ya juega a las 14:00 en cancha-norte-1
        canchaId: 'cancha-sur-1',
        fechaHora: '2026-10-25T15:00:00.000Z',
        otrosPartidos: otrosPartidosBase,
      });

      expect(res.hayConflicto).toBe(true);
      expect(res.conflicto?.tipo).toBe('EQUIPO_VISITANTE');
      expect(res.conflicto?.mensaje).toContain('Leones FC');
    });

    it('no genera falso conflicto consigo mismo al reprogramar', () => {
      // Reprogramar el partido p-existente-1 a las 14:15 en su misma cancha
      const res = verificarCrucesHorarios({
        partidoId: 'p-existente-1',
        localId: 'eq-tigres',
        visitanteId: 'eq-leones',
        canchaId: 'cancha-norte-1',
        fechaHora: '2026-10-25T14:15:00.000Z',
        otrosPartidos: otrosPartidosBase,
      });

      expect(res.hayConflicto).toBe(false);
    });

    it('detecta conflicto si un equipo ya juega ese día aunque sea en diferente horario (Escenario 3)', () => {
      // Tigres ya juega el 25 de octubre a las 14:00 (2:00 p. m.) en cancha-norte-1
      // Intentar programar otro partido de Tigres a las 09:00 (9:00 a. m.) ese mismo día
      const res = verificarCrucesHorarios({
        partidoId: 'p-nuevo',
        localId: 'eq-tigres',
        visitanteId: 'eq-lobos',
        canchaId: 'cancha-sur-2',
        fechaHora: '2026-10-25T14:00:00.000Z', // Mismo día calendario
        otrosPartidos: [
          {
            id: 'p-manana',
            localId: 'eq-tigres',
            localNombre: 'Tigres FC',
            visitanteId: 'eq-halcones',
            visitanteNombre: 'Halcones FC',
            canchaId: 'cancha-norte-1',
            fechaHora: '2026-10-25T09:00:00-05:00', // 9:00 a. m.
          },
        ],
      });

      expect(res.hayConflicto).toBe(true);
      expect(res.conflicto?.tipo).toBe('EQUIPO_LOCAL');
      expect(res.conflicto?.mensaje).toContain('ya tiene un partido ese día');
      expect(res.conflicto?.mensaje).toContain('Tigres FC');
    });

    it('detecta conflicto si el partido terminaría después de las 10:00 p. m. (Escenario 5)', () => {
      // 9:00 p. m. en Colombia (21:00) terminaría a las 23:00 (11:00 p. m.)
      const res = verificarCrucesHorarios({
        partidoId: 'p-nuevo',
        localId: 'eq-halcones',
        visitanteId: 'eq-lobos',
        canchaId: 'cancha-norte-2',
        fechaHora: '2026-10-25T21:00:00-05:00',
        otrosPartidos: [],
      });

      expect(res.hayConflicto).toBe(true);
      expect(res.conflicto?.mensaje).toBe(
        'El partido debe terminar a más tardar a las 10:00 p. m.',
      );
    });

    it('detecta conflicto si el partido se programa antes de las 6:00 a. m.', () => {
      // 5:30 a. m. en Colombia
      const res = verificarCrucesHorarios({
        partidoId: 'p-nuevo',
        localId: 'eq-halcones',
        visitanteId: 'eq-lobos',
        canchaId: 'cancha-norte-2',
        fechaHora: '2026-10-25T05:30:00-05:00',
        otrosPartidos: [],
      });

      expect(res.hayConflicto).toBe(true);
      expect(res.conflicto?.mensaje).toBe(
        'El partido no puede programarse antes de las 6:00 a. m.',
      );
    });

    it('ignora partidos sin fecha_hora asignada', () => {
      const partidosConSinHora: PartidoProgramadoExistente[] = [
        {
          id: 'p-sin-hora',
          localId: 'eq-tigres',
          localNombre: 'Tigres FC',
          visitanteId: 'eq-leones',
          visitanteNombre: 'Leones FC',
          canchaId: 'cancha-norte-1',
          fechaHora: '',
        },
      ];

      const res = verificarCrucesHorarios({
        partidoId: 'p-nuevo',
        localId: 'eq-tigres',
        visitanteId: 'eq-leones',
        canchaId: 'cancha-norte-1',
        fechaHora: '2026-10-25T14:00:00.000Z',
        otrosPartidos: partidosConSinHora,
      });

      expect(res.hayConflicto).toBe(false);
    });
  });
});
