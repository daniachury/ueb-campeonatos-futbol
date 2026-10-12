// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TorneoAdminResumen } from '../../../../shared/torneos';
import { ModalCrearTorneo } from './ModalCrearTorneo';

describe('ModalCrearTorneo (KAN-20)', () => {
  it('no renderiza nada cuando estaAbierto es false', () => {
    const { container } = render(
      <ModalCrearTorneo
        estaAbierto={false}
        alCerrar={vi.fn()}
        alCreado={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('muestra los campos obligatorios y los fijos en modo lectura cuando estaAbierto es true', () => {
    render(
      <ModalCrearTorneo
        estaAbierto={true}
        alCerrar={vi.fn()}
        alCreado={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: /nuevo torneo/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre del torneo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha de inicio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cupo máximo/i)).toBeInTheDocument();
    expect(screen.getByText('Fútbol 11')).toBeInTheDocument();
    expect(screen.getByText('Liga (Todos vs Todos)')).toBeInTheDocument();
  });

  it('valida nombre con menos de 3 caracteres y no envía el formulario', async () => {
    const crearFn = vi.fn();
    render(
      <ModalCrearTorneo
        estaAbierto={true}
        alCerrar={vi.fn()}
        alCreado={vi.fn()}
        crearFn={crearFn}
      />,
    );

    const inputNombre = screen.getByLabelText(/nombre del torneo/i);
    fireEvent.change(inputNombre, { target: { value: 'AB' } });

    const btnGuardar = screen.getByRole('button', { name: /guardar/i });
    fireEvent.click(btnGuardar);

    expect(await screen.findByText('El nombre debe tener entre 3 y 80 caracteres')).toBeInTheDocument();
    expect(crearFn).not.toHaveBeenCalled();
  });

  it('valida cupo fuera del rango 3-20', async () => {
    const crearFn = vi.fn();
    render(
      <ModalCrearTorneo
        estaAbierto={true}
        alCerrar={vi.fn()}
        alCreado={vi.fn()}
        crearFn={crearFn}
      />,
    );

    const inputNombre = screen.getByLabelText(/nombre del torneo/i);
    fireEvent.change(inputNombre, { target: { value: 'Copa Valida' } });

    const inputCupo = screen.getByLabelText(/cupo máximo/i);
    fireEvent.change(inputCupo, { target: { value: '25' } });

    const btnGuardar = screen.getByRole('button', { name: /guardar/i });
    fireEvent.click(btnGuardar);

    expect(await screen.findByText('El cupo debe estar entre 3 y 20 equipos')).toBeInTheDocument();
    expect(crearFn).not.toHaveBeenCalled();
  });

  it('muestra error 409 cuando el nombre ya existe', async () => {
    const crearFn = vi.fn().mockRejectedValue(new Error('Ya existe un torneo con ese nombre'));
    render(
      <ModalCrearTorneo
        estaAbierto={true}
        alCerrar={vi.fn()}
        alCreado={vi.fn()}
        crearFn={crearFn}
      />,
    );

    const inputNombre = screen.getByLabelText(/nombre del torneo/i);
    fireEvent.change(inputNombre, { target: { value: 'Copa El Bosque 2026' } });

    const btnGuardar = screen.getByRole('button', { name: /guardar/i });
    fireEvent.click(btnGuardar);

    expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe un torneo con ese nombre');
  });

  it('crea el torneo exitosamente y llama a alCreado', async () => {
    const torneoCreado: TorneoAdminResumen = {
      id: 't-nuevo',
      nombre: 'Copa El Bosque 2026',
      estado: 'BORRADOR',
      fechaInicio: '2026-12-01',
      cupo: 8,
      modalidad: 'FUTBOL_11',
      formato: 'LIGA',
      creadoEn: '2026-10-11T12:00:00Z',
    };

    const crearFn = vi.fn().mockResolvedValue({
      mensaje: 'Torneo creado exitosamente en estado borrador',
      torneo: torneoCreado,
    });
    const alCreado = vi.fn();

    render(
      <ModalCrearTorneo
        estaAbierto={true}
        alCerrar={vi.fn()}
        alCreado={alCreado}
        crearFn={crearFn}
      />,
    );

    fireEvent.change(screen.getByLabelText(/nombre del torneo/i), {
      target: { value: 'Copa El Bosque 2026' },
    });
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    expect(crearFn).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Copa El Bosque 2026',
        cupo: 8,
        modalidad: 'FUTBOL_11',
        formato: 'LIGA',
      }),
    );

    // Esperar a que se procese la promesa
    await vi.waitFor(() => {
      expect(alCreado).toHaveBeenCalledWith(torneoCreado);
    });
  });

  it('cierra el modal al pulsar Cancelar o el botón de cerrar', () => {
    const alCerrar = vi.fn();
    render(
      <ModalCrearTorneo
        estaAbierto={true}
        alCerrar={alCerrar}
        alCreado={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(alCerrar).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByLabelText(/cerrar modal/i));
    expect(alCerrar).toHaveBeenCalledTimes(2);
  });
});
