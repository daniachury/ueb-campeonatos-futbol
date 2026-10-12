import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../core/errors';
import { SedeRepository } from './sedes.repository';
import { SedeService } from './sedes.service';

function crearMockRepo(): SedeRepository {
  return {
    crearSede: vi.fn(),
    obtenerSedes: vi.fn(),
    obtenerSedePorId: vi.fn(),
    buscarSedePorNombre: vi.fn(),
    actualizarSede: vi.fn(),
    eliminarSede: vi.fn(),
    contarPartidosProgramadosEnSede: vi.fn(),
    crearCancha: vi.fn(),
    obtenerCanchaPorId: vi.fn(),
    buscarCanchaPorSedeYNombre: vi.fn(),
    actualizarCancha: vi.fn(),
    eliminarCancha: vi.fn(),
    contarPartidosProgramadosEnCancha: vi.fn(),
    obtenerCanchasDisponibles: vi.fn(),
  } as unknown as SedeRepository;
}

describe('SedeService (KAN-34)', () => {
  it('Escenario 1: Crear sede exitosamente y lista con 0 canchas', async () => {
    const mockRepo = crearMockRepo();
    vi.mocked(mockRepo.buscarSedePorNombre).mockResolvedValue(null);
    vi.mocked(mockRepo.crearSede).mockResolvedValue({
      id: 's-1',
      nombre: 'Complejo El Bosque',
      direccion: 'Av Cra 9',
      ciudad: 'Bogotá',
      indicaciones: null,
      totalCanchas: 0,
      totalPartidosProgramados: 0,
      canchas: [],
      creadoEn: '2026-10-11T10:00:00Z',
      actualizadoEn: '2026-10-11T10:00:00Z',
    });

    const service = new SedeService(mockRepo);
    const sede = await service.crearSede({
      nombre: 'Complejo El Bosque',
      direccion: 'Av Cra 9',
      ciudad: 'Bogotá',
    });

    expect(sede.id).toBe('s-1');
    expect(sede.nombre).toBe('Complejo El Bosque');
    expect(sede.canchas).toHaveLength(0);
  });

  it('Escenario 1 error: Rechaza crear sede si el nombre ya existe (409)', async () => {
    const mockRepo = crearMockRepo();
    vi.mocked(mockRepo.buscarSedePorNombre).mockResolvedValue({
      id: 's-existente',
      nombre: 'Complejo El Bosque',
      direccion: 'Cra 9',
      ciudad: 'Bogotá',
      indicaciones: null,
      totalCanchas: 0,
      totalPartidosProgramados: 0,
      canchas: [],
      creadoEn: '',
      actualizadoEn: '',
    });

    const service = new SedeService(mockRepo);
    await expect(
      service.crearSede({
        nombre: 'complejo el bosque',
        direccion: 'Calle 134',
        ciudad: 'Bogotá',
      }),
    ).rejects.toThrow('Ya existe una sede con ese nombre');
  });

  it('Escenario 2: Agregar canchas a una sede existente', async () => {
    const mockRepo = crearMockRepo();
    vi.mocked(mockRepo.obtenerSedePorId).mockResolvedValue({
      id: 's-1',
      nombre: 'Complejo El Bosque',
      direccion: 'Cra 9',
      ciudad: 'Bogotá',
      indicaciones: null,
      totalCanchas: 0,
      totalPartidosProgramados: 0,
      canchas: [],
      creadoEn: '',
      actualizadoEn: '',
    });
    vi.mocked(mockRepo.buscarCanchaPorSedeYNombre).mockResolvedValue(null);
    vi.mocked(mockRepo.crearCancha).mockResolvedValue({
      id: 'c-1',
      sedeId: 's-1',
      nombre: 'Cancha 1',
      superficie: 'Sintética',
      activa: true,
      partidosProgramados: 0,
      creadoEn: '2026-10-11T10:00:00Z',
      actualizadoEn: '2026-10-11T10:00:00Z',
    });

    const service = new SedeService(mockRepo);
    const cancha = await service.crearCancha('s-1', {
      nombre: 'Cancha 1',
      superficie: 'Sintética',
      activa: true,
    });

    expect(cancha.nombre).toBe('Cancha 1');
    expect(cancha.superficie).toBe('Sintética');
    expect(cancha.activa).toBe(true);
  });

  it('Escenario 3: Duplicados en la misma sede responde 409 con mensaje exacto', async () => {
    const mockRepo = crearMockRepo();
    vi.mocked(mockRepo.obtenerSedePorId).mockResolvedValue({
      id: 's-1',
      nombre: 'Complejo El Bosque',
      direccion: 'Cra 9',
      ciudad: 'Bogotá',
      indicaciones: null,
      totalCanchas: 1,
      totalPartidosProgramados: 0,
      canchas: [],
      creadoEn: '',
      actualizadoEn: '',
    });
    vi.mocked(mockRepo.buscarCanchaPorSedeYNombre).mockResolvedValue({
      id: 'c-existente',
      sedeId: 's-1',
      nombre: 'Cancha 1',
      superficie: 'Sintética',
      activa: true,
      partidosProgramados: 0,
      creadoEn: '',
      actualizadoEn: '',
    });

    const service = new SedeService(mockRepo);
    try {
      await service.crearCancha('s-1', {
        nombre: 'cancha 1',
        superficie: 'Natural',
        activa: true,
      });
      expect.fail('Debería haber fallado');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      const appErr = err as AppError;
      expect(appErr.status).toBe(409);
      expect(appErr.message).toBe('Ya existe una cancha con ese nombre en esta sede');
    }
  });

  it('Escenario 3: Permite crear cancha con el mismo nombre en otra sede', async () => {
    const mockRepo = crearMockRepo();
    vi.mocked(mockRepo.obtenerSedePorId).mockResolvedValue({
      id: 's-2',
      nombre: 'Sede Norte',
      direccion: 'Calle 170',
      ciudad: 'Bogotá',
      indicaciones: null,
      totalCanchas: 0,
      totalPartidosProgramados: 0,
      canchas: [],
      creadoEn: '',
      actualizadoEn: '',
    });
    vi.mocked(mockRepo.buscarCanchaPorSedeYNombre).mockResolvedValue(null);
    vi.mocked(mockRepo.crearCancha).mockResolvedValue({
      id: 'c-2',
      sedeId: 's-2',
      nombre: 'Cancha 1',
      superficie: 'Natural',
      activa: true,
      partidosProgramados: 0,
      creadoEn: '2026-10-11T10:00:00Z',
      actualizadoEn: '2026-10-11T10:00:00Z',
    });

    const service = new SedeService(mockRepo);
    const cancha = await service.crearCancha('s-2', {
      nombre: 'Cancha 1',
      superficie: 'Natural',
      activa: true,
    });
    expect(cancha.sedeId).toBe('s-2');
    expect(cancha.nombre).toBe('Cancha 1');
  });

  it('Escenario 4: Editar sede y cancha con datos válidos', async () => {
    const mockRepo = crearMockRepo();
    vi.mocked(mockRepo.obtenerSedePorId).mockResolvedValue({
      id: 's-1',
      nombre: 'Complejo El Bosque',
      direccion: 'Cra 9',
      ciudad: 'Bogotá',
      indicaciones: null,
      totalCanchas: 1,
      totalPartidosProgramados: 0,
      canchas: [],
      creadoEn: '',
      actualizadoEn: '',
    });
    vi.mocked(mockRepo.actualizarSede).mockResolvedValue({
      id: 's-1',
      nombre: 'Complejo Deportivo El Bosque',
      direccion: 'Av Cra 9 # 131A-02',
      ciudad: 'Bogotá',
      indicaciones: 'Nueva entrada',
      totalCanchas: 1,
      totalPartidosProgramados: 0,
      canchas: [],
      creadoEn: '',
      actualizadoEn: '',
    });

    const service = new SedeService(mockRepo);
    const sedeActualizada = await service.actualizarSede('s-1', {
      nombre: 'Complejo Deportivo El Bosque',
      indicaciones: 'Nueva entrada',
    });
    expect(sedeActualizada.nombre).toBe('Complejo Deportivo El Bosque');
  });

  it('Escenario 5: Desactivar cancha conserva sus partidos y la oculta del selector', async () => {
    const mockRepo = crearMockRepo();
    vi.mocked(mockRepo.obtenerCanchaPorId).mockResolvedValue({
      id: 'c-1',
      sedeId: 's-1',
      nombre: 'Cancha 1',
      superficie: 'Sintética',
      activa: true,
      partidosProgramados: 2,
      creadoEn: '',
      actualizadoEn: '',
    });
    vi.mocked(mockRepo.actualizarCancha).mockResolvedValue({
      id: 'c-1',
      sedeId: 's-1',
      nombre: 'Cancha 1',
      superficie: 'Sintética',
      activa: false,
      partidosProgramados: 2,
      creadoEn: '',
      actualizadoEn: '',
    });
    vi.mocked(mockRepo.obtenerCanchasDisponibles).mockResolvedValue([]);

    const service = new SedeService(mockRepo);
    const canchaInactiva = await service.actualizarCancha('s-1', 'c-1', { activa: false });
    expect(canchaInactiva.activa).toBe(false);

    const disponibles = await service.obtenerCanchasDisponibles();
    expect(disponibles).toHaveLength(0);
  });

  it('Escenario 6: Eliminar cancha con partidos responde 409 con mensaje exacto', async () => {
    const mockRepo = crearMockRepo();
    vi.mocked(mockRepo.obtenerCanchaPorId).mockResolvedValue({
      id: 'c-1',
      sedeId: 's-1',
      nombre: 'Cancha 1',
      superficie: 'Sintética',
      activa: true,
      partidosProgramados: 3,
      creadoEn: '',
      actualizadoEn: '',
    });
    vi.mocked(mockRepo.contarPartidosProgramadosEnCancha).mockResolvedValue(3);

    const service = new SedeService(mockRepo);
    try {
      await service.eliminarCancha('s-1', 'c-1');
      expect.fail('Debería haber fallado con 409');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      const appErr = err as AppError;
      expect(appErr.status).toBe(409);
      expect(appErr.message).toBe(
        'No se puede eliminar: tiene 3 partidos programados. Reprográmalos o desactiva la cancha',
      );
    }
  });

  it('Escenario 6: Eliminar sede con partidos responde 409 con mensaje exacto', async () => {
    const mockRepo = crearMockRepo();
    vi.mocked(mockRepo.obtenerSedePorId).mockResolvedValue({
      id: 's-1',
      nombre: 'Complejo El Bosque',
      direccion: 'Cra 9',
      ciudad: 'Bogotá',
      indicaciones: null,
      totalCanchas: 2,
      totalPartidosProgramados: 5,
      canchas: [],
      creadoEn: '',
      actualizadoEn: '',
    });
    vi.mocked(mockRepo.contarPartidosProgramadosEnSede).mockResolvedValue(5);

    const service = new SedeService(mockRepo);
    try {
      await service.eliminarSede('s-1');
      expect.fail('Debería haber fallado con 409');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      const appErr = err as AppError;
      expect(appErr.status).toBe(409);
      expect(appErr.message).toBe(
        'No se puede eliminar: tiene 5 partidos programados. Reprográmalos o desactiva la cancha',
      );
    }
  });

  it('Escenario 7: Eliminar cancha y sede sin partidos programados', async () => {
    const mockRepo = crearMockRepo();
    vi.mocked(mockRepo.obtenerCanchaPorId).mockResolvedValue({
      id: 'c-1',
      sedeId: 's-1',
      nombre: 'Cancha 1',
      superficie: 'Sintética',
      activa: true,
      partidosProgramados: 0,
      creadoEn: '',
      actualizadoEn: '',
    });
    vi.mocked(mockRepo.contarPartidosProgramadosEnCancha).mockResolvedValue(0);
    vi.mocked(mockRepo.eliminarCancha).mockResolvedValue();

    const service = new SedeService(mockRepo);
    await service.eliminarCancha('s-1', 'c-1');
    expect(mockRepo.eliminarCancha).toHaveBeenCalledWith('c-1');

    vi.mocked(mockRepo.obtenerSedePorId).mockResolvedValue({
      id: 's-1',
      nombre: 'Complejo El Bosque',
      direccion: 'Cra 9',
      ciudad: 'Bogotá',
      indicaciones: null,
      totalCanchas: 0,
      totalPartidosProgramados: 0,
      canchas: [],
      creadoEn: '',
      actualizadoEn: '',
    });
    vi.mocked(mockRepo.contarPartidosProgramadosEnSede).mockResolvedValue(0);
    vi.mocked(mockRepo.eliminarSede).mockResolvedValue();

    await service.eliminarSede('s-1');
    expect(mockRepo.eliminarSede).toHaveBeenCalledWith('s-1');
  });
});
