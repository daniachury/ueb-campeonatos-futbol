import { describe, expect, it } from 'vitest';
import { esquemaProgramarPartido } from './contrato-partidos';

describe('contrato-partidos (KAN-35)', () => {
  it('acepta datos válidos de programación con cancha y fecha ISO', () => {
    const entrada = {
      canchaId: 'cancha-123',
      fechaHora: '2026-10-25T14:00:00.000Z',
    };

    const res = esquemaProgramarPartido.safeParse(entrada);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.canchaId).toBe('cancha-123');
      expect(res.data.fechaHora).toBe('2026-10-25T14:00:00.000Z');
    }
  });

  it('rechaza canchaId vacía o con solo espacios', () => {
    const entrada = {
      canchaId: '   ',
      fechaHora: '2026-10-25T14:00:00.000Z',
    };

    const res = esquemaProgramarPartido.safeParse(entrada);
    expect(res.success).toBe(false);
  });

  it('rechaza fechaHora con formato no parseable', () => {
    const entrada = {
      canchaId: 'cancha-123',
      fechaHora: 'fecha-invalida',
    };

    const res = esquemaProgramarPartido.safeParse(entrada);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toContain('formato válido');
    }
  });

  it('rechaza campos faltantes', () => {
    expect(esquemaProgramarPartido.safeParse({}).success).toBe(false);
    expect(esquemaProgramarPartido.safeParse({ canchaId: 'cancha-1' }).success).toBe(false);
    expect(
      esquemaProgramarPartido.safeParse({ fechaHora: '2026-10-25T14:00:00.000Z' }).success,
    ).toBe(false);
  });
});
