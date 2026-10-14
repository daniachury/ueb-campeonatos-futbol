// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { respuestaJson } from '../../../test/fetch-falso';
import { MisEquiposPage } from './MisEquiposPage';

vi.mock('../../../common/sesion/ProveedorDeSesion', () => ({
  useSesion: () => ({
    usuarioActual: { id: 'usr-1', nombreCompleto: 'Carlos Capitán', correo: 'carlos@unbosque.edu.co', rol: 'jugador' },
    estaComprobando: false,
  }),
}));

describe('MisEquiposPage (KAN-24, KAN-29)', () => {
  it('renderiza el listado de mis equipos', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        respuestaJson({
          datos: [{ id: 'eq-1', nombre: 'Los Halcones', color: 'Azul' }],
        }),
      ),
    );

    render(
      <MemoryRouter initialEntries={['/mis-equipos']}>
        <Routes>
          <Route path="/mis-equipos" element={<MisEquiposPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Mis equipos' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Los Halcones' })).toBeInTheDocument();
    expect(screen.getByText(/Capitán · Carlos Capitán/i)).toBeInTheDocument();
  });

  it('permite salir de un equipo tras confirmar (KAN-29)', async () => {
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
    window.confirm = () => true;

    const fetchFalso = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const u = String(url);
      if (u.includes('/api/equipos/eq-1/integrantes') && init?.method === 'DELETE') {
        return new Response(null, { status: 204 });
      }
      if (u.includes('/api/equipos')) {
        return respuestaJson({
          datos: [{ id: 'eq-1', nombre: 'Los Halcones', color: 'Azul' }],
        });
      }
      return respuestaJson({}, 404);
    });

    vi.stubGlobal('fetch', fetchFalso);

    render(
      <MemoryRouter initialEntries={['/mis-equipos']}>
        <Routes>
          <Route path="/mis-equipos" element={<MisEquiposPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: 'Los Halcones' });

    const btnSalir = screen.getByRole('button', { name: 'Salir' });
    fireEvent.click(btnSalir);

    // Al salir, la lista queda vacía
    expect(
      await screen.findByRole('heading', { name: 'Aún no tienes equipos' }, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  it('el capitán abre la gestión del equipo, agrega un jugador y aprueba una solicitud', async () => {
    const fetchFalso = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const u = String(url);
      if (u.includes('/api/equipos/eq-1/integrantes')) {
        return respuestaJson({
          datos: [
            { id: 'usr-1', nombreCompleto: 'Carlos Capitán', correo: 'carlos@unbosque.edu.co' },
          ],
        });
      }
      if (u.includes('/api/equipos/eq-1/solicitudes/sol-1/aprobar') && init?.method === 'POST') {
        return respuestaJson({ datos: { ok: true } });
      }
      if (u.includes('/api/equipos/eq-1/solicitudes')) {
        return respuestaJson({
          datos: [
            {
              id: 'sol-1',
              equipoId: 'eq-1',
              usuarioId: 'usr-aspirante',
              nombreCompleto: 'Mateo Aspirante',
              correo: 'mateo@mail.com',
              estado: 'PENDIENTE',
              creadaEn: '2026-10-14',
            },
          ],
        });
      }
      if (u.includes('/api/equipos/eq-1/jugadores') && init?.method === 'POST') {
        return respuestaJson(
          {
            datos: { id: 'usr-nuevo', nombreCompleto: 'Nuevo Crack', correo: 'crack@mail.com' },
          },
          201,
        );
      }
      if (u.includes('/api/equipos')) {
        return respuestaJson({
          datos: [{ id: 'eq-1', nombre: 'Los Halcones', color: 'Azul', capitanId: 'usr-1' }],
        });
      }
      return respuestaJson({}, 404);
    });

    vi.stubGlobal('fetch', fetchFalso);

    render(
      <MemoryRouter initialEntries={['/mis-equipos']}>
        <Routes>
          <Route path="/mis-equipos" element={<MisEquiposPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: 'Los Halcones' });

    // 1. Abrir modal de gestión
    const btnEditar = screen.getByRole('button', { name: 'Editar' });
    fireEvent.click(btnEditar);

    // Debe mostrar el modal y la sección de creación de jugadores exclusiva del capitán
    expect(await screen.findByText('Crear o agregar jugador a la plantilla')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'Los Halcones' })).toHaveLength(2);

    // 2. Agregar jugador a la plantilla
    fireEvent.change(screen.getByPlaceholderText('Ej: Mateo Cárdenas'), {
      target: { value: 'Nuevo Crack' },
    });
    fireEvent.change(screen.getByPlaceholderText('mateo.cardenas@unbosque.edu.co'), {
      target: { value: 'crack@mail.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: '+ Crear jugador' }));

    expect(await screen.findByText('¡Jugador Nuevo Crack agregado con éxito!')).toBeInTheDocument();

    // 3. Cambiar a la pestaña de solicitudes
    const btnPestanaSol = screen.getByRole('button', { name: /Solicitudes/i });
    fireEvent.click(btnPestanaSol);

    expect(await screen.findByText('Mateo Aspirante')).toBeInTheDocument();
    const btnAprobar = screen.getByRole('button', { name: 'Aprobar' });
    fireEvent.click(btnAprobar);

    expect(await screen.findByText('Solicitud de Mateo Aspirante aprobada.')).toBeInTheDocument();
  });
});

