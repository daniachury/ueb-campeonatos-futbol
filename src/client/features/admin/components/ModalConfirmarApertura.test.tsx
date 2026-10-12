// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TorneoAdminResumen } from '../../../../shared/torneos';
import { ModalConfirmarApertura } from './ModalConfirmarApertura';

const torneoBorradorMock: TorneoAdminResumen = {
  id: 't-123',
  nombre: 'Copa Universitaria',
  estado: 'BORRADOR',
  fechaInicio: '2026-12-01',
  cupo: 10,
  modalidad: 'FUTBOL_11',
  formato: 'LIGA',
  creadoEn: '2026-10-01T12:00:00Z',
};

describe('ModalConfirmarApertura (KAN-20)', () => {
  it('no renderiza nada si estaAbierto es false o torneo es null', () => {
    const { container: c1 } = render(
      <ModalConfirmarApertura
        estaAbierto={false}
        torneo={torneoBorradorMock}
        alCerrar={vi.fn()}
        alConfirmado={vi.fn()}
      />,
    );
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(
      <ModalConfirmarApertura
        estaAbierto={true}
        torneo={null}
        alCerrar={vi.fn()}
        alConfirmado={vi.fn()}
      />,
    );
    expect(c2.firstChild).toBeNull();
  });

  it('muestra el nombre del torneo y la advertencia de irreversibilidad', () => {
    render(
      <ModalConfirmarApertura
        estaAbierto={true}
        torneo={torneoBorradorMock}
        alCerrar={vi.fn()}
        alConfirmado={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: /abrir inscripciones/i })).toBeInTheDocument();
    expect(screen.getByText(/«Copa Universitaria»/)).toBeInTheDocument();
    expect(screen.getByText(/irreversible/i)).toBeInTheDocument();
  });

  it('llama a alCerrar al hacer clic en Cancelar', () => {
    const alCerrar = vi.fn();
    render(
      <ModalConfirmarApertura
        estaAbierto={true}
        torneo={torneoBorradorMock}
        alCerrar={alCerrar}
        alConfirmado={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(alCerrar).toHaveBeenCalledTimes(1);
  });

  it('llama a abrirFn y notifica a alConfirmado al confirmar', async () => {
    const torneoActualizado: TorneoAdminResumen = {
      ...torneoBorradorMock,
      estado: 'INSCRIPCIONES_ABIERTAS',
    };
    const abrirFn = vi.fn().mockResolvedValue({
      mensaje: 'Inscripciones abiertas',
      torneo: torneoActualizado,
    });
    const alConfirmado = vi.fn();

    render(
      <ModalConfirmarApertura
        estaAbierto={true}
        torneo={torneoBorradorMock}
        alCerrar={vi.fn()}
        alConfirmado={alConfirmado}
        abrirFn={abrirFn}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /sí, abrir inscripciones/i }));

    expect(abrirFn).toHaveBeenCalledWith('t-123');
    await vi.waitFor(() => {
      expect(alConfirmado).toHaveBeenCalledWith(torneoActualizado);
    });
  });

  it('muestra mensaje de error si falla la apertura de inscripciones', async () => {
    const abrirFn = vi.fn().mockRejectedValue(new Error('No se pudo abrir el torneo'));
    render(
      <ModalConfirmarApertura
        estaAbierto={true}
        torneo={torneoBorradorMock}
        alCerrar={vi.fn()}
        alConfirmado={vi.fn()}
        abrirFn={abrirFn}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /sí, abrir inscripciones/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo abrir el torneo');
  });
});
