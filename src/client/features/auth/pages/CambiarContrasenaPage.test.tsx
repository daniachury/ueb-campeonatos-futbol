// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UsuarioAutenticado } from '@shared/usuarios/contrato-inicio-de-sesion';
import { ApiError } from '../../../common/api/client';
import { RUTAS } from '../../../common/navegacion';
import { ProveedorDeSesion } from '../../../common/sesion/ProveedorDeSesion';
import { crearServicioDeSesionFalso } from '../../../test/renderizar-app';
import * as adminApi from '../../admin/api';
import { CambiarContrasenaPage } from './CambiarContrasenaPage';

vi.mock('../../admin/api', () => ({
  cambiarContrasena: vi.fn(),
}));

const ADMIN_TEMP: UsuarioAutenticado = {
  id: 'admin-temp-1',
  nombreCompleto: 'Admin Temporal',
  correo: 'temporal@unbosque.edu.co',
  telefono: '3001234567',
  rol: 'admin',
  debeCambiarContrasena: true,
};

function renderizarPagina(usuario: UsuarioAutenticado | null = ADMIN_TEMP) {
  const servicioDeSesion = crearServicioDeSesionFalso();
  return render(
    <ProveedorDeSesion servicioDeSesion={servicioDeSesion} usuarioInicial={usuario}>
      <MemoryRouter initialEntries={[RUTAS.CAMBIAR_CONTRASENA]}>
        <Routes>
          <Route path={RUTAS.CAMBIAR_CONTRASENA} element={<CambiarContrasenaPage />} />
          <Route path={RUTAS.INICIAR_SESION} element={<div>Pantalla Iniciar Sesion</div>} />
          <Route path={RUTAS.PANEL_ADMIN} element={<div>Pantalla Panel Admin</div>} />
          <Route path={RUTAS.GESTION_DE_TORNEOS} element={<div>Pantalla Gestion Torneos</div>} />
        </Routes>
      </MemoryRouter>
    </ProveedorDeSesion>,
  );
}

describe('CambiarContrasenaPage (KAN-18 · Escenario 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirige a Iniciar sesión si no hay usuario', () => {
    renderizarPagina(null);
    expect(screen.getByText('Pantalla Iniciar Sesion')).toBeInTheDocument();
  });

  it('muestra el formulario de cambio de contraseña obligatoria', () => {
    renderizarPagina();
    expect(screen.getByRole('heading', { name: 'Cambia tu contraseña' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Contraseña actual/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Nueva contraseña/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirmar nueva contraseña/i)).toBeInTheDocument();
  });

  it('valida campos requeridos y discrepancias de contraseñas', async () => {
    renderizarPagina();

    fireEvent.change(screen.getByLabelText(/Contraseña actual/i), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/^Nueva contraseña/i), { target: { value: 'corta' } });
    fireEvent.change(screen.getByLabelText(/Confirmar nueva contraseña/i), {
      target: { value: 'otra' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Actualizar contraseña/i }));

    expect(await screen.findByText('Ingresa tu contraseña actual')).toBeInTheDocument();
    expect(
      screen.getByText('La contraseña debe tener mínimo 8 caracteres, con letras y números'),
    ).toBeInTheDocument();
    expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
    expect(adminApi.cambiarContrasena).not.toHaveBeenCalled();
  });

  it('valida que la nueva contraseña no sea igual a la actual', async () => {
    renderizarPagina();

    fireEvent.change(screen.getByLabelText(/Contraseña actual/i), {
      target: { value: 'MismaClave123' },
    });
    fireEvent.change(screen.getByLabelText(/^Nueva contraseña/i), {
      target: { value: 'MismaClave123' },
    });
    fireEvent.change(screen.getByLabelText(/Confirmar nueva contraseña/i), {
      target: { value: 'MismaClave123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Actualizar contraseña/i }));

    expect(
      await screen.findByText('La nueva contraseña debe ser diferente a la actual'),
    ).toBeInTheDocument();
    expect(adminApi.cambiarContrasena).not.toHaveBeenCalled();
  });

  it('actualiza la contraseña y redirige a Gestión de torneos', async () => {
    vi.mocked(adminApi.cambiarContrasena).mockResolvedValueOnce({ mensaje: 'ok' });

    renderizarPagina();

    fireEvent.change(screen.getByLabelText(/Contraseña actual/i), {
      target: { value: 'temporal123' },
    });
    fireEvent.change(screen.getByLabelText(/^Nueva contraseña/i), {
      target: { value: 'NuevaClave2026' },
    });
    fireEvent.change(screen.getByLabelText(/Confirmar nueva contraseña/i), {
      target: { value: 'NuevaClave2026' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Actualizar contraseña/i }));

    await waitFor(() => {
      expect(screen.getByText('Pantalla Panel Admin')).toBeInTheDocument();
    });
    expect(adminApi.cambiarContrasena).toHaveBeenCalledWith({
      contrasenaActual: 'temporal123',
      contrasenaNueva: 'NuevaClave2026',
    });
  });

  it('muestra mensaje de error si la API rechaza la contraseña actual', async () => {
    vi.mocked(adminApi.cambiarContrasena).mockRejectedValueOnce(
      new ApiError(401, 'CREDENCIALES_INCORRECTAS', 'La contraseña actual no es correcta'),
    );

    renderizarPagina();

    fireEvent.change(screen.getByLabelText(/Contraseña actual/i), {
      target: { value: 'temporalEquivocada' },
    });
    fireEvent.change(screen.getByLabelText(/^Nueva contraseña/i), {
      target: { value: 'NuevaClave2026' },
    });
    fireEvent.change(screen.getByLabelText(/Confirmar nueva contraseña/i), {
      target: { value: 'NuevaClave2026' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Actualizar contraseña/i }));

    expect(await screen.findByText('La contraseña actual no es correcta')).toBeInTheDocument();
  });

  it('permite cerrar sesión desde el encabezado', async () => {
    renderizarPagina();

    fireEvent.click(screen.getByRole('button', { name: /Cerrar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText('Pantalla Iniciar Sesion')).toBeInTheDocument();
    });
  });
});
