// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ModalMotivoInscripcion } from './ModalMotivoInscripcion';

describe('ModalMotivoInscripcion', () => {
  it('no renderiza nada si estaAbierto es falso', () => {
    const { container } = render(
      <ModalMotivoInscripcion
        estaAbierto={false}
        titulo="Rechazar solicitud"
        descripcion="Indica el motivo"
        alConfirmar={vi.fn()}
        alCerrar={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('valida que el botón de confirmación se habilite solo entre 10 y 300 caracteres', () => {
    const alConfirmar = vi.fn();
    render(
      <ModalMotivoInscripcion
        estaAbierto={true}
        titulo="Rechazar solicitud"
        descripcion="Indica el motivo del rechazo"
        alConfirmar={alConfirmar}
        alCerrar={vi.fn()}
      />,
    );

    const boton = screen.getByRole('button', { name: 'Confirmar' });
    const textarea = screen.getByPlaceholderText(/Escribe el motivo detallado/i);

    // Inicialmente deshabilitado
    expect(boton).toBeDisabled();

    // Texto corto (< 10)
    fireEvent.change(textarea, { target: { value: 'Corto' } });
    expect(boton).toBeDisabled();
    expect(screen.getByText(/al menos 10 caracteres/i)).toBeInTheDocument();

    // Texto válido (>= 10)
    fireEvent.change(textarea, {
      target: { value: 'Motivo suficientemente largo para ser válido' },
    });
    expect(boton).not.toBeDisabled();

    // Confirmar
    fireEvent.click(boton);
    expect(alConfirmar).toHaveBeenCalledWith('Motivo suficientemente largo para ser válido');
  });

  it('permite cerrar con el botón Cancelar o tecla Escape', () => {
    const alCerrar = vi.fn();
    render(
      <ModalMotivoInscripcion
        estaAbierto={true}
        titulo="Rechazar solicitud"
        descripcion="Indica el motivo"
        alConfirmar={vi.fn()}
        alCerrar={alCerrar}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(alCerrar).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(alCerrar).toHaveBeenCalledTimes(2);
  });
});
