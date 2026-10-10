// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RUTAS } from '../../../common/navegacion';
import {
  JUGADOR_DE_PRUEBA,
  crearServicioDeSesionFalso,
  renderizarAppEn,
} from '../../../test/renderizar-app';

describe('ArranquePage (v3 · S01)', () => {
  it('sin sesión invita a iniciar sesión o crear una cuenta', async () => {
    renderizarAppEn(RUTAS.INICIO);

    expect(
      await screen.findByRole('heading', { name: 'Tu liga empieza aquí' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Escudo de Liga Bosque' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Soy nuevo · Crear cuenta' })).toBeInTheDocument();
  });

  it('con la sesión activa saluda y lleva a Torneos', () => {
    renderizarAppEn(RUTAS.INICIO, { usuarioInicial: JUGADOR_DE_PRUEBA });

    expect(screen.getByText('Tu sesión sigue activa')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hola de nuevo, Camilo' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Entrar a Torneos' })).toHaveAttribute(
      'href',
      RUTAS.INICIO_DEL_JUGADOR,
    );
  });

  it('«Usar otra cuenta» cierra la sesión y lleva a Iniciar sesión', async () => {
    const { servicioDeSesion } = renderizarAppEn(RUTAS.INICIO, {
      usuarioInicial: JUGADOR_DE_PRUEBA,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Usar otra cuenta' }));

    expect(await screen.findByRole('heading', { name: 'Hola de nuevo' })).toBeInTheDocument();
    expect(servicioDeSesion.cerrarSesion).toHaveBeenCalledTimes(1);
  });

  it('mientras consulta la cookie muestra «Comprobando tu sesión…»', async () => {
    renderizarAppEn(RUTAS.INICIO, {
      servicioDeSesion: crearServicioDeSesionFalso({
        consultarSesionActual: () => new Promise(() => undefined),
      }),
    });

    expect(screen.getByText('Comprobando tu sesión…')).toBeInTheDocument();
  });

  it('si la sesión venció lo dice y ofrece iniciar sesión (Escenario 7)', async () => {
    renderizarAppEn(RUTAS.INICIO, {
      servicioDeSesion: crearServicioDeSesionFalso({
        consultarSesionActual: async () => ({ estado: 'expirada' }),
      }),
    });

    expect(await screen.findByText('Tu sesión expiró, ingresa de nuevo')).toBeInTheDocument();
    expect(screen.getByText('Por seguridad, la sesión dura 24 horas.')).toBeInTheDocument();
  });
});
