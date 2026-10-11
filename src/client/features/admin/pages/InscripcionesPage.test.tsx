// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { UsuarioAutenticado } from '@shared/usuarios/contrato-inicio-de-sesion';
import type { BandejaInscripcionesResponse } from '@shared/inscripciones/contrato-inscripciones';
import { respuestaJson } from '../../../test/fetch-falso';
import { renderizarAppEn } from '../../../test/renderizar-app';

const ADMIN_DE_PRUEBA: UsuarioAutenticado = {
  id: 'admin-001',
  nombreCompleto: 'Edwar Alméciga',
  correo: 'ealmmeciga@unbosque.edu.co',
  telefono: '3101234567',
  rol: 'admin',
};

const BANDEJA_EJEMPLO: BandejaInscripcionesResponse = {
  torneo: {
    id: 'torneo-1',
    nombre: 'Copa El Bosque 2026',
    cupo: 8,
    estado: 'INSCRIPCIONES_ABIERTAS',
    equiposAprobados: 5,
  },
  pendientes: [
    {
      id: 'ins-1',
      torneoId: 'torneo-1',
      equipoId: 'eq-1',
      equipoNombre: 'Los Halcones',
      equipoColor: '#0055ff',
      capitanNombre: 'Carlos Pérez',
      cantidadJugadores: 14,
      estado: 'PENDIENTE',
      fechaSolicitud: '2026-10-10T10:00:00.000Z',
      motivo: null,
      aprobadoPor: null,
      fechaResolucion: null,
    },
  ],
  aprobados: [
    {
      id: 'ins-2',
      torneoId: 'torneo-1',
      equipoId: 'eq-2',
      equipoNombre: 'Real Bosque',
      equipoColor: '#00aa33',
      capitanNombre: 'Sofia Gómez',
      cantidadJugadores: 16,
      estado: 'APROBADO',
      fechaSolicitud: '2026-10-09T10:00:00.000Z',
      motivo: null,
      aprobadoPor: 'admin-001',
      fechaResolucion: '2026-10-09T12:00:00.000Z',
    },
  ],
  rechazados: [
    {
      id: 'ins-3',
      torneoId: 'torneo-1',
      equipoId: 'eq-3',
      equipoNombre: 'Tigres FC',
      equipoColor: '#ff8800',
      capitanNombre: 'Marcos Díaz',
      cantidadJugadores: 12,
      estado: 'RECHAZADO',
      fechaSolicitud: '2026-10-08T10:00:00.000Z',
      motivo: 'Plantilla incompleta al momento de la revisión.',
      aprobadoPor: 'admin-001',
      fechaResolucion: '2026-10-08T15:00:00.000Z',
    },
  ],
  contadorAprobados: '5/8',
  cupoCompleto: false,
  torneoEnCurso: false,
};

function renderizarInscripciones(respuestaBandeja = BANDEJA_EJEMPLO) {
  const fetchFalso = vi.fn<typeof fetch>(async (url, init) => {
    const ruta = String(url);
    if (ruta.includes('/equipos-disponibles')) {
      return respuestaJson({ datos: [] });
    }
    if (init?.method === 'POST') {
      return respuestaJson({ mensaje: 'ok' });
    }
    return respuestaJson(respuestaBandeja);
  });
  vi.stubGlobal('fetch', fetchFalso);

  const resultado = renderizarAppEn('/admin/torneos/torneo-1/inscripciones', {
    usuarioInicial: ADMIN_DE_PRUEBA,
  });

  return { fetchFalso, ...resultado };
}

