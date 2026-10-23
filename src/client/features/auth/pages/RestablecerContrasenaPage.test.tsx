// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../../common/api/client';
import { RUTAS } from '../../../common/navegacion';
import * as authApi from '../api';
import { RestablecerContrasenaPage } from './RestablecerContrasenaPage';

vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal<typeof authApi>();
  return {
    ...actual,
    validarTokenRecuperacion: vi.fn(),
    restablecerContrasena: vi.fn(),
  };
});

function renderizarPagina(rutaInicial = `${RUTAS.RESTABLECER_CONTRASENA}?token=tok-valido-123`) {
  return render(
    <MemoryRouter initialEntries={[rutaInicial]}>
      <Routes>
        <Route
          path={RUTAS.RESTABLECER_CONTRASENA}
          element={<RestablecerContrasenaPage />}
        />
        <Route
          path={RUTAS.RECUPERAR_CUENTA}
          element={<div>Pantalla Recuperar Cuenta</div>}
        />
        <Route path={RUTAS.INICIAR_SESION} element={<div>Pantalla Iniciar Sesion</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RestablecerContrasenaPage (KAN-50)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra aviso de token inválido si no se proporciona token en la URL (Escenario 6)', async () => {
    renderizarPagina(RUTAS.RESTABLECER_CONTRASENA);

    await waitFor(() => {
      expect(
        screen.getByText(
          'El enlace de recuperación es inválido o ha expirado. Genera uno nuevo.',
        ),
      ).toBeInTheDocument();
    });

    const botonNuevo = screen.getByRole('button', { name: 'Solicitar nuevo enlace' });
    expect(botonNuevo).toBeInTheDocument();
    fireEvent.click(botonNuevo);
    expect(screen.getByText('Pantalla Recuperar Cuenta')).toBeInTheDocument();
  });

  it('muestra aviso si el token expiró o ya fue usado (Escenario 6)', async () => {
    vi.mocked(authApi.validarTokenRecuperacion).mockRejectedValueOnce(
      new ApiError(400, 'TOKEN_INVALIDO_O_EXPIRADO', 'Token inválido'),
    );

    renderizarPagina();

    await waitFor(() => {
      expect(
        screen.getByText(
          'El enlace de recuperación es inválido o ha expirado. Genera uno nuevo.',
        ),
      ).toBeInTheDocument();
    });
  });

  it('valida contraseña con menos de 8 caracteres o sin letras/números (Escenario 3)', async () => {
    vi.mocked(authApi.validarTokenRecuperacion).mockResolvedValueOnce({ valido: true });

    renderizarPagina();

    await waitFor(() => {
      expect(screen.getByLabelText(/^Nueva contraseña/i)).toBeInTheDocument();
    });

    const campoNueva = screen.getByLabelText(/^Nueva contraseña/i);
    const campoConfirmar = screen.getByLabelText(/Confirmar contraseña/i);

    // Contraseña muy corta (5 caracteres)
    fireEvent.change(campoNueva, { target: { value: 'Bosq1' } });
    fireEvent.change(campoConfirmar, { target: { value: 'Bosq1' } });
    fireEvent.blur(campoNueva);

    expect(
      screen.getByText(
        'La contraseña debe tener mínimo 8 caracteres, con letras y números',
      ),
    ).toBeInTheDocument();
  });

  it('valida que las contraseñas coincidan (Escenario 4)', async () => {
    vi.mocked(authApi.validarTokenRecuperacion).mockResolvedValueOnce({ valido: true });

    renderizarPagina();

    await waitFor(() => {
      expect(screen.getByLabelText(/^Nueva contraseña/i)).toBeInTheDocument();
    });

    const campoNueva = screen.getByLabelText(/^Nueva contraseña/i);
    const campoConfirmar = screen.getByLabelText(/Confirmar contraseña/i);

    fireEvent.change(campoNueva, { target: { value: 'Bosque2026' } });
    fireEvent.change(campoConfirmar, { target: { value: 'Bosque2027' } });
    fireEvent.blur(campoConfirmar);

    expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
  });

  it('restablece exitosamente con contraseña alfanumérica válida (Escenario 5)', async () => {
    vi.mocked(authApi.validarTokenRecuperacion).mockResolvedValueOnce({ valido: true });
    vi.mocked(authApi.restablecerContrasena).mockResolvedValueOnce({
      mensaje: 'Contraseña restablecida con éxito',
    });

    renderizarPagina();

    await waitFor(() => {
      expect(screen.getByLabelText(/^Nueva contraseña/i)).toBeInTheDocument();
    });

    const campoNueva = screen.getByLabelText(/^Nueva contraseña/i);
    const campoConfirmar = screen.getByLabelText(/Confirmar contraseña/i);
    const botonGuardar = screen.getByRole('button', {
      name: 'Guardar nueva contraseña',
    });

    fireEvent.change(campoNueva, { target: { value: 'Bosque2026' } });
    fireEvent.change(campoConfirmar, { target: { value: 'Bosque2026' } });
    fireEvent.click(botonGuardar);

    await waitFor(() => {
      expect(
        screen.getByText('Contraseña restablecida con éxito'),
      ).toBeInTheDocument();
    });

    expect(authApi.restablecerContrasena).toHaveBeenCalledWith({
      token: 'tok-valido-123',
      nuevaContrasena: 'Bosque2026',
      confirmarContrasena: 'Bosque2026',
    });

    const botonIniciar = screen.getByRole('button', { name: 'Iniciar sesión' });
    fireEvent.click(botonIniciar);
    expect(screen.getByText('Pantalla Iniciar Sesion')).toBeInTheDocument();
  });
});
