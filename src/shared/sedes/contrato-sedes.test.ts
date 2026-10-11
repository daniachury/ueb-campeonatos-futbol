import { describe, expect, it } from 'vitest';
import {
  esquemaCrearCancha,
  esquemaCrearSede,
  esquemaEditarCancha,
  esquemaEditarSede,
  reglaCancha,
  reglaSede,
} from './contrato-sedes';

describe('Contrato y Esquemas de Sedes y Canchas (KAN-34)', () => {
  describe('esquemaCrearSede', () => {
    it('valida con éxito una sede correcta con ciudad por defecto', () => {
      const res = esquemaCrearSede.safeParse({
        nombre: 'Complejo El Bosque',
        direccion: 'Av. Cra 9 # 131A-02',
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.nombre).toBe('Complejo El Bosque');
        expect(res.data.ciudad).toBe('Bogotá');
        expect(res.data.indicaciones).toBeUndefined();
      }
    });

    it('valida con éxito con ciudad personalizada e indicaciones', () => {
      const res = esquemaCrearSede.safeParse({
        nombre: 'Campus Chía',
        direccion: 'Km 2 Vía Chía',
        ciudad: 'Chía',
        indicaciones: 'Entrada por la portería norte vehicular',
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.ciudad).toBe('Chía');
        expect(res.data.indicaciones).toBe('Entrada por la portería norte vehicular');
      }
    });

    it('falla si el nombre tiene menos de 3 caracteres', () => {
      const res = esquemaCrearSede.safeParse({
        nombre: 'AB',
        direccion: 'Calle 100 # 15-20',
      });
      expect(res.success).toBe(false);
    });

    it('falla si el nombre supera 80 caracteres', () => {
      const res = esquemaCrearSede.safeParse({
        nombre: 'A'.repeat(reglaSede.NOMBRE_MAX + 1),
        direccion: 'Calle 100 # 15-20',
      });
      expect(res.success).toBe(false);
    });

    it('falla si la dirección tiene menos de 5 caracteres', () => {
      const res = esquemaCrearSede.safeParse({
        nombre: 'Sede Norte',
        direccion: 'Cra1',
      });
      expect(res.success).toBe(false);
    });

    it('falla si las indicaciones superan 300 caracteres', () => {
      const res = esquemaCrearSede.safeParse({
        nombre: 'Sede Central',
        direccion: 'Carrera 7 # 120-10',
        indicaciones: 'X'.repeat(reglaSede.INDICACIONES_MAX + 1),
      });
      expect(res.success).toBe(false);
    });
  });

  describe('esquemaCrearCancha', () => {
    it('valida cancha con nombre, superficie sintética y activa por defecto true', () => {
      const res = esquemaCrearCancha.safeParse({
        nombre: 'Cancha 1',
        superficie: 'Sintética',
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.nombre).toBe('Cancha 1');
        expect(res.data.superficie).toBe('Sintética');
        expect(res.data.activa).toBe(true);
      }
    });

    it('permite superficies válidas: Natural, Sintética, Otra o null', () => {
      for (const sup of ['Natural', 'Sintética', 'Otra'] as const) {
        const res = esquemaCrearCancha.safeParse({ nombre: 'C1', superficie: sup });
        expect(res.success).toBe(true);
      }
      const resNull = esquemaCrearCancha.safeParse({ nombre: 'C1', superficie: null });
      expect(resNull.success).toBe(true);
    });

    it('rechaza superficie inválida', () => {
      const res = esquemaCrearCancha.safeParse({
        nombre: 'Cancha 1',
        superficie: 'Cemento',
      });
      expect(res.success).toBe(false);
    });

    it('falla si el nombre está vacío o supera 30 caracteres', () => {
      expect(esquemaCrearCancha.safeParse({ nombre: '' }).success).toBe(false);
      expect(
        esquemaCrearCancha.safeParse({ nombre: 'X'.repeat(reglaCancha.NOMBRE_MAX + 1) }).success,
      ).toBe(false);
    });
  });

  describe('esquemaEditarSede y esquemaEditarCancha', () => {
    it('permite edición parcial de sede', () => {
      const res = esquemaEditarSede.safeParse({ direccion: 'Nueva Calle 150 # 10-20' });
      expect(res.success).toBe(true);
    });

    it('permite cambiar estado activa de cancha', () => {
      const res = esquemaEditarCancha.safeParse({ activa: false });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.activa).toBe(false);
      }
    });
  });
});
