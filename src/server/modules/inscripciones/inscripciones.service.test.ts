import { describe, expect, it, vi } from 'vitest';
import { crearInscripcionesService } from './inscripciones.service';
import type {
  DetalleEquipoDb,
  InscripcionDb,
  InscripcionesRepository,
  TorneoDb,
} from './inscripciones.repository';
import type { SolicitudInscripcionResumen } from '@shared/inscripciones/contrato-inscripciones';

function crearMockRepository(parcial: Partial<InscripcionesRepository> = {}): InscripcionesRepository {
  const torneoDefault: TorneoDb = {
    id: 'torneo-1',
    nombre: 'Copa El Bosque',
    cupo: 8,
    estado: 'INSCRIPCIONES_ABIERTAS',
  };

  const equipoDefault: DetalleEquipoDb = {
    id: 'equipo-1',
    nombre: 'Los Halcones',
    color: '#0055ff',
    capitanId: 'user-cap',
    capitanNombre: 'Carlos Capitán',
    cantidadJugadores: 14,
  };

  const inscripcionDefault: InscripcionDb = {
    id: 'insc-1',
    torneo_id: 'torneo-1',
    equipo_id: 'equipo-1',
    estado: 'PENDIENTE',
    motivo: null,
    solicitada_por: 'user-cap',
    aprobada_por: null,
    creada_en: '2026-10-10T10:00:00.000Z',
    actualizada_en: '2026-10-10T10:00:00.000Z',
  };

  return {
    buscarTorneoPorId: vi.fn(async () => torneoDefault),
    contarEquiposAprobados: vi.fn(async () => 5),
    buscarInscripcionPorId: vi.fn(async () => inscripcionDefault),
    listarInscripcionesPorTorneo: vi.fn(async () => [
      {
        id: 'insc-1',
        torneoId: 'torneo-1',
        equipoId: 'equipo-1',
        equipoNombre: 'Los Halcones',
        equipoColor: '#0055ff',
        capitanNombre: 'Carlos Capitán',
        cantidadJugadores: 14,
        estado: 'PENDIENTE',
        fechaSolicitud: '2026-10-10T10:00:00.000Z',
        motivo: null,
        aprobadoPor: null,
        fechaResolucion: null,
      } as SolicitudInscripcionResumen,
    ]),
    buscarDetalleEquipo: vi.fn(async () => equipoDefault),
    buscarConflictosJugadores: vi.fn(async () => []),
    actualizarEstadoInscripcion: vi.fn(async () => {}),
    crearInscripcion: vi.fn(async () => {}),
    listarEquiposDisponibles: vi.fn(async () => []),
    ...parcial,
  };
}

