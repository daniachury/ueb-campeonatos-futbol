// @vitest-environment jsdom
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RUTAS } from '../common/navegacion';
import { simularFetch } from '../test/fetch-falso';
import { renderizarAppEn as renderizarEn } from '../test/renderizar-app';

describe('rutas de la aplicación', () => {
  it('la raíz muestra el arranque (v3 · S01) con las dos formas de entrar', async () => {
    renderizarEn(RUTAS.INICIO);

    expect(
      await screen.findByRole('heading', { name: 'Tu liga empieza aquí' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute(
      'href',
      RUTAS.INICIAR_SESION,
    );
    expect(screen.getByRole('link', { name: 'Soy nuevo · Crear cuenta' })).toHaveAttribute(
      'href',
      RUTAS.CREAR_CUENTA,
    );
  });

  it('el inicio del jugador sin sesión lleva a Iniciar sesión (KAN-17)', async () => {
    renderizarEn(RUTAS.INICIO_DEL_JUGADOR);

    expect(await screen.findByRole('heading', { name: 'Hola de nuevo' })).toBeInTheDocument();
  });

  it('/torneos sigue dentro del layout principal', async () => {
    simularFetch({ datos: [] });

    renderizarEn(RUTAS.TORNEOS);

    expect(await screen.findByRole('heading', { name: 'Torneos' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Principal' })).toBeInTheDocument();
  });

  it('una dirección desconocida muestra la página 404', () => {
    renderizarEn('/esto-no-existe');

    expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver a los torneos' })).toHaveAttribute(
      'href',
      '/torneos',
    );
  });

  it('Crear cuenta se muestra como pantalla completa, sin el menú principal (KAN-16)', () => {
    renderizarEn(RUTAS.CREAR_CUENTA);

    expect(screen.getByRole('heading', { name: /Crea tu ficha/ })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Principal' })).not.toBeInTheDocument();
  });

  it('Recuperar cuenta se muestra como pantalla completa, sin el menú principal (KAN-50)', () => {
    renderizarEn(RUTAS.RECUPERAR_CUENTA);

    expect(screen.getByRole('heading', { name: 'Recuperar cuenta' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Principal' })).not.toBeInTheDocument();
  });
});
