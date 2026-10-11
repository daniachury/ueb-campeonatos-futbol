import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SorteoService } from './sorteo.service';
import { SorteoRepository } from './sorteo.repository';
import { AppError } from '../../core/errors';

describe('SorteoService', () => {
  let mockRepo: {
    obtenerTorneo: ReturnType<typeof vi.fn>;
    obtenerEquiposAprobados: ReturnType<typeof vi.fn>;
    contarSolicitudesPendientes: ReturnType<typeof vi.fn>;
    tieneResultadosRegistrados: ReturnType<typeof vi.fn>;
    guardarSorteoInicial: ReturnType<typeof vi.fn>;
    repetirSorteo: ReturnType<typeof vi.fn>;
    obtenerFixtureTorneo: ReturnType<typeof vi.fn>;
  };
  let service: SorteoService;

  beforeEach(() => {
    mockRepo = {
      obtenerTorneo: vi.fn(),
      obtenerEquiposAprobados: vi.fn(),
      contarSolicitudesPendientes: vi.fn(),
      tieneResultadosRegistrados: vi.fn(),
      guardarSorteoInicial: vi.fn(),
      repetirSorteo: vi.fn(),
      obtenerFixtureTorneo: vi.fn(),
    };
    service = new SorteoService(mockRepo as unknown as SorteoRepository);
  });

  describe('obtenerVistaPrevia', () => {
    it('lanza 404 si el torneo no existe', async () => {
      mockRepo.obtenerTorneo.mockResolvedValue(null);
      await expect(service.obtenerVistaPrevia('t-inexistente')).rejects.toThrow(
        AppError,
      );
    });

    it('devuelve estimación correcta con solicitudes pendientes', async () => {
      mockRepo.obtenerTorneo.mockResolvedValue({
        id: 't-1',
        nombre: 'Copa Bosque',
        estado: 'INSCRIPCIONES_ABIERTAS',
        cupo: 8,
      });
      mockRepo.obtenerEquiposAprobados.mockResolvedValue([
        { id: 'e1', nombre: 'Equipo 1' },
        { id: 'e2', nombre: 'Equipo 2' },
        { id: 'e3', nombre: 'Equipo 3' },
        { id: 'e4', nombre: 'Equipo 4' },
      ]);
      mockRepo.contarSolicitudesPendientes.mockResolvedValue(2);

      const res = await service.obtenerVistaPrevia('t-1');
      expect(res.valido).toBe(true);
      expect(res.equiposAprobados).toBe(4);
      expect(res.totalFechas).toBe(3);
      expect(res.totalPartidos).toBe(6);
      expect(res.solicitudesPendientes).toBe(2);
    });
  });

  describe('ejecutarSorteo', () => {
    it('lanza 404 si el torneo no existe', async () => {
      mockRepo.obtenerTorneo.mockResolvedValue(null);
      await expect(service.ejecutarSorteo('t-404')).rejects.toThrow(AppError);
    });

    it('lanza 409 si el torneo ya está EN_CURSO (Escenario 6 / inmodificable)', async () => {
      mockRepo.obtenerTorneo.mockResolvedValue({
        id: 't-1',
        nombre: 'Torneo',
        estado: 'EN_CURSO',
        cupo: 8,
      });
      await expect(service.ejecutarSorteo('t-1')).rejects.toMatchObject({
        status: 409,
        codigo: 'TORNEO_NO_MODIFICABLE',
      });
    });

    it('lanza 400 si hay menos de 3 equipos aprobados (Escenario 3)', async () => {
      mockRepo.obtenerTorneo.mockResolvedValue({
        id: 't-1',
        nombre: 'Torneo',
        estado: 'INSCRIPCIONES_ABIERTAS',
        cupo: 8,
      });
      mockRepo.obtenerEquiposAprobados.mockResolvedValue([
        { id: 'e1', nombre: 'Equipo 1' },
        { id: 'e2', nombre: 'Equipo 2' },
      ]);

      await expect(service.ejecutarSorteo('t-1')).rejects.toMatchObject({
        status: 400,
        message: 'Se necesitan al menos 3 equipos aprobados para sortear',
      });
    });

    it('ejecuta sorteo exitosamente para número par de equipos (Escenario 1)', async () => {
      mockRepo.obtenerTorneo.mockResolvedValue({
        id: 't-1',
        nombre: 'Copa El Bosque',
        estado: 'INSCRIPCIONES_ABIERTAS',
        cupo: 8,
      });
      const equipos = Array.from({ length: 8 }, (_, i) => ({
        id: `e-${i + 1}`,
        nombre: `Equipo ${i + 1}`,
      }));
      mockRepo.obtenerEquiposAprobados.mockResolvedValue(equipos);
      mockRepo.guardarSorteoInicial.mockResolvedValue(undefined);
      mockRepo.obtenerFixtureTorneo.mockResolvedValue({
        torneoId: 't-1',
        totalEquipos: 8,
        totalFechas: 7,
        totalPartidos: 28,
        puedeRepetirSorteo: true,
        fechas: [],
      });

      const res = await service.ejecutarSorteo('t-1');

      expect(mockRepo.guardarSorteoInicial).toHaveBeenCalledWith(
        't-1',
        expect.objectContaining({
          totalEquipos: 8,
          totalFechas: 7,
          totalPartidos: 28,
        }),
      );
      expect(res.totalPartidos).toBe(28);
    });
  });

  describe('repetirSorteo', () => {
    it('lanza 404 si el torneo no existe', async () => {
      mockRepo.obtenerTorneo.mockResolvedValue(null);
      await expect(service.repetirSorteo('t-404')).rejects.toThrow(AppError);
    });

    it('lanza 409 si el torneo no está EN_CURSO', async () => {
      mockRepo.obtenerTorneo.mockResolvedValue({
        id: 't-1',
        nombre: 'Torneo',
        estado: 'INSCRIPCIONES_ABIERTAS',
        cupo: 8,
      });
      await expect(service.repetirSorteo('t-1')).rejects.toMatchObject({
        status: 409,
        codigo: 'TORNEO_NO_EN_CURSO',
      });
    });

    it('lanza 409 si ya existen resultados registrados (Escenario 6)', async () => {
      mockRepo.obtenerTorneo.mockResolvedValue({
        id: 't-1',
        nombre: 'Torneo',
        estado: 'EN_CURSO',
        cupo: 8,
      });
      mockRepo.tieneResultadosRegistrados.mockResolvedValue(true);

      await expect(service.repetirSorteo('t-1')).rejects.toMatchObject({
        status: 409,
        codigo: 'SORTEO_CON_RESULTADOS',
        message:
          'No se puede repetir el sorteo porque ya existen partidos con resultados registrados',
      });
    });

    it('repite el sorteo exitosamente si ningún partido tiene resultado (Escenario 6)', async () => {
      mockRepo.obtenerTorneo.mockResolvedValue({
        id: 't-1',
        nombre: 'Torneo',
        estado: 'EN_CURSO',
        cupo: 8,
      });
      mockRepo.tieneResultadosRegistrados.mockResolvedValue(false);
      const equipos = [
        { id: 'e1', nombre: 'Equipo 1' },
        { id: 'e2', nombre: 'Equipo 2' },
        { id: 'e3', nombre: 'Equipo 3' },
      ];
      mockRepo.obtenerEquiposAprobados.mockResolvedValue(equipos);
      mockRepo.repetirSorteo.mockResolvedValue(undefined);
      mockRepo.obtenerFixtureTorneo.mockResolvedValue({
        torneoId: 't-1',
        totalEquipos: 3,
        totalFechas: 3,
        totalPartidos: 3,
        puedeRepetirSorteo: true,
        fechas: [],
      });

      const res = await service.repetirSorteo('t-1');
      expect(mockRepo.repetirSorteo).toHaveBeenCalledWith(
        't-1',
        expect.objectContaining({
          totalEquipos: 3,
          totalPartidos: 3,
        }),
      );
      expect(res.totalFechas).toBe(3);
    });
  });

  describe('obtenerFixture', () => {
    it('lanza 404 si el torneo no existe', async () => {
      mockRepo.obtenerTorneo.mockResolvedValue(null);
      await expect(service.obtenerFixture('t-404')).rejects.toThrow(AppError);
    });

    it('devuelve el fixture del repositorio', async () => {
      mockRepo.obtenerTorneo.mockResolvedValue({
        id: 't-1',
        nombre: 'Torneo',
        estado: 'EN_CURSO',
        cupo: 8,
      });
      mockRepo.obtenerFixtureTorneo.mockResolvedValue({
        torneoId: 't-1',
        totalEquipos: 4,
        totalFechas: 3,
        totalPartidos: 6,
        puedeRepetirSorteo: true,
        fechas: [],
      });

      const res = await service.obtenerFixture('t-1');
      expect(res.totalPartidos).toBe(6);
    });
  });
});
