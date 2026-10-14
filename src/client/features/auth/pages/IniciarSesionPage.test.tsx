// @vitest-environment jsdom
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { UsuarioAutenticado } from '@shared/usuarios/contrato-inicio-de-sesion';
import { RUTAS } from '../../../common/navegacion';
import {
  ErrorDeInicioDeSesion,
  type ServicioDeSesion,
} from '../../../common/sesion/servicio-de-sesion';
import {
  JUGADOR_DE_PRUEBA,
  crearServicioDeSesionFalso,
  renderizarAppEn,
} from '../../../test/renderizar-app';
import { respuestaJson } from '../../../test/fetch-falso';

const ADMINISTRADORA: UsuarioAutenticado = {
  ...JUGADOR_DE_PRUEBA,
  id: 'admin-1',
  nombreCompleto: 'Diana Torres',
  correo: 'admin@mail.com',
  rol: 'admin',
};

function renderizarIniciarSesion(
  iniciarSesion: ServicioDeSesion['iniciarSesion'],
  estado: unknown = null,
) {
  const servicioDeSesion = crearServicioDeSesionFalso({ iniciarSesion });
  renderizarAppEn(RUTAS.INICIAR_SESION, { usuarioInicial: null, servicioDeSesion, estado });
  return servicioDeSesion;
}

function escribirCredenciales(correo: string, contrasena: string) {
  fireEvent.change(screen.getByLabelText('Correo'), { target: { value: correo } });
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: contrasena } });
}

const botonIniciarSesion = () => screen.getByRole('button', { name: /Iniciar sesión|Ingresando/ });

const rechazarCon = (motivo: ErrorDeInicioDeSesion['motivo'], mensaje: string) => async () => {
  throw new ErrorDeInicioDeSesion(motivo, mensaje);
};

describe('IniciarSesionPage (KAN-17 · v3 · M01 / W03)', () => {
  it('muestra el formulario con el botón deshabilitado mientras falten datos', () => {
    renderizarIniciarSesion(async () => JUGADOR_DE_PRUEBA);

    expect(screen.getByRole('heading', { name: 'Hola de nuevo' })).toBeInTheDocument();
    expect(botonIniciarSesion()).toBeDisabled();
    // Pie de M01 y pestaña de W03 (en jsdom no se aplican las media queries).
    expect(screen.getAllByRole('link', { name: 'Crear cuenta' })[0]).toHaveAttribute(
      'href',
      RUTAS.CREAR_CUENTA,
    );
  });

  it('el jugador entra a Torneos con el menú de jugador (Escenario 1)', async () => {
    const servicio = renderizarIniciarSesion(async () => JUGADOR_DE_PRUEBA);
    escribirCredenciales(' Camilo.Rojas@Mail.com', 'golazo2026');

    fireEvent.click(botonIniciarSesion());

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Camilo Rojas' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Accesos rápidos' })).toBeInTheDocument();
    expect(servicio.iniciarSesion).toHaveBeenCalledWith({
      correo: 'camilo.rojas@mail.com',
      contrasena: 'golazo2026',
    });
  });

  it('el administrador entra al Panel de administración (Escenario 2)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuestaJson({})));
    renderizarIniciarSesion(async () => ADMINISTRADORA);
    escribirCredenciales('admin@mail.com', 'admin2026');

    fireEvent.click(botonIniciarSesion());

    expect(
      await screen.findByRole('heading', { name: 'Panel de administración' }),
    ).toBeInTheDocument();
  });

  it('vuelve a la pantalla protegida desde la que lo enviaron', async () => {
    renderizarIniciarSesion(async () => JUGADOR_DE_PRUEBA, { desde: RUTAS.INICIO_DEL_JUGADOR });
    escribirCredenciales('camilo.rojas@mail.com', 'golazo2026');

    fireEvent.click(botonIniciarSesion());

    expect(await screen.findByText('Empieza en 3 pasos')).toBeInTheDocument();
  });

  it('muestra «Correo o contraseña incorrectos» y marca los dos campos (Escenario 3)', async () => {
    renderizarIniciarSesion(
      rechazarCon('credenciales-incorrectas', 'Correo o contraseña incorrectos'),
    );
    escribirCredenciales('laura@mail.com', 'equivocada1');

    fireEvent.click(botonIniciarSesion());

    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos');
    expect(screen.getByLabelText('Correo')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('aria-invalid', 'true');

    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'otra12345' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('bloquea el botón tras el quinto fallo hasta que cambie el correo (Escenario 4)', async () => {
    renderizarIniciarSesion(
      rechazarCon('demasiados-intentos', 'Demasiados intentos. Intenta de nuevo en 15 minutos'),
    );
    escribirCredenciales('laura@mail.com', 'equivocada1');

    fireEvent.click(botonIniciarSesion());

    expect(await screen.findByRole('alert')).toHaveTextContent('Demasiados intentos');
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'balon2026' } });
    expect(botonIniciarSesion()).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'otro@mail.com' } });
    expect(botonIniciarSesion()).toBeEnabled();
  });

  it('avisa que la cuenta está desactivada (Escenario 5)', async () => {
    renderizarIniciarSesion(
      rechazarCon('cuenta-desactivada', 'Tu cuenta está desactivada. Contacta al administrador'),
    );
    escribirCredenciales('laura@mail.com', 'balon2026');

    fireEvent.click(botonIniciarSesion());

    expect(await screen.findByRole('alert')).toHaveTextContent('Tu cuenta está desactivada');
  });

  it('envía una sola vez con doble envío y muestra «Ingresando…»', async () => {
    let responder: (usuario: UsuarioAutenticado) => void = () => {};
    const servicio = renderizarIniciarSesion(
      () => new Promise((resolver) => (responder = resolver)),
    );
    escribirCredenciales('camilo.rojas@mail.com', 'golazo2026');
    const formulario = botonIniciarSesion().closest('form') as HTMLFormElement;

    fireEvent.submit(formulario);
    fireEvent.submit(formulario);

    expect(servicio.iniciarSesion).toHaveBeenCalledTimes(1);
    expect(botonIniciarSesion()).toHaveTextContent('Ingresando…');
    responder(JUGADOR_DE_PRUEBA);
    await waitFor(() => expect(screen.getByText('Empieza en 3 pasos')).toBeInTheDocument());
  });

  it('el ojo muestra y oculta la contraseña', () => {
    renderizarIniciarSesion(async () => JUGADOR_DE_PRUEBA);
    const contrasena = screen.getByLabelText('Contraseña');

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));

    expect(contrasena).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(contrasena).toHaveAttribute('type', 'password');
  });
});

