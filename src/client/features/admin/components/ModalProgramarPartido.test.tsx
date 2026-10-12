// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ModalProgramarPartido } from './ModalProgramarPartido';
import type { PartidoFixtureResumen } from '../../../../shared/sorteo/contrato-sorteo';
import type { CanchaDisponibleSelector } from '../../../../shared/sedes/contrato-sedes';

const partidoMock: PartidoFixtureResumen = {
  id: 'partido-1',
  fechaId: 'fecha-1',
  torneoId: 'torneo-1',
  local: { id: 'eq-1', nombre: 'Halcones Dorados', color: '#ffd700' },
  visitante: { id: 'eq-2', nombre: 'Leones Rojos', color: '#ff0000' },
  estado: 'POR_PROGRAMAR',
  golesLocal: null,
  golesVisitante: null,
  fechaHora: null,
  cancha: null,
};

const canchasMock: CanchaDisponibleSelector[] = [
  {
    id: 'cancha-1',
    nombre: 'Cancha 1 Sintética',
    sedeId: 'sede-1',
    sedeNombre: 'Sede Norte',
    superficie: 'Sintética',
  },
  {
    id: 'cancha-2',
    nombre: 'Cancha 2 Césped',
    sedeId: 'sede-2',
    sedeNombre: 'Sede Sur',
    superficie: 'Natural',
  },
];

describe('ModalProgramarPartido (KAN-35)', () => {
  it('renderiza el modal con el enfrentamiento y la lista de canchas', () => {
    render(
      <ModalProgramarPartido
        estaAbierto={true}
        partido={partidoMock}
        numeroFecha={1}
        canchasDisponibles={canchasMock}
        alCerrar={vi.fn()}
        alGuardado={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Programar partido' })).toBeInTheDocument();
    expect(screen.getByText(/Fecha 1 · Fixture/i)).toBeInTheDocument();
    expect(screen.getByText('Halcones Dorados')).toBeInTheDocument();
    expect(screen.getByText('Leones Rojos')).toBeInTheDocument();
    expect(screen.getByText(/Cancha 1 Sintética/i)).toBeInTheDocument();
  });

  it('no renderiza nada si estaAbierto es false', () => {
    const { container } = render(
      <ModalProgramarPartido
        estaAbierto={false}
        partido={partidoMock}
        canchasDisponibles={canchasMock}
        alCerrar={vi.fn()}
        alGuardado={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('muestra error si se intenta guardar sin seleccionar cancha o fecha', async () => {
    render(
      <ModalProgramarPartido
        estaAbierto={true}
        partido={partidoMock}
        canchasDisponibles={canchasMock}
        alCerrar={vi.fn()}
        alGuardado={vi.fn()}
      />,
    );

    const form = screen.getByRole('dialog').querySelector('form')!;
    fireEvent.submit(form);

    expect(screen.getByText(/Por favor selecciona una cancha/i)).toBeInTheDocument();
  });

  it('llama a programarFn con datos válidos al enviar el formulario', async () => {
    const fnProgramar = vi.fn().mockResolvedValue({});
    const fnGuardado = vi.fn();

    render(
      <ModalProgramarPartido
        estaAbierto={true}
        partido={partidoMock}
        canchasDisponibles={canchasMock}
        alCerrar={vi.fn()}
        alGuardado={fnGuardado}
        programarFn={fnProgramar}
      />,
    );

    const selectCancha = screen.getByTestId('select-cancha-partido');
    const inputFecha = screen.getByTestId('input-fecha-hora-partido');

    fireEvent.change(selectCancha, { target: { value: 'cancha-1' } });
    fireEvent.change(inputFecha, { target: { value: '2026-10-25T14:00' } });

    const btnGuardar = screen.getByRole('button', { name: /Programar partido/i });
    fireEvent.click(btnGuardar);

    await vi.waitFor(() => {
      expect(fnProgramar).toHaveBeenCalledTimes(1);
      expect(fnProgramar).toHaveBeenCalledWith('partido-1', {
        canchaId: 'cancha-1',
        fechaHora: expect.any(String),
      });
      expect(fnGuardado).toHaveBeenCalledTimes(1);
    });
  });

  it('muestra banner de conflicto si programarFn rechaza con mensaje de error', async () => {
    const fnProgramar = vi.fn().mockRejectedValue(new Error('Cruce de horario en Cancha 1'));

    render(
      <ModalProgramarPartido
        estaAbierto={true}
        partido={partidoMock}
        canchasDisponibles={canchasMock}
        alCerrar={vi.fn()}
        alGuardado={vi.fn()}
        programarFn={fnProgramar}
      />,
    );

    fireEvent.change(screen.getByTestId('select-cancha-partido'), {
      target: { value: 'cancha-1' },
    });
    fireEvent.change(screen.getByTestId('input-fecha-hora-partido'), {
      target: { value: '2026-10-25T14:00' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Programar partido/i }));

    await vi.waitFor(() => {
      expect(screen.getByTestId('alerta-conflicto-horario')).toHaveTextContent(
        /Cruce de horario en Cancha 1/i,
      );
    });
  });

  it('permite desprogramar cuando el partido ya está en estado PROGRAMADO', async () => {
    const fnDesprogramar = vi.fn().mockResolvedValue({});
    const fnGuardado = vi.fn();

    const partidoProgramado: PartidoFixtureResumen = {
      ...partidoMock,
      estado: 'PROGRAMADO',
      canchaId: 'cancha-1',
      canchaNombre: 'Cancha 1 Sintética',
      sedeNombre: 'Sede Norte',
      fechaHora: '2026-10-25T14:00:00.000Z',
    };

    render(
      <ModalProgramarPartido
        estaAbierto={true}
        partido={partidoProgramado}
        canchasDisponibles={canchasMock}
        alCerrar={vi.fn()}
        alGuardado={fnGuardado}
        desprogramarFn={fnDesprogramar}
      />,
    );

    expect(screen.getByText('Reprogramar partido')).toBeInTheDocument();
    const btnDesprogramar = screen.getByTestId('btn-desprogramar-partido');
    expect(btnDesprogramar).toBeInTheDocument();

    fireEvent.click(btnDesprogramar);

    await vi.waitFor(() => {
      expect(fnDesprogramar).toHaveBeenCalledTimes(1);
      expect(fnDesprogramar).toHaveBeenCalledWith('partido-1');
      expect(fnGuardado).toHaveBeenCalledTimes(1);
    });
  });

  it('llama a alCerrar al hacer clic en Cancelar', () => {
    const fnCerrar = vi.fn();
    render(
      <ModalProgramarPartido
        estaAbierto={true}
        partido={partidoMock}
        canchasDisponibles={canchasMock}
        alCerrar={fnCerrar}
        alGuardado={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(fnCerrar).toHaveBeenCalledTimes(1);
  });
});
