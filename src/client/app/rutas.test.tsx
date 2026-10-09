// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { simularFetch } from '../test/fetch-falso';
import { rutas } from './rutas';

function renderizarEn(ruta: string) {
  const router = createMemoryRouter(rutas, { initialEntries: [ruta] });
  render(<RouterProvider router={router} />);
  return router;
}

describe('rutas de la aplicación', () => {
  it('la raíz redirige a /torneos dentro del layout principal', async () => {
    simularFetch({ datos: [] });

    const router = renderizarEn('/');

    expect(await screen.findByRole('heading', { name: 'Torneos' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/torneos');
    expect(screen.getByRole('navigation', { name: 'Principal' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Torneos' })).toHaveClass('app__enlace--activo');
  });

  it('una dirección desconocida muestra la página 404', () => {
    renderizarEn('/esto-no-existe');

    expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver a los torneos' })).toHaveAttribute(
      'href',
      '/torneos',
    );
  });
});
