import { render } from '@testing-library/react';
import { MemoryRouter, useRoutes } from 'react-router';
import { vi } from 'vitest';
import type { UsuarioAutenticado } from '@shared/usuarios/contrato-inicio-de-sesion';
import { rutas } from '../app/rutas';
import { ProveedorDeServicios, type ServiciosDeLaApp } from '../app/servicios';
import { ProveedorDeSesion } from '../common/sesion/ProveedorDeSesion';
import type { ServicioDeSesion } from '../common/sesion/servicio-de-sesion';

export const JUGADOR_DE_PRUEBA: UsuarioAutenticado = {
  id: 'jugador-001',
  nombreCompleto: 'Camilo Rojas',
  correo: 'camilo.rojas@mail.com',
  telefono: '3104567890',
  rol: 'jugador',
};

export const ADMIN_DE_PRUEBA: UsuarioAutenticado = {
  id: 'admin-001',
  nombreCompleto: 'Laura Administradora',
  correo: 'admin@unbosque.edu.co',
  telefono: '3001234567',
  rol: 'admin',
};

/** Servicio de sesión falso: por defecto nadie tiene sesión y cerrar siempre funciona. */
export function crearServicioDeSesionFalso(cambios: Partial<ServicioDeSesion> = {}) {
  return {
    consultarSesionActual: vi.fn<ServicioDeSesion['consultarSesionActual']>(
      cambios.consultarSesionActual ?? (async () => ({ estado: 'sin-sesion' })),
    ),
    iniciarSesion: vi.fn<ServicioDeSesion['iniciarSesion']>(
      cambios.iniciarSesion ?? (async () => JUGADOR_DE_PRUEBA),
    ),
    cerrarSesion: vi.fn<ServicioDeSesion['cerrarSesion']>(
      cambios.cerrarSesion ?? (async () => undefined),
    ),
  };
}

/*
 * Se usa MemoryRouter + useRoutes y no createMemoryRouter: el router de datos crea un Request
 * con el AbortSignal de jsdom, que el fetch de Node rechaza al redirigir.
 */
function MapaDeRutas() {
  return useRoutes(rutas);
}

interface OpcionesDeRenderizado {
  /** null = sin sesión; omitido = la app consulta al servicio de sesión, como al abrir. */
  usuarioInicial?: UsuarioAutenticado | null;
  estado?: unknown;
  servicioDeSesion?: ServicioDeSesion;
  servicioDeRegistro?: ServiciosDeLaApp['servicioDeRegistro'];
}

/** Monta la app completa en `ruta`, con sus proveedores, como lo hace main.tsx. */
export function renderizarAppEn(ruta: string, opciones: OpcionesDeRenderizado = {}) {
  const servicioDeSesion = opciones.servicioDeSesion ?? crearServicioDeSesionFalso();
  const servicios: ServiciosDeLaApp = {
    servicioDeRegistro: opciones.servicioDeRegistro ?? {
      registrarJugador: () => Promise.reject(new Error('Esta prueba no registra jugadores')),
    },
    servicioDeSesion,
  };
  const props =
    'usuarioInicial' in opciones ? { usuarioInicial: opciones.usuarioInicial ?? null } : {};

  render(
    <ProveedorDeServicios servicios={servicios}>
      <ProveedorDeSesion servicioDeSesion={servicioDeSesion} {...props}>
        <MemoryRouter initialEntries={[{ pathname: ruta, state: opciones.estado ?? null }]}>
          <MapaDeRutas />
        </MemoryRouter>
      </ProveedorDeSesion>
    </ProveedorDeServicios>,
  );
  return { servicioDeSesion };
}