describe('InscripcionesPage (v3 · A02)', () => {
  it('Escenario 1: Bandeja de solicitudes muestra pestañas, contadores y detalles de equipo', async () => {
    renderizarInscripciones();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Copa El Bosque 2026' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Aprobados 5/8')).toBeInTheDocument();

    // Pestañas
    expect(screen.getByRole('tab', { name: /Pendientes/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Aprobados/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Rechazados/i })).toBeInTheDocument();

    // Detalle de la solicitud pendiente
    expect(screen.getByRole('heading', { level: 2, name: 'Los Halcones' })).toBeInTheDocument();
    expect(screen.getByText(/Capitán: Carlos Pérez/i)).toBeInTheDocument();
    expect(screen.getByText(/14 jugadores/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aprobar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rechazar' })).toBeInTheDocument();
  });

  it('Escenario 2: Aprobar envía petición y muestra confirmación', async () => {
    const { fetchFalso } = renderizarInscripciones();

    const botonAprobar = await screen.findByRole('button', { name: 'Aprobar' });
    fireEvent.click(botonAprobar);

    expect(fetchFalso).toHaveBeenCalledWith(
      '/api/admin/inscripciones/ins-1/aprobar',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('Escenario 4: Rechazar abre modal, exige motivo y confirma', async () => {
    const { fetchFalso } = renderizarInscripciones();

    const botonRechazar = await screen.findByRole('button', { name: 'Rechazar' });
    fireEvent.click(botonRechazar);

    // Modal abierto
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Rechazar solicitud de inscripción' }),
    ).toBeInTheDocument();

    const botonConfirmar = screen.getByRole('button', { name: 'Rechazar solicitud' });
    expect(botonConfirmar).toBeDisabled();

    // Escribir motivo válido (>= 10 caracteres)
    const textarea = screen.getByPlaceholderText(/Escribe el motivo detallado/i);
    fireEvent.change(textarea, {
      target: { value: 'El equipo no presentó los documentos a tiempo.' },
    });

    expect(botonConfirmar).not.toBeDisabled();
    fireEvent.click(botonConfirmar);

    expect(fetchFalso).toHaveBeenCalledWith(
      '/api/admin/inscripciones/ins-1/rechazar',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ motivo: 'El equipo no presentó los documentos a tiempo.' }),
      }),
    );
  });

  it('Escenario 6: Cupo completo deshabilita el botón con texto "Cupo completo"', async () => {
    renderizarInscripciones({
      ...BANDEJA_EJEMPLO,
      contadorAprobados: '8/8',
      cupoCompleto: true,
    });

    const botones = await screen.findAllByRole('button', { name: 'Cupo completo' });
    expect(botones.length).toBeGreaterThanOrEqual(2);
    botones.forEach((boton) => expect(boton).toBeDisabled());
  });

  it('Escenario 7: En pestaña Aprobados permite retirar equipo indicando motivo', async () => {
    const { fetchFalso } = renderizarInscripciones();

    // Cambiar a pestaña Aprobados
    const pestanaAprobados = await screen.findByRole('tab', { name: /Aprobados/i });
    fireEvent.click(pestanaAprobados);

    expect(screen.getByRole('heading', { level: 2, name: 'Real Bosque' })).toBeInTheDocument();

    const botonRetirar = screen.getByRole('button', { name: 'Retirar' });
    fireEvent.click(botonRetirar);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Retirar equipo aprobado' })).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/Escribe el motivo detallado/i);
    fireEvent.change(textarea, {
      target: { value: 'Sanción disciplinaria que impide participación.' },
    });

    const botonConfirmar = screen.getByRole('button', { name: 'Retirar equipo' });
    fireEvent.click(botonConfirmar);

    expect(fetchFalso).toHaveBeenCalledWith(
      '/api/admin/inscripciones/ins-2/retirar',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ motivo: 'Sanción disciplinaria que impide participación.' }),
      }),
    );
  });

  it('Escenario 8: Torneo en curso muestra aviso y desactiva mutaciones', async () => {
    renderizarInscripciones({
      ...BANDEJA_EJEMPLO,
      torneoEnCurso: true,
      torneo: {
        ...BANDEJA_EJEMPLO.torneo,
        estado: 'EN_CURSO',
      },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(/El torneo se encuentra en curso/i);
    expect(screen.getByRole('button', { name: 'Aprobar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Rechazar' })).toBeDisabled();
  });

  it('muestra mensaje de error cuando la aprobación falla con conflicto 409', async () => {
    const fetchFalso = vi.fn<typeof fetch>(async (url, init) => {
      const ruta = String(url);
      if (ruta.includes('/equipos-disponibles')) return respuestaJson({ datos: [] });
      if (init?.method === 'POST') {
        return respuestaJson(
          {
            codigo: 'JUGADORES_EN_CONFLICTO',
            mensaje: 'Jugadores en conflicto: Carlos (Halcones)',
          },
          409,
        );
      }
      return respuestaJson(BANDEJA_EJEMPLO);
    });
    vi.stubGlobal('fetch', fetchFalso);

    renderizarAppEn('/admin/torneos/torneo-1/inscripciones', {
      usuarioInicial: ADMIN_DE_PRUEBA,
    });

    const botonAprobar = await screen.findByRole('button', { name: 'Aprobar' });
    fireEvent.click(botonAprobar);

    expect(await screen.findByText(/Jugadores en conflicto: Carlos/i)).toBeInTheDocument();
  });

  it('muestra estado vacío cuando una pestaña no tiene solicitudes', async () => {
    renderizarInscripciones({
      ...BANDEJA_EJEMPLO,
      pendientes: [],
    });

    expect(await screen.findByText(/No hay solicitudes en pendientes/i)).toBeInTheDocument();
  });

  it('permite inscribir directamente desde el panel y cambia a la pestaña aprobados', async () => {
    const fetchFalso = vi.fn<typeof fetch>(async (url, init) => {
      const ruta = String(url);
      if (ruta.includes('/equipos-disponibles')) {
        return respuestaJson({
          datos: [
            {
              id: 'eq-10',
              nombre: 'Águilas Doradas',
              color: null,
              capitanNombre: 'Carlos',
              cantidadJugadores: 15,
            },
          ],
        });
      }
      if (init?.method === 'POST') {
        return respuestaJson({ id: 'ins-nueva', mensaje: 'ok' });
      }
      return respuestaJson(BANDEJA_EJEMPLO);
    });
    vi.stubGlobal('fetch', fetchFalso);

    renderizarAppEn('/admin/torneos/torneo-1/inscripciones', {
      usuarioInicial: ADMIN_DE_PRUEBA,
    });

    expect(await screen.findByText('Águilas Doradas')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Águilas Doradas'));

    const botonInscribir = screen.getByRole('button', { name: 'Inscribir equipo seleccionado' });
    fireEvent.click(botonInscribir);

    expect(await screen.findByText('Equipo inscrito directamente con éxito.')).toBeInTheDocument();
  });

  it('muestra mensaje de error si la carga inicial falla', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        respuestaJson({ codigo: 'ERROR_INTERNO', mensaje: 'Fallo al conectar' }, 500),
      ),
    );

    renderizarAppEn('/admin/torneos/torneo-1/inscripciones', {
      usuarioInicial: ADMIN_DE_PRUEBA,
    });

    expect(await screen.findByText(/Fallo al conectar/i)).toBeInTheDocument();
  });

  it('redirige si el usuario no tiene rol admin', () => {
    const JUGADOR: UsuarioAutenticado = {
      id: 'jug-1',
      nombreCompleto: 'Juan Jugador',
      correo: 'jugador@unbosque.edu.co',
      telefono: '3109999999',
      rol: 'jugador',
    };

    renderizarAppEn('/admin/torneos/torneo-1/inscripciones', {
      usuarioInicial: JUGADOR,
    });

    // Como jugador, la ruta redirige a la pantalla de inicio del jugador (no muestra la cabecera de inscripciones)
    expect(
      screen.queryByRole('heading', { level: 1, name: 'Copa El Bosque 2026' }),
    ).not.toBeInTheDocument();
  });

  it('KAN-33: muestra el Panel de Sorteo con estimación y permite confirmar el sorteo', async () => {
    const bandejaCon3Aprobados: BandejaInscripcionesResponse = {
      ...BANDEJA_EJEMPLO,
      aprobados: [
        { ...BANDEJA_EJEMPLO.aprobados[0], id: 'ins-2' },
        { ...BANDEJA_EJEMPLO.aprobados[0], id: 'ins-3', equipoId: 'eq-3', equipoNombre: 'Tigres' },
        { ...BANDEJA_EJEMPLO.aprobados[0], id: 'ins-4', equipoId: 'eq-4', equipoNombre: 'Leones' },
      ],
    };
    const { fetchFalso } = renderizarInscripciones(bandejaCon3Aprobados);

    // El panel de sorteo debe estar en pantalla con el botón
    expect(await screen.findByTestId('panel-sorteo')).toBeInTheDocument();
    const botonSortear = screen.getByRole('button', { name: /Cerrar inscripciones y sortear/i });
    expect(botonSortear).toBeInTheDocument();
    expect(botonSortear).not.toBeDisabled();

    fireEvent.click(botonSortear);

    // Modal de confirmación abierto
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('1 solicitud pendiente')).toBeInTheDocument();

    const botonConfirmar = screen.getByRole('button', { name: /Confirmar y sortear/i });
    fireEvent.click(botonConfirmar);

    await screen.findByRole('dialog'); // sigue abierto o cerrando
    await vi.waitFor(() => {
      expect(fetchFalso).toHaveBeenCalledWith(
        '/api/admin/sorteo/torneos/torneo-1',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });
});
