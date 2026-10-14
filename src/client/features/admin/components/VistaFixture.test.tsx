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

  it('muestra botón Programar y abre el modal de programación (KAN-35)', () => {
    render(<VistaFixture fixture={fixtureMock} onFixtureActualizado={vi.fn()} />);

    const btnProgramar = screen.getByTestId('btn-programar-partido-p-1');
    expect(btnProgramar).toBeInTheDocument();
    expect(btnProgramar).toHaveTextContent(/Programar/i);

    fireEvent.click(btnProgramar);

    expect(screen.getByTestId('modal-programar-partido')).toBeInTheDocument();
  });

  it('muestra datos de sede, cancha y fecha en partidos programados con botón Reprogramar (KAN-35)', () => {
    const fixtureConProgramado: FixtureTorneoResponse = {
      ...fixtureMock,
      fechas: [
        {
          ...fixtureMock.fechas[0]!,
          partidos: [
            {
              ...fixtureMock.fechas[0]!.partidos[0]!,
              estado: 'PROGRAMADO',
              fechaHora: '2026-10-25T14:00:00.000Z',
              canchaId: 'cancha-1',
              canchaNombre: 'Cancha 1 Sintética',
              sedeNombre: 'Sede Norte',
            },
          ],
        },
      ],
    };

    render(<VistaFixture fixture={fixtureConProgramado} onFixtureActualizado={vi.fn()} />);

    expect(screen.getByText('Programado')).toBeInTheDocument();

    expect(screen.getByText(/Sede Norte · Cancha 1 Sintética/i)).toBeInTheDocument();
    const btnReprogramar = screen.getByTestId('btn-programar-partido-p-1');
    expect(btnReprogramar).toHaveTextContent(/Reprogramar/i);
  });

  it('muestra indicador "Programados X/Y" y permite filtrar "Solo por programar" (KAN-35 · Escenario 7)', () => {
    const fixtureMixto: FixtureTorneoResponse = {
      ...fixtureMock,
      totalPartidos: 2,
      fechas: [
        {
          ...fixtureMock.fechas[0]!,
          partidos: [
            {
              ...fixtureMock.fechas[0]!.partidos[0]!,
              id: 'p-1',
              estado: 'PROGRAMADO',
              fechaHora: '2026-10-25T14:00:00.000Z',
            },
            {
              ...fixtureMock.fechas[0]!.partidos[0]!,
              id: 'p-2',
              estado: 'POR_PROGRAMAR',
              fechaHora: null,
            },
          ],
        },
      ],
    };

    render(<VistaFixture fixture={fixtureMixto} onFixtureActualizado={vi.fn()} />);

    // Verifica el indicador de métrica
    const indicador = screen.getByTestId('indicador-programados');
    expect(indicador).toBeInTheDocument();
    expect(indicador).toHaveTextContent('Programados: 1/2');

    // Inicialmente ambos partidos están visibles
    expect(screen.getByTestId('tarjeta-partido-p-1')).toBeInTheDocument();
    expect(screen.getByTestId('tarjeta-partido-p-2')).toBeInTheDocument();

    // Activar filtro "Solo por programar"
    const filtro = screen.getByLabelText(/Solo por programar/i);
    fireEvent.click(filtro);

    // El partido PROGRAMADO ya no debe mostrarse, solo el POR_PROGRAMAR
    expect(screen.queryByTestId('tarjeta-partido-p-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('tarjeta-partido-p-2')).toBeInTheDocument();
  });
});
