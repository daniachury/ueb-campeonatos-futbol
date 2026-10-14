// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TorneoAdminResumen } from '../../../../shared/torneos';
import { ModalEliminarTorneo } from './ModalEliminarTorneo';

describe('ModalEliminarTorneo (KAN-22)', () => {
  const torneoSinResultados: TorneoAdminResumen = {
    id: 't-1',
    nombre: 'Copa El Bosque',
    modalidad: 'FUTBOL_11',
    formato: 'LIGA',
    fechaInicio: '2026-11-20',
    cupo: 8,
    estado: 'BORRADOR',
    creadoEn: '2026-10-01T00:00:00Z',
  };

  it('muestra el impacto y mantiene deshabilitado el botón hasta escribir el nombre exacto', async () => {
    const impactoMock = vi.fn(async () => ({
      equiposInscritos: 4,
      partidos: 6,
      resultados: 0,
    }));

    render(
      <ModalEliminarTorneo
        estaAbierto={true}
        torneo={torneoSinResultados}
        alCerrar={() => {}}
        alEliminado={() => {}}
        obtenerImpactoFn={impactoMock}
      />,
    );

    // Muestra impacto
    expect(await screen.findByText(/4 equipos inscritos, 6 partidos, 0 resultados/i)).toBeInTheDocument();

    const btnConfirmar = screen.getByRole('button', { name: /Eliminar definitivamente/i });
    expect(btnConfirmar).toBeDisabled();

    const inputNombre = screen.getByLabelText(/Escribe exactamente/i);

    // Escribir nombre incompleto
    fireEvent.change(inputNombre, { target: { value: 'Copa' } });
    expect(btnConfirmar).toBeDisabled();

    // Escribir nombre exacto
    fireEvent.change(inputNombre, { target: { value: 'Copa El Bosque' } });
    expect(btnConfirmar).not.toBeDisabled();
  });

  it('llama a la función de eliminación al hacer clic en el botón habilitado', async () => {
    const impactoMock = vi.fn(async () => ({
      equiposInscritos: 0,
      partidos: 0,
      resultados: 0,
    }));
    const eliminarMock = vi.fn(async () => ({
      tipo: 'DEFINITIVA' as const,
      mensaje: 'Eliminado',
    }));
    const eliminadoMock = vi.fn();

    render(
      <ModalEliminarTorneo
        estaAbierto={true}
        torneo={torneoSinResultados}
        alCerrar={() => {}}
        alEliminado={eliminadoMock}
        obtenerImpactoFn={impactoMock}
        eliminarFn={eliminarMock}
      />,
    );

    await screen.findByText(/0 equipos inscritos/i);

    const inputNombre = screen.getByLabelText(/Escribe exactamente/i);
    fireEvent.change(inputNombre, { target: { value: 'Copa El Bosque' } });

    const btnConfirmar = screen.getByRole('button', { name: /Eliminar definitivamente/i });
    fireEvent.click(btnConfirmar);

    expect(eliminarMock).toHaveBeenCalledWith('t-1', 'Copa El Bosque');
  });
});
