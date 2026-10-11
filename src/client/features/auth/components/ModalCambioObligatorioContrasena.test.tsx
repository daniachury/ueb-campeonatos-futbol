// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProveedorDeSesion } from '../../../common/sesion/ProveedorDeSesion';
import { ADMIN_DE_PRUEBA, crearServicioDeSesionFalso } from '../../../test/renderizar-app';
import * as adminApi from '../../admin/api';
import { ModalCambioObligatorioContrasena } from './ModalCambioObligatorioContrasena';

describe('ModalCambioObligatorioContrasena (KAN-43 · Modal de cambio obligatorio)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('no renderiza nada si isOpen es falso', () => {
    const servicioDeSesion = crearServicioDeSesionFalso();
    render(
      <ProveedorDeSesion servicioDeSesion={servicioDeSesion} usuarioInicial={ADMIN_DE_PRUEBA}>
        <MemoryRouter>
          <ModalCambioObligatorioContrasena isOpen={false} />
        </MemoryRouter>
      </ProveedorDeSesion>,
    );

    expect(screen.queryByTestId('modal-cambio-obligatorio-contrasena')).not.toBeInTheDocument();
  });

  it('valida campos obligatorios y formato de nueva contraseña', async () => {
    const servicioDeSesion = crearServicioDeSesionFalso();
    render(
      <ProveedorDeSesion servicioDeSesion={servicioDeSesion} usuarioInicial={ADMIN_DE_PRUEBA}>
        <MemoryRouter>
          <ModalCambioObligatorioContrasena isOpen={true} />
        </MemoryRouter>
      </ProveedorDeSesion>,
    );

    expect(screen.getByTestId('modal-cambio-obligatorio-contrasena')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /cambia tu contraseña/i })).toBeInTheDocument();

    const botonSubmit = screen.getByRole('button', { name: /actualizar contraseña/i });
    fireEvent.click(botonSubmit);

    expect(await screen.findByText('Ingresa tu contraseña actual')).toBeInTheDocument();
  });

  it('envía los datos correctos y llama onContrasenaCambiada al tener éxito', async () => {
    const onContrasenaCambiada = vi.fn();
    const cambiarSpy = vi
      .spyOn(adminApi, 'cambiarContrasena')
      .mockResolvedValue({ mensaje: 'Contraseña cambiada' });

    const servicioDeSesion = crearServicioDeSesionFalso();
    render(
      <ProveedorDeSesion
        servicioDeSesion={servicioDeSesion}
        usuarioInicial={{ ...ADMIN_DE_PRUEBA, debeCambiarContrasena: true }}
      >
        <MemoryRouter>
          <ModalCambioObligatorioContrasena
            isOpen={true}
            onContrasenaCambiada={onContrasenaCambiada}
          />
        </MemoryRouter>
      </ProveedorDeSesion>,
    );

    const campoActual = screen.getByLabelText(/contraseña actual/i);
    const campoNueva = screen.getByLabelText(/^nueva contraseña/i);
    const campoConfirmar = screen.getByLabelText(/confirmar nueva contraseña/i);

    fireEvent.change(campoActual, { target: { value: 'claveTemporal1' } });
    fireEvent.change(campoNueva, { target: { value: 'NuevaClave2026' } });
    fireEvent.change(campoConfirmar, { target: { value: 'NuevaClave2026' } });

    const botonSubmit = screen.getByRole('button', { name: /actualizar contraseña/i });
    fireEvent.click(botonSubmit);

    await waitFor(() => {
      expect(cambiarSpy).toHaveBeenCalledWith({
        contrasenaActual: 'claveTemporal1',
        contrasenaNueva: 'NuevaClave2026',
      });
      expect(onContrasenaCambiada).toHaveBeenCalledTimes(1);
    });
  });

  it('permite cerrar sesión desde el modal', async () => {
    const cerrarSesionSpy = vi.fn().mockResolvedValue(undefined);
    const servicioDeSesion = crearServicioDeSesionFalso({ cerrarSesion: cerrarSesionSpy });

    render(
      <ProveedorDeSesion
        servicioDeSesion={servicioDeSesion}
        usuarioInicial={{ ...ADMIN_DE_PRUEBA, debeCambiarContrasena: true }}
      >
        <MemoryRouter>
          <ModalCambioObligatorioContrasena isOpen={true} />
        </MemoryRouter>
      </ProveedorDeSesion>,
    );

    const botonCerrar = screen.getByRole('button', { name: /cerrar sesión/i });
    fireEvent.click(botonCerrar);

    expect(cerrarSesionSpy).toHaveBeenCalledTimes(1);
  });
});
