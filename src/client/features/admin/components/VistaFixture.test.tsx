// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VistaFixture } from './VistaFixture';
import type { FixtureTorneoResponse } from '../../../../shared/sorteo/contrato-sorteo';

const fixtureMock: FixtureTorneoResponse = {
  torneoId: 't-1',
  totalEquipos: 3,
  totalFechas: 3,
  totalPartidos: 3,
  puedeRepetirSorteo: true,
  fechas: [
    {
      id: 'f-1',
      torneoId: 't-1',
      numero: 1,
      equipoDescansa: { id: 'eq-3', nombre: 'Águilas' },
      partidos: [
        {
          id: 'p-1',
          fechaId: 'f-1',
          torneoId: 't-1',
          local: { id: 'eq-1', nombre: 'Tigres' },
          visitante: { id: 'eq-2', nombre: 'Leones' },
          estado: 'POR_PROGRAMAR',
          golesLocal: null,
          golesVisitante: null,
          fechaHora: null,
          cancha: null,
        },
      ],
    },
  ],
};

describe('VistaFixture (Calendario y Fixture)', () => {
  it('renderiza fechas, partidos y descansos adecuadamente (Escenario 2)', () => {
    render(<VistaFixture fixture={fixtureMock} onFixtureActualizado={vi.fn()} />);

    expect(screen.getByText(/Fecha 1/i)).toBeInTheDocument();
    expect(screen.getByText('Tigres')).toBeInTheDocument();
    expect(screen.getByText('Leones')).toBeInTheDocument();
    expect(screen.getByText(/Descansa:/i)).toBeInTheDocument();
    expect(screen.getByText('Águilas')).toBeInTheDocument();
    expect(screen.getByText('Por programar')).toBeInTheDocument();
  });

  it('muestra botón de repetir sorteo y abre modal de confirmación (Escenario 6)', async () => {
    const fnRepetir = vi.fn().mockResolvedValue({});
    const fnActualizado = vi.fn();

    render(
      <VistaFixture
        fixture={fixtureMock}
        repetirSorteoFn={fnRepetir}
        onFixtureActualizado={fnActualizado}
      />,
    );

    const botonRepetir = screen.getByRole('button', { name: /Repetir sorteo/i });
    expect(botonRepetir).toBeInTheDocument();
    fireEvent.click(botonRepetir);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Se regenerará todo el fixture/i)).toBeInTheDocument();

    const botonConfirmar = screen.getByRole('button', { name: /Confirmar y repetir sorteo/i });
    fireEvent.click(botonConfirmar);

    await waitFor(() => {
      expect(fnRepetir).toHaveBeenCalledWith('t-1');
      expect(fnActualizado).toHaveBeenCalled();
    });
  });

  it('no muestra el botón de repetir sorteo si puedeRepetirSorteo es false', () => {
    render(
      <VistaFixture
        fixture={{ ...fixtureMock, puedeRepetirSorteo: false }}
        onFixtureActualizado={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: /Repetir sorteo/i })).not.toBeInTheDocument();
  });
});
