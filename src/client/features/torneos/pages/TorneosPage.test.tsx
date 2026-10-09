// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { TorneoResumen } from '@shared/torneos';
import { simularFetch } from '../../../test/fetch-falso';
import { TorneosPage } from './TorneosPage';

const torneos: TorneoResumen[] = [
  {
    id: 't1',
    nombre: 'Copa El Bosque 2026',
    estado: 'INSCRIPCIONES_ABIERTAS',
    fechaInicio: '2026-11-07',
    cupo: 8,
  },
  {
    id: 't2',
    nombre: 'Liga Interfacultades',
    estado: 'EN_CURSO',
    fechaInicio: '2026-09-19',
    cupo: 10,
  },
];

describe('TorneosPage', () => {
  it('muestra "cargando" y luego una tarjeta por torneo', async () => {
    simularFetch({ datos: torneos });

    render(<TorneosPage />);

    expect(screen.getByRole('status')).toHaveTextContent('Cargando torneos');
    expect(await screen.findByRole('heading', { name: 'Copa El Bosque 2026' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Liga Interfacultades' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('muestra el mensaje de lista vacía', async () => {
    simularFetch({ datos: [] });

    render(<TorneosPage />);

    expect(
      await screen.findByText('Aún no hay torneos publicados. Vuelve pronto.'),
    ).toBeInTheDocument();
  });

  it('muestra el mensaje de error que envía la API', async () => {
    simularFetch(
      { codigo: 'ERROR_INTERNO', mensaje: 'Ocurrió un error inesperado. Intenta de nuevo.' },
      500,
    );

    render(<TorneosPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Ocurrió un error inesperado');
  });

  it('vuelve a consultar con el estado elegido en el filtro', async () => {
    const fetchFalso = simularFetch({ datos: torneos });
    render(<TorneosPage />);
    await screen.findByRole('heading', { name: 'Copa El Bosque 2026' });

    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'EN_CURSO' } });
    await screen.findByRole('heading', { name: 'Liga Interfacultades' });

    expect(fetchFalso.mock.calls.map(([url]) => url)).toEqual([
      '/api/torneos',
      '/api/torneos?estado=EN_CURSO',
    ]);
  });
});