describe('InscripcionesService (casos de uso)', () => {
  it('Escenario 1: obtiene bandeja con pestañas y contador "5/8"', async () => {
    const repo = crearMockRepository();
    const service = crearInscripcionesService(repo);

    const bandeja = await service.obtenerBandeja('torneo-1');

    expect(bandeja.torneo.nombre).toBe('Copa El Bosque');
    expect(bandeja.contadorAprobados).toBe('5/8');
    expect(bandeja.cupoCompleto).toBe(false);
    expect(bandeja.torneoEnCurso).toBe(false);
    expect(bandeja.pendientes).toHaveLength(1);
    expect(bandeja.aprobados).toHaveLength(0);
    expect(bandeja.rechazados).toHaveLength(0);
  });

  it('Escenario 2: aprueba solicitud válida y registra quién aprobó', async () => {
    const repo = crearMockRepository();
    const service = crearInscripcionesService(repo);

    await service.aprobarInscripcion('insc-1', 'admin-99');

    expect(repo.actualizarEstadoInscripcion).toHaveBeenCalledWith({
      id: 'insc-1',
      estado: 'APROBADO',
      aprobadaPor: 'admin-99',
    });
  });

  it('Escenario 3: rechaza aprobación ante conflicto sobrevenido de jugadores', async () => {
    const repo = crearMockRepository({
      buscarConflictosJugadores: vi.fn(async () => [
        {
          jugadorId: 'j-9',
          nombreJugador: 'Andrés Suárez',
          otroEquipoId: 'eq-2',
          otroEquipoNombre: 'Real Bosque',
        },
      ]),
    });
    const service = crearInscripcionesService(repo);

    await expect(service.aprobarInscripcion('insc-1', 'admin-99')).rejects.toThrowError(
      'Jugadores en conflicto: Andrés Suárez (Real Bosque)',
    );
    expect(repo.actualizarEstadoInscripcion).not.toHaveBeenCalled();
  });

  it('Escenario 4: rechaza solicitud con motivo obligatorio', async () => {
    const repo = crearMockRepository();
    const service = crearInscripcionesService(repo);

    await service.rechazarInscripcion('insc-1', 'admin-99', 'Documentación ilegible');

    expect(repo.actualizarEstadoInscripcion).toHaveBeenCalledWith({
      id: 'insc-1',
      estado: 'RECHAZADO',
      motivo: 'Documentación ilegible',
      aprobadaPor: 'admin-99',
    });
  });

  it('Escenario 5: inscribe directamente un equipo sin solicitud previa', async () => {
    const repo = crearMockRepository({
      listarInscripcionesPorTorneo: vi.fn(async () => []),
    });
    const service = crearInscripcionesService(repo);

    const id = await service.inscribirDirectamente('torneo-1', 'equipo-1', 'admin-99');

    expect(id).toBeDefined();
    expect(repo.crearInscripcion).toHaveBeenCalledWith(
      expect.objectContaining({
        torneoId: 'torneo-1',
        equipoId: 'equipo-1',
        estado: 'APROBADO',
        aprobadaPor: 'admin-99',
      }),
    );
  });

  it('Escenario 5 bis: rechaza inscripción directa si el equipo ya está inscrito', async () => {
    const repo = crearMockRepository({
      listarInscripcionesPorTorneo: vi.fn(async () => [
        {
          id: 'existente',
          torneoId: 'torneo-1',
          equipoId: 'equipo-1',
          estado: 'APROBADO',
        } as SolicitudInscripcionResumen,
      ]),
    });
    const service = crearInscripcionesService(repo);

    await expect(
      service.inscribirDirectamente('torneo-1', 'equipo-1', 'admin-99'),
    ).rejects.toThrowError('El equipo ya cuenta con una solicitud activa en este torneo');
  });

  it('Escenario 6: bloquea aprobación cuando el cupo está completo (8/8)', async () => {
    const repo = crearMockRepository({
      contarEquiposAprobados: vi.fn(async () => 8),
    });
    const service = crearInscripcionesService(repo);

    await expect(service.aprobarInscripcion('insc-1', 'admin-99')).rejects.toThrowError(
      'El torneo ya completó su cupo (8/8)',
    );
  });

  it('Escenario 7: retira un equipo aprobado e indica motivo', async () => {
    const repo = crearMockRepository({
      buscarInscripcionPorId: vi.fn(async () => ({
        id: 'insc-aprobada',
        torneo_id: 'torneo-1',
        equipo_id: 'equipo-1',
        estado: 'APROBADO' as const,
        motivo: null,
        solicitada_por: 'user-cap',
        aprobada_por: 'admin-1',
        creada_en: '2026-10-10',
        actualizada_en: '2026-10-10',
      })),
    });
    const service = crearInscripcionesService(repo);

    await service.retirarInscripcion(
      'insc-aprobada',
      'admin-99',
      'Sanción disciplinaria del club',
    );

    expect(repo.actualizarEstadoInscripcion).toHaveBeenCalledWith({
      id: 'insc-aprobada',
      estado: 'RETIRADO',
      motivo: 'Sanción disciplinaria del club',
      aprobadaPor: 'admin-99',
    });
  });

  it('Escenario 8: rechaza modificaciones si el torneo está en curso', async () => {
    const repo = crearMockRepository({
      buscarTorneoPorId: vi.fn(async () => ({
        id: 'torneo-1',
        nombre: 'Copa El Bosque',
        cupo: 8,
        estado: 'EN_CURSO' as const,
      })),
    });
    const service = crearInscripcionesService(repo);

    await expect(service.aprobarInscripcion('insc-1', 'admin-99')).rejects.toThrowError(
      'No se pueden modificar inscripciones cuando el torneo está en curso o finalizado',
    );
  });

  it('lanza 404 si el torneo o la inscripción no existen', async () => {
    const repoSinTorneo = crearMockRepository({
      buscarTorneoPorId: vi.fn(async () => null),
    });
    const service1 = crearInscripcionesService(repoSinTorneo);
    await expect(service1.obtenerBandeja('torneo-99')).rejects.toThrowError('Torneo no encontrado');

    const repoSinInscripcion = crearMockRepository({
      buscarInscripcionPorId: vi.fn(async () => null),
    });
    const service2 = crearInscripcionesService(repoSinInscripcion);
    await expect(service2.aprobarInscripcion('insc-99', 'admin')).rejects.toThrowError(
      'Solicitud de inscripción no encontrado',
    );
    await expect(service2.rechazarInscripcion('insc-99', 'admin', 'motivo valido')).rejects.toThrowError(
      'Solicitud de inscripción no encontrado',
    );
    await expect(service2.retirarInscripcion('insc-99', 'admin', 'motivo valido')).rejects.toThrowError(
      'Solicitud de inscripción no encontrado',
    );
  });

  it('lanza 409 si la solicitud no está en el estado requerido', async () => {
    const repoAprobada = crearMockRepository({
      buscarInscripcionPorId: vi.fn(async () => ({
        id: 'insc-1',
        torneo_id: 't-1',
        equipo_id: 'eq-1',
        estado: 'APROBADO' as const,
        motivo: null,
        solicitada_por: null,
        aprobada_por: null,
        creada_en: '2026-10-10',
        actualizada_en: '2026-10-10',
      })),
    });
    const service = crearInscripcionesService(repoAprobada);

    await expect(service.aprobarInscripcion('insc-1', 'admin')).rejects.toThrowError(
      'Solo se pueden aprobar solicitudes en estado Pendiente',
    );
    await expect(service.rechazarInscripcion('insc-1', 'admin', 'motivo valido')).rejects.toThrowError(
      'Solo se pueden rechazar solicitudes en estado Pendiente',
    );

    const repoPendiente = crearMockRepository({
      buscarInscripcionPorId: vi.fn(async () => ({
        id: 'insc-1',
        torneo_id: 't-1',
        equipo_id: 'eq-1',
        estado: 'PENDIENTE' as const,
        motivo: null,
        solicitada_por: null,
        aprobada_por: null,
        creada_en: '2026-10-10',
        actualizada_en: '2026-10-10',
      })),
    });
    const service2 = crearInscripcionesService(repoPendiente);
    await expect(service2.retirarInscripcion('insc-1', 'admin', 'motivo valido')).rejects.toThrowError(
      'Solo se pueden retirar solicitudes en estado Aprobado',
    );
  });

  it('buscarEquiposDisponibles consulta el repositorio', async () => {
    const repo = crearMockRepository({
      listarEquiposDisponibles: vi.fn(async () => [
        { id: 'eq-1', nombre: 'Águilas', color: null, capitanNombre: 'Carlos', cantidadJugadores: 12 },
      ]),
    });
    const service = crearInscripcionesService(repo);

    const disponibles = await service.buscarEquiposDisponibles('torneo-1', 'Águilas');
    expect(disponibles).toHaveLength(1);
    expect(disponibles[0]?.nombre).toBe('Águilas');
  });
});
