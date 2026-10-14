// @vitest-environment jsdom
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RUTAS } from '../../../common/navegacion';
import { JUGADOR_DE_PRUEBA, renderizarAppEn } from '../../../test/renderizar-app';

describe('TablaResultadosPage (KAN-40)', () => {
  it('renderiza el título y columnas de la tabla de posiciones con datos', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (info) => {
      const url = String(info);
      if (url.includes('/api/inscripciones')) {
        return new Response(JSON.stringify({ datos: [{ torneoId: 't-1', estado: 'APROBADA' }] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.includes('/api/tabla/t-1')) {
        return new Response(
          JSON.stringify({
            datos: [
              {
                equipo: 'Los Halcones',
                partidosJugados: 2,
                ganados: 1,
                empatados: 1,
                perdidos: 0,
                golesFavor: 3,
                golesContra: 1,
                puntos: 4,
              },
              {
                equipo: 'Real Bosque',
                partidosJugados: 2,
                ganados: 0,
                empatados: 1,
                perdidos: 1,
                golesFavor: 1,
                golesContra: 3,
                puntos: 1,
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return new Response(JSON.stringify({}), { status: 404 });
    });

    renderizarAppEn(RUTAS.TABLA_RESULTADOS, { usuarioInicial: JUGADOR_DE_PRUEBA });

    expect(await screen.findByRole('heading', { level: 1, name: 'Tabla de resultados' })).toBeInTheDocument();
    expect(screen.getByText('Posiciones y estadísticas completas del torneo.')).toBeInTheDocument();

    // Validar nombres de equipos y puntos en la tabla
    expect(await screen.findByText('Los Halcones')).toBeInTheDocument();
    expect(screen.getByText('Real Bosque')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('muestra estado vacío cuando no hay resultados en el torneo', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (info) => {
      const url = String(info);
      if (url.includes('/api/inscripciones')) {
        return new Response(JSON.stringify({ datos: [{ torneoId: 't-1', estado: 'APROBADA' }] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.includes('/api/tabla/t-1')) {
        return new Response(JSON.stringify({ datos: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({}), { status: 404 });
    });

    renderizarAppEn(RUTAS.TABLA_RESULTADOS, { usuarioInicial: JUGADOR_DE_PRUEBA });

    expect(await screen.findByText('No hay resultados para mostrar.')).toBeInTheDocument();
  });

  it('redirige a iniciar sesión si no hay usuario autenticado', () => {
    renderizarAppEn(RUTAS.TABLA_RESULTADOS, { usuarioInicial: null });
    expect(screen.queryByRole('heading', { level: 1, name: 'Tabla de resultados' })).not.toBeInTheDocument();
  });
});