describe('manejo de la sesión en la app (KAN-17)', () => {
  it('recupera la sesión de la cookie al abrir la app, por ejemplo tras recargar', async () => {
    const servicioDeSesion = crearServicioDeSesionFalso({
      consultarSesionActual: async () => ({ estado: 'activa', usuario: JUGADOR_DE_PRUEBA }),
    });

    renderizarAppEn(RUTAS.INICIO_DEL_JUGADOR, { servicioDeSesion });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Camilo Rojas' }),
    ).toBeInTheDocument();
  });

  it('una pantalla del jugador sin sesión lleva a Iniciar sesión', async () => {
    renderizarAppEn(RUTAS.INICIO_DEL_JUGADOR);

    expect(await screen.findByRole('heading', { name: 'Hola de nuevo' })).toBeInTheDocument();
  });

  it('con la sesión vencida muestra «Tu sesión expiró, ingresa de nuevo» (Escenario 7)', async () => {
    const servicioDeSesion = crearServicioDeSesionFalso({
      consultarSesionActual: async () => ({ estado: 'expirada' }),
    });

    renderizarAppEn(RUTAS.INICIO_DEL_JUGADOR, { servicioDeSesion });

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Tu sesión expiró, ingresa de nuevo',
    );
    expect(screen.getByRole('heading', { name: 'Hola de nuevo' })).toBeInTheDocument();
  });

  it('«Cerrar sesión» invalida el token y vuelve a Iniciar sesión (Escenario 6)', async () => {
    const { servicioDeSesion } = renderizarAppEn(RUTAS.INICIO_DEL_JUGADOR, {
      usuarioInicial: JUGADOR_DE_PRUEBA,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Cerrar sesión' }),
    );

    expect(await screen.findByRole('heading', { name: 'Hola de nuevo' })).toBeInTheDocument();
    expect(servicioDeSesion.cerrarSesion).toHaveBeenCalledTimes(1);
  });
});
