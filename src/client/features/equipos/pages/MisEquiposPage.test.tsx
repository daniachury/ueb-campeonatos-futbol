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
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    if (typeof globalThis.confirm === 'function') {
      vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
    }

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
});
