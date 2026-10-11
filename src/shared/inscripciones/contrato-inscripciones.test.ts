import { describe, expect, it } from 'vitest';
import { motivoAccionSchema, inscribirDirectamenteSchema } from './contrato-inscripciones';

describe('contrato-inscripciones schemas', () => {
  it('valida motivo entre 10 y 300 caracteres', () => {
    // Muy corto (< 10)
    const corto = motivoAccionSchema.safeParse({ motivo: '123456789' });
    expect(corto.success).toBe(false);

    // Válido (10 caracteres)
    const minValido = motivoAccionSchema.safeParse({ motivo: '1234567890' });
    expect(minValido.success).toBe(true);

    // Válido (longitud normal)
    const normal = motivoAccionSchema.safeParse({
      motivo: 'El equipo no cuenta con la documentación requerida al cierre.',
    });
    expect(normal.success).toBe(true);

    // Muy largo (> 300)
    const largo = motivoAccionSchema.safeParse({ motivo: 'a'.repeat(301) });
    expect(largo.success).toBe(false);

    // Trim de espacios vacíos
    const soloEspacios = motivoAccionSchema.safeParse({ motivo: '          ' });
    expect(soloEspacios.success).toBe(false);
  });

  it('valida inscribirDirectamenteSchema', () => {
    expect(inscribirDirectamenteSchema.safeParse({ equipoId: 'eq-1' }).success).toBe(true);
    expect(inscribirDirectamenteSchema.safeParse({ equipoId: '' }).success).toBe(false);
    expect(inscribirDirectamenteSchema.safeParse({ equipoId: '   ' }).success).toBe(false);
  });
});
