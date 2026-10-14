// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TorneoAdminResumen } from '../../../../shared/torneos';
import { ModalEditarTorneo } from './ModalEditarTorneo';

describe('ModalEditarTorneo (KAN-21)', () => {
  const torneoBorrador: TorneoAdminResumen = {
    id: 't-1',
    nombre: 'Copa El Bosque',
    descripcion: 'Torneo universitario',
    modalidad: 'FUTBOL_11',
    formato: 'LIGA',
    fechaInicio: '2026-11-20',
    cupo: 8,
    estado: 'BORRADOR',
    creadoEn: '2026-10-01T00:00:00Z',
  };

  const torneoEnCurso: TorneoAdminResumen = {
    id: 't-2',
    nombre: 'Torneo Interfacultades',
    descripcion: 'En desarrollo',
    modalidad: 'FUTBOL_11',
    formato: 'LIGA',
    fechaInicio: '2026-10-01',
    cupo: 8,
    estado: 'EN_CURSO',
    creadoEn: '2026-09-01T00:00:00Z',
  };

  it('carga los datos actuales del torneo en el formulario', () => {
    render(
      <ModalEditarTorneo
        estaAbierto={true}
        torneo={torneoBorrador}
        alCerrar={() => {}}
        alEditado={() => {}}
      />,
    );

    expect(screen.getByDisplayValue('Copa El Bosque')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Torneo universitario')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026-11-20')).toBeInTheDocument();
    expect(screen.getByDisplayValue('8')).toBeInTheDocument();
  });

  it('bloquea fecha y cupo con aviso cuando el torneo está EN_CURSO', () => {
    render(
      <ModalEditarTorneo
        estaAbierto={true}
        torneo={torneoEnCurso}
        alCerrar={() => {}}
        alEditado={() => {}}
      />,
    );

    const inputFecha = screen.getByLabelText(/Fecha de inicio/i);
    const inputCupo = screen.getByLabelText(/Cupo máximo/i);

    expect(inputFecha).toBeDisabled();
    expect(inputCupo).toBeDisabled();
    expect(screen.getAllByText('No editable después del sorteo').length).toBeGreaterThan(0);
  });

  it('envía los cambios actualizados cuando el formulario es válido', async () => {
    const editarMock = vi.fn(async () => ({
      mensaje: 'Torneo actualizado exitosamente',
      torneo: { ...torneoBorrador, cupo: 10 },
    }));
    const editadoMock = vi.fn();

    render(
      <ModalEditarTorneo
        estaAbierto={true}
        torneo={torneoBorrador}
        alCerrar={() => {}}
        alEditado={editadoMock}
        editarFn={editarMock}
      />,
    );

    const inputCupo = screen.getByLabelText(/Cupo máximo/i);
    fireEvent.change(inputCupo, { target: { value: '10' } });

    const btnGuardar = screen.getByRole('button', { name: /Guardar cambios/i });
    fireEvent.click(btnGuardar);

    expect(editarMock).toHaveBeenCalledWith('t-1', expect.objectContaining({ cupo: 10 }));
  });
});
