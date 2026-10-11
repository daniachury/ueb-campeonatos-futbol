// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { respuestaJson } from '../../../test/fetch-falso';
import { PanelInscripcionDirecta } from './PanelInscripcionDirecta';

describe('PanelInscripcionDirecta', () => {
  const equiposSimulados = [
    {
      id: 'eq-1',
      nombre: 'Águilas Doradas',
      color: '#ffcc00',
      capitanNombre: 'Juan Capitán',
      cantidadJugadores: 14,
    },
    {
      id: 'eq-2',
      nombre: 'Cóndores FC',
      color: '#0033aa',
      capitanNombre: 'Pedro Capitán',
      cantidadJugadores: 8, // < 11
    },
  ];

  it('permite buscar equipos y seleccionar uno completo para inscribirlo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => respuestaJson({ datos: equiposSimulados })),
    );

    const alInscribir = vi.fn(async () => {});

    render(
      <PanelInscripcionDirecta
        torneoId="torneo-1"
        cupoCompleto={false}
        torneoEnCurso={false}
        alInscribir={alInscribir}
      />,
    );

    // Esperar a que carguen los equipos
    expect(await screen.findByText('Águilas Doradas')).toBeInTheDocument();
    expect(screen.getByText('Cóndores FC')).toBeInTheDocument();

    // El equipo con < 11 jugadores muestra indicador de incompleto
    expect(screen.getByText('8/11 jugadores')).toBeInTheDocument();

    const boton = screen.getByRole('button', { name: 'Inscribir equipo seleccionado' });
    expect(boton).toBeDisabled();

    // Seleccionar Águilas Doradas
    fireEvent.click(screen.getByText('Águilas Doradas'));
    expect(boton).not.toBeDisabled();

    // Enviar inscripción
    fireEvent.click(boton);
    expect(alInscribir).toHaveBeenCalledWith('eq-1');
  });

  it('deshabilita el botón si el cupo está completo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => respuestaJson({ datos: [] })),
    );

    render(
      <PanelInscripcionDirecta
        torneoId="torneo-1"
        cupoCompleto={true}
        torneoEnCurso={false}
        alInscribir={vi.fn()}
      />,
    );

    const boton = screen.getByRole('button', { name: 'Cupo completo' });
    expect(boton).toBeDisabled();
  });
});
