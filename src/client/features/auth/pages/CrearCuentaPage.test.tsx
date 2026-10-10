// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { JugadorRegistrado } from '@shared/usuarios/contrato-registro-jugador';
import { ProveedorDeServicios } from '../../../app/servicios';
import { RUTAS, type EstadoAlLlegarAlInicio } from '../../../common/navegacion';
import { ProveedorDeSesion, useSesion } from '../../../common/sesion/ProveedorDeSesion';
import { crearServicioDeSesionFalso } from '../../../test/renderizar-app';
import { ErrorCorreoYaRegistrado, type ServicioDeRegistro } from '../servicio-de-registro';
import { CrearCuentaPage } from './CrearCuentaPage';

const JUGADORA_LAURA: JugadorRegistrado = {
  id: 'jugador-001',
  nombreCompleto: 'Laura Gómez',
  correo: 'laura@mail.com',
  telefono: '3001234567',
  rol: 'jugador',
};

/** Pantalla mínima de destino: muestra lo que Crear cuenta dejó al navegar. */
function InicioDePrueba() {
  const { usuarioActual } = useSesion();
  const estado = useLocation().state as EstadoAlLlegarAlInicio | null;
  return (
    <>
      <p>Sesión de {usuarioActual?.nombreCompleto}</p>
      <p>{estado?.mensajeDeBienvenida}</p>
    </>
  );
}

function renderizarCrearCuenta(registrarJugador: ServicioDeRegistro['registrarJugador']) {
  const servicioDeRegistro = { registrarJugador: vi.fn(registrarJugador) };
  const servicioDeSesion = crearServicioDeSesionFalso();
  render(
    <ProveedorDeServicios servicios={{ servicioDeRegistro, servicioDeSesion }}>
      <ProveedorDeSesion servicioDeSesion={servicioDeSesion} usuarioInicial={null}>
        <MemoryRouter initialEntries={[RUTAS.CREAR_CUENTA]}>
          <Routes>
            <Route path={RUTAS.CREAR_CUENTA} element={<CrearCuentaPage />} />
            <Route path={RUTAS.INICIO_DEL_JUGADOR} element={<InicioDePrueba />} />
          </Routes>
        </MemoryRouter>
      </ProveedorDeSesion>
    </ProveedorDeServicios>,
  );
  return servicioDeRegistro;
}

function escribir(etiqueta: string, valor: string) {
  const campo = screen.getByLabelText(etiqueta);
  fireEvent.change(campo, { target: { value: valor } });
  fireEvent.blur(campo);
}

function llenarFormularioDeLaura() {
  escribir('Nombre completo', 'Laura Gómez');
  escribir('Correo', 'Laura@Mail.com ');
  escribir('Teléfono', '3001234567');
  escribir('Contraseña', 'clave123');
  escribir('Confirmar contraseña', 'clave123');
}

const botonCrearCuenta = () => screen.getByRole('button', { name: /Crear cuenta|Creando/ });

describe('CrearCuentaPage (KAN-16)', () => {
  it('muestra la pantalla v3 · M02 con el botón deshabilitado mientras falten datos', () => {
    renderizarCrearCuenta(async () => JUGADORA_LAURA);

    expect(screen.getByRole('heading', { name: /Crea tu ficha/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Liga Bosque' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver a iniciar sesión' })).toHaveAttribute(
      'href',
      RUTAS.INICIAR_SESION,
    );
    expect(screen.getByRole('link', { name: 'Inicia sesión' })).toHaveAttribute(
      'href',
      RUTAS.INICIAR_SESION,
    );
    expect(botonCrearCuenta()).toBeDisabled();
    expect(screen.getByText('Completa todos los campos para continuar')).toBeInTheDocument();
  });

  it('registra, inicia la sesión y lleva al Inicio con la bienvenida (Escenario 1)', async () => {
    const servicio = renderizarCrearCuenta(async () => JUGADORA_LAURA);
    llenarFormularioDeLaura();

    fireEvent.click(botonCrearCuenta());

    expect(await screen.findByText('Sesión de Laura Gómez')).toBeInTheDocument();
    expect(screen.getByText('¡Bienvenida, Laura! Tu cuenta fue creada')).toBeInTheDocument();
    expect(servicio.registrarJugador).toHaveBeenCalledWith({
      nombreCompleto: 'Laura Gómez',
      correo: 'laura@mail.com',
      telefono: '3001234567',
      contrasena: 'clave123',
    });
  });

  it('avisa junto al correo que ya está registrado y ofrece iniciar sesión (Escenario 2)', async () => {
    renderizarCrearCuenta(async () => {
      throw new ErrorCorreoYaRegistrado();
    });
    llenarFormularioDeLaura();

    fireEvent.click(botonCrearCuenta());

    expect(await screen.findByText('Este correo ya está registrado')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '¿Olvidaste tu contraseña? Inicia sesión' }),
    ).toHaveAttribute('href', RUTAS.INICIAR_SESION);
    expect(screen.getByLabelText('Correo')).toHaveAttribute('aria-invalid', 'true');
    expect(botonCrearCuenta()).toBeDisabled();
    expect(screen.getByText('Usa otro correo o inicia sesión')).toBeInTheDocument();
  });

  it('muestra cómo se guardará el correo cuando trae mayúsculas o espacios (v3 · M02)', () => {
    renderizarCrearCuenta(async () => JUGADORA_LAURA);

    escribir('Correo', 'Laura@Mail.com ');

    expect(screen.getByText('laura@mail.com')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo')).toHaveAccessibleDescription(
      'Se guardará como laura@mail.com',
    );
  });

  it('muestra el error del teléfono al salir del campo y mantiene el botón deshabilitado (Escenario 3)', () => {
    renderizarCrearCuenta(async () => JUGADORA_LAURA);
    llenarFormularioDeLaura();

    escribir('Teléfono', '300abc');

    expect(screen.getByText('Ingresa un teléfono válido (7 a 15 dígitos)')).toBeInTheDocument();
    expect(screen.getByLabelText('Teléfono')).toHaveAttribute('aria-invalid', 'true');
    expect(botonCrearCuenta()).toBeDisabled();
    expect(screen.getByText('Corrige 1 campo para continuar')).toBeInTheDocument();
  });

  it('envía una sola vez con doble clic y muestra «Creando…» mientras responde (Escenario 6)', async () => {
    let responderAlRegistro: (jugador: JugadorRegistrado) => void = () => {};
    const servicio = renderizarCrearCuenta(
      () => new Promise((resolver) => (responderAlRegistro = resolver)),
    );
    llenarFormularioDeLaura();
    const formulario = botonCrearCuenta().closest('form') as HTMLFormElement;

    fireEvent.submit(formulario);
    fireEvent.submit(formulario);

    expect(servicio.registrarJugador).toHaveBeenCalledTimes(1);
    expect(botonCrearCuenta()).toHaveTextContent('Creando…');
    expect(botonCrearCuenta()).toBeDisabled();
    responderAlRegistro(JUGADORA_LAURA);
    expect(await screen.findByText('Sesión de Laura Gómez')).toBeInTheDocument();
  });

  it('muestra un mensaje general si la API falla por otra razón', async () => {
    renderizarCrearCuenta(async () => {
      throw new Error('Sin conexión');
    });
    llenarFormularioDeLaura();

    fireEvent.click(botonCrearCuenta());

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos crear tu cuenta');
    expect(botonCrearCuenta()).toHaveTextContent('Crear cuenta');
  });
});
