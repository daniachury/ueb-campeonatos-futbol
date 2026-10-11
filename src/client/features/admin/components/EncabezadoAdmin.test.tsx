// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ADMIN_DE_PRUEBA, renderizarAppEn } from '../../../test/renderizar-app';

describe('EncabezadoAdmin (KAN-19 · Navegación Admin)', () => {
  it('muestra todas las opciones de navegación del administrador y la insignia', () => {
    renderizarAppEn('/admin/torneos', { usuarioInicial: ADMIN_DE_PRUEBA });

    expect(screen.getByTestId('encabezado-admin')).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /torneos/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sedes y canchas/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /registrar admin/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /mi perfil/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument();
  });

  it('permite navegar a "Mi perfil" desde el encabezado del administrador', () => {
    renderizarAppEn('/admin/torneos', { usuarioInicial: ADMIN_DE_PRUEBA });

    const enlacePerfil = screen.getByRole('link', { name: /mi perfil/i });
    expect(enlacePerfil).toHaveAttribute('href', '/mi-perfil');
  });

  it('permite cerrar sesión al pulsar el botón correspondiente', async () => {
    const cerrarSesionMock = vi.fn().mockResolvedValue(undefined);
    const { servicioDeSesion } = renderizarAppEn('/admin/torneos', {
      usuarioInicial: ADMIN_DE_PRUEBA,
      servicioDeSesion: {
        consultarSesionActual: vi.fn().mockResolvedValue({ estado: 'con-sesion', usuario: ADMIN_DE_PRUEBA }),
        iniciarSesion: vi.fn(),
        cerrarSesion: cerrarSesionMock,
      },
    });

    const botonCerrar = screen.getByRole('button', { name: /cerrar sesión/i });
    fireEvent.click(botonCerrar);

    expect(servicioDeSesion.cerrarSesion).toHaveBeenCalledTimes(1);
  });

  it('abre el menú móvil tipo hamburguesa Neón al pulsar el botón de menú', () => {
    renderizarAppEn('/admin/torneos', { usuarioInicial: ADMIN_DE_PRUEBA });

    const botonHamburguesa = screen.getByRole('button', { name: /abrir menú de administrador/i });
    expect(botonHamburguesa).toBeInTheDocument();

    fireEvent.click(botonHamburguesa);

    expect(screen.getByTestId('menu-movil-admin')).toBeInTheDocument();
  });
});
