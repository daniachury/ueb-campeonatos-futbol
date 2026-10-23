// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../../common/api/client';
import { RUTAS } from '../../../common/navegacion';
import * as authApi from '../api';
import { RecuperarCuentaPage } from './RecuperarCuentaPage';

vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal<typeof authApi>();
  return {
    ...actual,
    solicitarRecuperacionCuenta: vi.fn(),
  };
});

function renderizarPagina() {
  return render(
    <MemoryRouter initialEntries={[RUTAS.RECUPERAR_CUENTA]}>
      <Routes>
        <Route path={RUTAS.RECUPERAR_CUENTA} element={<RecuperarCuentaPage />} />
        <Route
          path={RUTAS.RESTABLECER_CONTRASENA}
          element={<div>Pantalla Restablecer Contraseña</div>}
        />
        <Route path={RUTAS.INICIAR_SESION} element={<div>Pantalla Iniciar Sesion</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RecuperarCuentaPage (KAN-50)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el formulario de recuperación con título y campo de correo', () => {
    renderizarPagina();
    expect(screen.getByRole('heading', { name: 'Recuperar cuenta' })).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Correo institucional o registrado/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Recuperar cuenta/i }),
    ).toBeInTheDocument();
  });

  it('valida formato de correo inválido', () => {
    renderizarPagina();
    const campoCorreo = screen.getByLabelText(/Correo institucional o registrado/i);

    fireEvent.change(campoCorreo, { target: { value: 'invalido' } });
    fireEvent.blur(campoCorreo);

    expect(screen.getByText('Ingresa un correo válido')).toBeInTheDocument();
  });

  it('genera enlace y muestra botón de redirección directa al ingresar correo válido (Escenario 1)', async () => {
    vi.mocked(authApi.solicitarRecuperacionCuenta).mockResolvedValueOnce({
      mensaje: 'Enlace generado con éxito',
      token: 'tok-abc-123',
      enlace: '/restablecer-contrasena?token=tok-abc-123',
    });

    renderizarPagina();
    const campoCorreo = screen.getByLabelText(/Correo institucional o registrado/i);
    const botonEnviar = screen.getByRole('button', { name: /Recuperar cuenta/i });

    fireEvent.change(campoCorreo, { target: { value: 'capitan@unbosque.edu.co' } });
    fireEvent.click(botonEnviar);

    await waitFor(() => {
      expect(
        screen.getByText('¡Enlace de recuperación generado con éxito!'),
      ).toBeInTheDocument();
    });

    expect(authApi.solicitarRecuperacionCuenta).toHaveBeenCalledWith(
      'capitan@unbosque.edu.co',
    );

    const botonRestablecer = screen.getByRole('button', {
      name: 'Ir a restablecer contraseña',
    });
    expect(botonRestablecer).toBeInTheDocument();

    fireEvent.click(botonRestablecer);
    expect(screen.getByText('Pantalla Restablecer Contraseña')).toBeInTheDocument();
  });

  it('muestra error 404 si el correo no existe o no tiene rol habilitado (Escenario 2)', async () => {
    vi.mocked(authApi.solicitarRecuperacionCuenta).mockRejectedValueOnce(
      new ApiError(404, 'CORREO_NO_ENCONTRADO', 'No encontrado'),
    );

    renderizarPagina();
    const campoCorreo = screen.getByLabelText(/Correo institucional o registrado/i);
    const botonEnviar = screen.getByRole('button', { name: /Recuperar cuenta/i });

    fireEvent.change(campoCorreo, { target: { value: 'nadie@unbosque.edu.co' } });
    fireEvent.click(botonEnviar);

    await waitFor(() => {
      expect(
        screen.getByText(
          'No se encontró una cuenta de jugador, capitán o administrador asociada a este correo',
        ),
      ).toBeInTheDocument();
    });
  });
});
