// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ADMIN_DE_PRUEBA, JUGADOR_DE_PRUEBA, renderizarAppEn } from '../../../test/renderizar-app';
import { respuestaJson } from '../../../test/fetch-falso';

describe('PanelAdminPage (/admin - Métricas reales)', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => respuestaJson([]));
  });

  it('muestra las métricas dinámicas obtenidas de la base de datos real', async () => {
    fetchMock.mockImplementationOnce(async () =>
      respuestaJson({
        torneos: 4,
        equipos: 5,
        partidos: 3,
        jugadores: 52,
        pendientes: 2,
      }),
    );

    await renderizarAppEn('/admin', { usuarioInicial: ADMIN_DE_PRUEBA });

    expect(screen.getByRole('heading', { name: 'Panel de administración' })).toBeInTheDocument();
    expect(screen.getByText(/Hola, Laura Administradora/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('Torneos creados')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Equipos registrados')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Partidos generados')).toBeInTheDocument();
      expect(screen.getByText('52')).toBeInTheDocument();
      expect(screen.getByText('Jugadores activos')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Solicitudes pendientes')).toBeInTheDocument();
    });
  });

  it('muestra un aviso si la API de estadísticas no responde', async () => {
    fetchMock.mockImplementationOnce(async () => respuestaJson({}, 500));

    await renderizarAppEn('/admin', { usuarioInicial: ADMIN_DE_PRUEBA });

    await waitFor(() => {
      expect(
        screen.getByText(/No se pudieron cargar las estadísticas en tiempo real/i),
      ).toBeInTheDocument();
    });
  });

  it('un usuario con rol jugador es redirigido fuera de /admin', async () => {
    await renderizarAppEn('/admin', { usuarioInicial: JUGADOR_DE_PRUEBA });

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Panel de administración' })).not.toBeInTheDocument();
    });
  });
});
