// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { respuestaJson } from '../../../test/fetch-falso';
import { CrearEquipoPage } from './CrearEquipoPage';

vi.mock('../../../common/sesion/ProveedorDeSesion', () => ({
  useSesion: () => ({
    usuarioActual: { id: 'usr-1', nombreCompleto: 'Carlos Jugador', correo: 'carlos@unbosque.edu.co', rol: 'jugador' },
    estaComprobando: false,
  }),
}));

describe('CrearEquipoPage (KAN-24)', () => {
  it('renderiza el formulario de creación de equipo', () => {
    render(
      <MemoryRouter initialEntries={['/equipos/nuevo']}>
        <Routes>
          <Route path="/equipos/nuevo" element={<CrearEquipoPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Crear equipo' })).toBeInTheDocument();
    expect(screen.getByText('Serás el capitán de este equipo.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Color/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear equipo' })).toBeInTheDocument();
  });

  it('muestra mensaje de error cuando la API rechaza el nombre duplicado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        respuestaJson(
          { codigo: 'NOMBRE_EQUIPO_DUPLICADO', mensaje: 'Ya existe un equipo con ese nombre' },
          409,
        ),
      ),
    );

    render(
      <MemoryRouter initialEntries={['/equipos/nuevo']}>
        <Routes>
          <Route path="/equipos/nuevo" element={<CrearEquipoPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Los Halcones' } });
    fireEvent.change(screen.getByLabelText(/Color/i), { target: { value: 'Azul' } });

    fireEvent.click(screen.getByRole('button', { name: 'Crear equipo' }));

    expect(
      await screen.findByText('Ya existe un equipo con ese nombre'),
    ).toBeInTheDocument();
  });
});
