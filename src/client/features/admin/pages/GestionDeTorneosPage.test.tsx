// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TorneoAdminResumen } from '@shared/torneos';
import type { UsuarioAutenticado } from '@shared/usuarios/contrato-inicio-de-sesion';
import { RUTAS } from '../../../common/navegacion';
import { respuestaJson } from '../../../test/fetch-falso';
import { renderizarAppEn } from '../../../test/renderizar-app';

const ADMIN_DE_PRUEBA: UsuarioAutenticado = {
  id: 'admin-001',
  nombreCompleto: 'Edwar Alméciga',
  correo: 'ealmmeciga@unbosque.edu.co',
  telefono: '3101234567',
  rol: 'admin',
};

const JUGADOR_DE_PRUEBA: UsuarioAutenticado = {
  id: 'jugador-001',
  nombreCompleto: 'Camilo Jugador',
  correo: 'camilo@mail.com',
  telefono: '3109999999',
  rol: 'jugador',
};

const TORNEOS_EJEMPLO: TorneoAdminResumen[] = [
  {
    id: 'torneo-1',
    nombre: 'Copa El Bosque 2026',
    descripcion: 'Torneo anual institucional',
    modalidad: 'FUTBOL_11',
    formato: 'LIGA',
    fechaInicio: '2026-11-20',
    cupo: 8,
    estado: 'BORRADOR',
    creadoEn: '2026-10-10T12:00:00Z',
  },
  {
    id: 'torneo-2',
    nombre: 'Liga Abierta 2026',
    descripcion: null,
    modalidad: 'FUTBOL_11',
    formato: 'LIGA',
    fechaInicio: '2026-12-01',
    cupo: 12,
    estado: 'INSCRIPCIONES_ABIERTAS',
    creadoEn: '2026-10-05T10:00:00Z',
  },
];

describe('GestionDeTorneosPage (KAN-20)', () => {
  it('renderiza el listado de torneos administrativos con sus badges y datos', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (info) => {
      const url = String(info);
      if (url.includes('/api/admin/torneos')) {
        return respuestaJson({ datos: TORNEOS_EJEMPLO });
      }
      return respuestaJson({}, 404);
    });

    renderizarAppEn(RUTAS.GESTION_DE_TORNEOS, { usuarioInicial: ADMIN_DE_PRUEBA });

    expect(await screen.findByRole('heading', { name: 'Gestión de torneos' })).toBeInTheDocument();
    expect(screen.getByText('Copa El Bosque 2026')).toBeInTheDocument();
    expect(screen.getByText('Liga Abierta 2026')).toBeInTheDocument();
    expect(screen.getByTestId('etiqueta-estado-torneo-1')).toHaveTextContent('Borrador');
    expect(screen.getByTestId('etiqueta-estado-torneo-2')).toHaveTextContent('Inscripciones abiertas');
    expect(screen.getByRole('button', { name: /abrir inscripciones/i })).toBeInTheDocument();
  });

  it('muestra estado vacío cuando no hay torneos', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (info) => {
      const url = String(info);
      if (url.includes('/api/admin/torneos')) {
        return respuestaJson({ datos: [] });
      }
      return respuestaJson({}, 404);
    });

    renderizarAppEn(RUTAS.GESTION_DE_TORNEOS, { usuarioInicial: ADMIN_DE_PRUEBA });

    expect(await screen.findByText('Aún no hay torneos registrados')).toBeInTheDocument();
  });

  it('permite abrir el modal de nuevo torneo y crearlo exitosamente', async () => {
    const nuevoTorneo: TorneoAdminResumen = {
      id: 'torneo-nuevo',
      nombre: 'Nuevo Torneo Creado',
      descripcion: 'Detalle del torneo',
      modalidad: 'FUTBOL_11',
      formato: 'LIGA',
      fechaInicio: '2026-12-15',
      cupo: 10,
      estado: 'BORRADOR',
      creadoEn: '2026-10-11T12:00:00Z',
    };

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (info, init) => {
      const url = String(info);
      if (url.endsWith('/api/admin/torneos') && init?.method === 'POST') {
        return respuestaJson({
          mensaje: 'Torneo creado exitosamente en estado borrador',
          torneo: nuevoTorneo,
        }, 201);
      }
      if (url.includes('/api/admin/torneos')) {
        return respuestaJson({ datos: TORNEOS_EJEMPLO });
      }
      return respuestaJson({}, 404);
    });

    renderizarAppEn(RUTAS.GESTION_DE_TORNEOS, { usuarioInicial: ADMIN_DE_PRUEBA });

    expect(await screen.findByText('Copa El Bosque 2026')).toBeInTheDocument();

    const btnNuevo = screen.getByRole('button', { name: /\+ nuevo torneo/i });
    fireEvent.click(btnNuevo);

    expect(screen.getByRole('heading', { name: /nuevo torneo/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/nombre del torneo/i), {
      target: { value: 'Nuevo Torneo Creado' },
    });

    const btnGuardar = screen.getByRole('button', { name: /guardar/i });
    fireEvent.click(btnGuardar);

    expect(await screen.findByText('Nuevo Torneo Creado')).toBeInTheDocument();
    expect(screen.getByText(/creado exitosamente en estado borrador/i)).toBeInTheDocument();
  });

  it('permite abrir inscripciones mediante el modal de confirmación', async () => {
    const torneoActualizado: TorneoAdminResumen = {
      ...TORNEOS_EJEMPLO[0]!,
      estado: 'INSCRIPCIONES_ABIERTAS',
    };

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (info, init) => {
      const url = String(info);
      if (url.includes('/abrir-inscripciones') && init?.method === 'POST') {
        return respuestaJson({
          mensaje: 'Inscripciones abiertas exitosamente',
          torneo: torneoActualizado,
        });
      }
      if (url.includes('/api/admin/torneos')) {
        return respuestaJson({ datos: TORNEOS_EJEMPLO });
      }
      return respuestaJson({}, 404);
    });

    renderizarAppEn(RUTAS.GESTION_DE_TORNEOS, { usuarioInicial: ADMIN_DE_PRUEBA });

    const btnAbrir = await screen.findByRole('button', { name: /abrir inscripciones/i });
    fireEvent.click(btnAbrir);

    expect(screen.getByRole('heading', { name: /abrir inscripciones/i })).toBeInTheDocument();
    expect(screen.getByText(/esta acción es/i)).toBeInTheDocument();

    const btnConfirmar = screen.getByRole('button', { name: /sí, abrir inscripciones/i });
    fireEvent.click(btnConfirmar);

    expect(await screen.findByText(/inscripciones abiertas exitosamente para/i)).toBeInTheDocument();
    expect(screen.getByTestId('etiqueta-estado-torneo-1')).toHaveTextContent('Inscripciones abiertas');
  });

  it('redirige si el usuario tiene rol jugador', () => {
    renderizarAppEn(RUTAS.GESTION_DE_TORNEOS, { usuarioInicial: JUGADOR_DE_PRUEBA });
    expect(screen.queryByRole('heading', { name: 'Gestión de torneos' })).not.toBeInTheDocument();
  });
});
