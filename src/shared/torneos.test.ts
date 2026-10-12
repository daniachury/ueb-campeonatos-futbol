import { describe, expect, it } from 'vitest';
import { esquemaCrearTorneo, obtenerFechaHoyBogota } from './torneos';

describe('esquemaCrearTorneo (KAN-20)', () => {
  const hoy = obtenerFechaHoyBogota();

  it('acepta un torneo válido con todos los campos requeridos', () => {
    const datosValidos = {
      nombre: 'Copa El Bosque 2026',
      descripcion: 'Torneo anual interfacultades de fútbol 11',
      fechaInicio: hoy,
      cupo: 8,
    };

    const resultado = esquemaCrearTorneo.safeParse(datosValidos);
    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.nombre).toBe('Copa El Bosque 2026');
      expect(resultado.data.modalidad).toBe('FUTBOL_11');
      expect(resultado.data.formato).toBe('LIGA');
      expect(resultado.data.cupo).toBe(8);
    }
  });

  it('rechaza nombres con menos de 3 caracteres', () => {
    const res = esquemaCrearTorneo.safeParse({
      nombre: 'AB',
      fechaInicio: hoy,
      cupo: 8,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toBe('El nombre debe tener al menos 3 caracteres');
    }
  });

  it('rechaza nombres con más de 80 caracteres', () => {
    const res = esquemaCrearTorneo.safeParse({
      nombre: 'A'.repeat(81),
      fechaInicio: hoy,
      cupo: 8,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toBe('Máximo 80 caracteres');
    }
  });

  it('recorta espacios en blanco en el nombre (trim)', () => {
    const res = esquemaCrearTorneo.safeParse({
      nombre: '   Copa Trim   ',
      fechaInicio: hoy,
      cupo: 10,
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.nombre).toBe('Copa Trim');
    }
  });

  it('rechaza fechas anteriores a hoy', () => {
    const res = esquemaCrearTorneo.safeParse({
      nombre: 'Copa Pasada',
      fechaInicio: '2020-01-01',
      cupo: 8,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toBe('La fecha de inicio no puede ser anterior a hoy');
    }
  });

  it('rechaza cupos menores a 3 (ej. 2)', () => {
    const res = esquemaCrearTorneo.safeParse({
      nombre: 'Copa Pocos',
      fechaInicio: hoy,
      cupo: 2,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toBe('El cupo debe estar entre 3 y 20 equipos');
    }
  });

  it('rechaza cupos mayores a 20 (ej. 21)', () => {
    const res = esquemaCrearTorneo.safeParse({
      nombre: 'Copa Demasiados',
      fechaInicio: hoy,
      cupo: 21,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toBe('El cupo debe estar entre 3 y 20 equipos');
    }
  });

  it('fuerza modalidad FUTBOL_11 y formato LIGA incluso si se envían otros valores en la petición', () => {
    const res = esquemaCrearTorneo.safeParse({
      nombre: 'Torneo Fijo',
      fechaInicio: hoy,
      cupo: 12,
      modalidad: 'FUTBOL_8_INVENTADO',
      formato: 'ELIMINACION_DIRECTA',
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.modalidad).toBe('FUTBOL_11');
      expect(res.data.formato).toBe('LIGA');
    }
  });
});
