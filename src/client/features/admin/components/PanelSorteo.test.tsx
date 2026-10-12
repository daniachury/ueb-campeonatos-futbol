// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PanelSorteo } from './PanelSorteo';

describe('PanelSorteo (Cerrar inscripciones y sortear)', () => {
  it('deshabilita el botón y muestra advertencia con menos de 3 equipos (Escenario 3)', () => {
    render(
      <PanelSorteo
        torneoId="t-1"
        equiposAprobados={2}
        solicitudesPendientes={1}
        onSorteoCompletado={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/Se necesitan al menos 3 equipos aprobados para sortear/i),
    ).toBeInTheDocument();

    const boton = screen.getByRole('button', { name: /Cerrar inscripciones y sortear/i });
    expect(boton).toBeDisabled();
  });

  it('muestra métricas estimadas con 4 equipos aprobados y habilita el botón', () => {
    render(
      <PanelSorteo
        torneoId="t-1"
        equiposAprobados={4}
        solicitudesPendientes={2}
        onSorteoCompletado={vi.fn()}
      />,
    );

    expect(screen.getByText('4')).toBeInTheDocument(); // Equipos
    expect(screen.getByText('3')).toBeInTheDocument(); // Fechas
    expect(screen.getByText('6')).toBeInTheDocument(); // Partidos

    const boton = screen.getByRole('button', { name: /Cerrar inscripciones y sortear/i });
    expect(boton).not.toBeDisabled();
  });

  it('abre modal con advertencia de solicitudes pendientes y ejecuta el sorteo al confirmar', async () => {
    const fnSorteo = vi.fn().mockResolvedValue({});
    const fnCompletado = vi.fn();

    render(
      <PanelSorteo
        torneoId="t-1"
        equiposAprobados={5}
        solicitudesPendientes={2}
        ejecutarSorteoFn={fnSorteo}
        onSorteoCompletado={fnCompletado}
      />,
    );

    const botonAbrir = screen.getByRole('button', { name: /Cerrar inscripciones y sortear/i });
    fireEvent.click(botonAbrir);

    // Modal abierto
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('2 solicitudes pendientes')).toBeInTheDocument();

    // Confirmar
    const botonConfirmar = screen.getByRole('button', { name: /Confirmar y sortear/i });
    fireEvent.click(botonConfirmar);

    await waitFor(() => {
      expect(fnSorteo).toHaveBeenCalledWith('t-1');
      expect(fnCompletado).toHaveBeenCalled();
    });
  });
});
