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
