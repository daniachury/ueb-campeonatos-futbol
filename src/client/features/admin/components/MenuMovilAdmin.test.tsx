// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ADMIN_DE_PRUEBA } from '../../../test/renderizar-app';
import { MenuMovilAdmin } from './MenuMovilAdmin';

describe('MenuMovilAdmin (KAN-43 · Menú móvil administrador Neón)', () => {
  it('muestra datos del administrador, insignia y todas las opciones de navegación', () => {
    const alCerrar = vi.fn();
    const alCerrarSesion = vi.fn();

    render(
      <MemoryRouter>
        <MenuMovilAdmin
          usuario={ADMIN_DE_PRUEBA}
          alCerrar={alCerrar}
          alCerrarSesion={alCerrarSesion}
        />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('menu-movil-admin')).toBeInTheDocument();
    expect(screen.getByText('Laura Administradora')).toBeInTheDocument();
    expect(screen.getByText('admin@unbosque.edu.co')).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /torneos/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sedes y canchas/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /registrar administrador/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /mi perfil/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument();
  });

  it('llama alCerrar al pulsar el botón de cerrar menú o presionar Escape', () => {
    const alCerrar = vi.fn();
    const alCerrarSesion = vi.fn();

    render(
      <MemoryRouter>
        <MenuMovilAdmin
          usuario={ADMIN_DE_PRUEBA}
          alCerrar={alCerrar}
          alCerrarSesion={alCerrarSesion}
        />
      </MemoryRouter>,
    );

    const botonCerrar = screen.getByRole('button', { name: /cerrar menú/i });
    fireEvent.click(botonCerrar);
    expect(alCerrar).toHaveBeenCalledTimes(1);

    const menu = screen.getByTestId('menu-movil-admin');
    fireEvent.keyDown(menu, { key: 'Escape' });
    expect(alCerrar).toHaveBeenCalledTimes(2);
  });

  it('llama alCerrarSesion al pulsar el botón de salir', () => {
    const alCerrar = vi.fn();
    const alCerrarSesion = vi.fn();

    render(
      <MemoryRouter>
        <MenuMovilAdmin
          usuario={ADMIN_DE_PRUEBA}
          alCerrar={alCerrar}
          alCerrarSesion={alCerrarSesion}
        />
      </MemoryRouter>,
    );

    const botonSalir = screen.getByRole('button', { name: /cerrar sesión/i });
    fireEvent.click(botonSalir);
    expect(alCerrarSesion).toHaveBeenCalledTimes(1);
  });

  it('llama alCerrar al hacer clic en un enlace de navegación', () => {
    const alCerrar = vi.fn();
    const alCerrarSesion = vi.fn();

    render(
      <MemoryRouter>
        <MenuMovilAdmin
          usuario={ADMIN_DE_PRUEBA}
          alCerrar={alCerrar}
          alCerrarSesion={alCerrarSesion}
        />
      </MemoryRouter>,
    );

    const enlacePerfil = screen.getByRole('link', { name: /mi perfil/i });
    fireEvent.click(enlacePerfil);
    expect(alCerrar).toHaveBeenCalledTimes(1);
  });
});
