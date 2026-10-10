// @vitest-environment jsdom
import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RUTAS, type EstadoAlLlegarAlInicio } from '../../../common/navegacion';
import { JUGADOR_DE_PRUEBA, renderizarAppEn } from '../../../test/renderizar-app';

const BIENVENIDA: EstadoAlLlegarAlInicio = {
  mensajeDeBienvenida: '¡Bienvenida, Camilo! Tu cuenta fue creada',
};

function renderizarInicio(estado: EstadoAlLlegarAlInicio | null = null) {
  return renderizarAppEn(RUTAS.INICIO_DEL_JUGADOR, { usuarioInicial: JUGADOR_DE_PRUEBA, estado });
}

describe('InicioPage (v3 · M11 / W04)', () => {
  it('saluda al jugador y muestra las secciones de un jugador nuevo', () => {
    renderizarInicio();

    expect(screen.getByRole('heading', { level: 1, name: 'Camilo Rojas' })).toBeInTheDocument();
    for (const titulo of [
      'Tu próximo partido',
      'Empieza en 3 pasos',
      'Calendario',
      'Tabla de posiciones',
      'Mis torneos',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: titulo })).toBeInTheDocument();
    }
    expect(screen.getByText('Sin partido programado')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Unirme a un equipo' })).toHaveAttribute(
      'href',
      RUTAS.UNIRME_A_UN_EQUIPO,
    );
    expect(screen.getByText('Sin fechas programadas')).toBeInTheDocument();
  });

  it('muestra la bienvenida del registro y la cierra (KAN-16, Escenario 1)', () => {
    renderizarInicio(BIENVENIDA);

    expect(screen.getByRole('status')).toHaveTextContent(
      '¡Bienvenida, Camilo! Tu cuenta fue creada',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }));

    expect(screen.queryByText('¡Bienvenida, Camilo! Tu cuenta fue creada')).not.toBeInTheDocument();
  });

  it('marca «Torneos» como la pantalla actual en la barra inferior', () => {
    renderizarInicio();

    const barraInferior = screen.getByRole('navigation', { name: 'Accesos rápidos' });
    expect(within(barraInferior).getByRole('link', { name: 'Torneos' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('el calendario permite elegir otro día de la semana', () => {
    renderizarInicio();
    const dias = within(screen.getByRole('group', { name: 'Días de la semana' })).getAllByRole(
      'button',
    );
    const otroDia = dias.find((dia) => dia.getAttribute('aria-pressed') === 'false');

    fireEvent.click(otroDia as HTMLElement);

    expect(dias).toHaveLength(7);
    expect(otroDia).toHaveAttribute('aria-pressed', 'true');
  });

  it('los filtros de Mis torneos cambian el mensaje vacío', () => {
    renderizarInicio();

    fireEvent.click(screen.getByRole('button', { name: 'En curso' }));

    expect(screen.getByText('No tienes torneos en curso')).toBeInTheDocument();
  });
});

describe('LayoutDelJugador · menú hamburguesa (v3 · M12)', () => {
  it('abre el menú con el jugador y lo cierra con Escape', () => {
    renderizarInicio();

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));

    const menu = screen.getByRole('dialog', { name: 'Menú del jugador' });
    expect(within(menu).getByText('camilo.rojas@mail.com')).toBeInTheDocument();
    expect(within(menu).getByRole('button', { name: 'Cerrar menú' })).toHaveFocus();
    fireEvent.keyDown(menu, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
