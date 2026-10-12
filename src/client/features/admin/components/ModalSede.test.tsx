// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ModalSede } from './ModalSede';

describe('ModalSede (KAN-34)', () => {
  it('no se renderiza si estaAbierto es false', () => {
    render(<ModalSede estaAbierto={false} alGuardar={vi.fn()} alCerrar={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('valida que el nombre de la sede tenga al menos 3 caracteres', () => {
    const alGuardar = vi.fn();
    render(<ModalSede estaAbierto={true} alGuardar={alGuardar} alCerrar={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/nombre de la sede/i), { target: { value: 'AB' } });
    fireEvent.change(screen.getByLabelText(/dirección/i), { target: { value: 'Calle 100 # 15-20' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar sede/i }));

    expect(alGuardar).not.toHaveBeenCalled();
    expect(
      screen.getByText(/El nombre de la sede debe tener entre 3 y 80 caracteres/i),
    ).toBeInTheDocument();
  });

  it('ejecuta alGuardar con los datos correctos', () => {
    const alGuardar = vi.fn().mockResolvedValue(undefined);
    render(<ModalSede estaAbierto={true} alGuardar={alGuardar} alCerrar={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/nombre de la sede/i), {
      target: { value: 'Sede Norte' },
    });
    fireEvent.change(screen.getByLabelText(/dirección/i), {
      target: { value: 'Carrera 7 # 150-10' },
    });
    fireEvent.change(screen.getByLabelText(/ciudad/i), {
      target: { value: 'Bogotá' },
    });
    fireEvent.click(screen.getByRole('button', { name: /guardar sede/i }));

    expect(alGuardar).toHaveBeenCalledWith({
      nombre: 'Sede Norte',
      direccion: 'Carrera 7 # 150-10',
      ciudad: 'Bogotá',
      indicaciones: undefined,
    });
  });
});
