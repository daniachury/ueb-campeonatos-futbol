// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ModalCancha } from './ModalCancha';

describe('ModalCancha (KAN-34)', () => {
  it('no se renderiza si estaAbierto es false', () => {
    render(
      <ModalCancha
        estaAbierto={false}
        sedeNombre="Complejo El Bosque"
        alGuardar={vi.fn()}
        alCerrar={vi.fn()}
      />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('permite registrar cancha con nombre y superficie', () => {
    const alGuardar = vi.fn().mockResolvedValue(undefined);
    render(
      <ModalCancha
        estaAbierto={true}
        sedeNombre="Complejo El Bosque"
        alGuardar={alGuardar}
        alCerrar={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/nombre o número de cancha/i), {
      target: { value: 'Cancha 5' },
    });
    fireEvent.change(screen.getByLabelText(/superficie/i), {
      target: { value: 'Sintética' },
    });
    fireEvent.click(screen.getByRole('button', { name: /guardar cancha/i }));

    expect(alGuardar).toHaveBeenCalledWith({
      nombre: 'Cancha 5',
      superficie: 'Sintética',
      activa: true,
    });
  });
});
