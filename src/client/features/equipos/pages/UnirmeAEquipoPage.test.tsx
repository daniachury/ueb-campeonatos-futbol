// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { respuestaJson } from '../../../test/fetch-falso';
import { UnirmeAEquipoPage } from './UnirmeAEquipoPage';

vi.mock('../../../common/sesion/ProveedorDeSesion', () => ({
  useSesion: () => ({
    usuarioActual: { id: 'usr-2', nombreCompleto: 'Andrés Jugador', correo: 'andres@unbosque.edu.co', rol: 'jugador' },
    estaComprobando: false,
  }),
}));

describe('UnirmeAEquipoPage (KAN-27)', () => {
  it('muestra la lista de equipos disponibles y permite unirse', async () => {
    const fetchFalso = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const u = String(url);
      if (u.includes('/api/equipos/disponibles')) {
        return respuestaJson({
          datos: [
            { id: 'eq-1', nombre: 'Los Halcones', color: 'Azul', cantidadIntegrantes: 10 },
          ],
        });
      }
      if (u.includes('/api/equipos/eq-1/integrantes') && init?.method === 'POST') {
        return respuestaJson({ datos: { equipoId: 'eq-1', usuarioId: 'usr-2' } }, 201);
      }
      return respuestaJson({}, 404);
    });

    vi.stubGlobal('fetch', fetchFalso);

    render(
      <MemoryRouter initialEntries={['/mis-equipos/unirme']}>
        <Routes>
          <Route path="/mis-equipos/unirme" element={<UnirmeAEquipoPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Unirme a un equipo' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Los Halcones' })).toBeInTheDocument();
    expect(screen.getByText('10 integrantes')).toBeInTheDocument();

    const btnUnirme = screen.getByRole('button', { name: 'Unirme' });
    fireEvent.click(btnUnirme);

    // Al unirse, desaparece de disponibles
    await screen.findByText('No hay equipos disponibles.');
  });

  it('permite enviar una solicitud de ingreso al capitán del equipo', async () => {
    let solicitudEnviada = false;
    const fetchFalso = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const u = String(url);
      if (u.includes('/api/equipos/disponibles')) {
        return respuestaJson({
          datos: [
            { id: 'eq-1', nombre: 'Los Halcones', color: 'Azul', cantidadIntegrantes: 10 },
          ],
        });
      }
      if (u.includes('/api/equipos/eq-1/solicitudes') && init?.method === 'POST') {
        solicitudEnviada = true;
        return respuestaJson({ datos: { id: 'sol-1', estado: 'PENDIENTE' } }, 201);
      }
      return respuestaJson({}, 404);
    });

    vi.stubGlobal('fetch', fetchFalso);

    render(
      <MemoryRouter initialEntries={['/mis-equipos/unirme']}>
        <Routes>
          <Route path="/mis-equipos/unirme" element={<UnirmeAEquipoPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: 'Los Halcones' });

    const btnSolicitar = screen.getByRole('button', { name: 'Solicitar ingreso' });
    fireEvent.click(btnSolicitar);

    expect(
      await screen.findByText(/¡Solicitud de ingreso enviada al capitán de Los Halcones!/i),
    ).toBeInTheDocument();
    expect(solicitudEnviada).toBe(true);
    expect(screen.getByText('Solicitud enviada')).toBeInTheDocument();
  });
});

