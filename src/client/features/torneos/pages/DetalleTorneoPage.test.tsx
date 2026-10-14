// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { TorneoResumen } from '@shared/torneos';
import { respuestaJson } from '../../../test/fetch-falso';
import { DetalleTorneoPage } from './DetalleTorneoPage';

const torneoEjemplo: TorneoResumen & { descripcion: string } = {
  id: 't-123',
  nombre: 'Torneo Clausura 2026',
  estado: 'INSCRIPCIONES_ABIERTAS',
  fechaInicio: '2026-11-20',
  cupo: 12,
  descripcion: 'Torneo universitario semestral',
};

describe('DetalleTorneoPage (KAN-23)', () => {
  it('muestra estado de carga y luego los detalles completos del torneo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL | Request) => {
        const u = String(url);
        if (u.includes('/api/equipos')) {
          return respuestaJson({ datos: [{ id: 'eq-1', nombre: 'Halcones FC' }] });
        }
        if (u.includes('/api/partidos/calendario')) {
          return respuestaJson({ datos: [] });
        }
        if (u.includes('/api/torneos/t-123')) {
          return respuestaJson({ datos: torneoEjemplo });
        }
        return respuestaJson({}, 404);
      }),
    );

    render(
      <MemoryRouter initialEntries={['/torneos/t-123']}>
        <Routes>
          <Route path="/torneos/:id" element={<DetalleTorneoPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Cargando torneo…');
    expect(await screen.findByRole('heading', { name: 'Torneo Clausura 2026' })).toBeInTheDocument();
    expect(screen.getByText('Inscripciones abiertas')).toBeInTheDocument();
    expect(screen.getByText('Torneo universitario semestral')).toBeInTheDocument();
    expect(screen.getByText('12 equipos')).toBeInTheDocument();
    expect(screen.getByText('Halcones FC')).toBeInTheDocument();
  });

  it('muestra mensaje de alerta si el torneo falla al cargar', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => respuestaJson({}, 404)),
    );

    render(
      <MemoryRouter initialEntries={['/torneos/invalido']}>
        <Routes>
          <Route path="/torneos/:id" element={<DetalleTorneoPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('muestra el mensaje de error en pantalla si la inscripción responde 409 conflicto', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
        const u = String(url);
        if (u.includes('/api/inscripciones') && init?.method === 'POST') {
          return respuestaJson({ mensaje: 'Tu equipo ya tiene una solicitud en este torneo' }, 409);
        }
        if (u.includes('/api/equipos')) {
          return respuestaJson({ datos: [{ id: 'eq-1', nombre: 'Halcones FC' }] });
        }
        if (u.includes('/api/partidos/calendario')) {
          return respuestaJson({ datos: [] });
        }
        if (u.includes('/api/torneos/t-123')) {
          return respuestaJson({ datos: torneoEjemplo });
        }
        return respuestaJson({}, 404);
      }),
    );

    render(
      <MemoryRouter initialEntries={['/torneos/t-123']}>
        <Routes>
          <Route path="/torneos/:id" element={<DetalleTorneoPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Torneo Clausura 2026' })).toBeInTheDocument();

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'eq-1' } });

    const botonEnviar = screen.getByRole('button', { name: 'Enviar solicitud' });
    fireEvent.click(botonEnviar);

    expect(
      await screen.findByText('Tu equipo ya tiene una solicitud en este torneo'),
    ).toBeInTheDocument();
  });
});
