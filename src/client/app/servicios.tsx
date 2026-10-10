import { createContext, useContext, type ReactNode } from 'react';
import type { ServicioDeSesion } from '../common/sesion/servicio-de-sesion';
import type { ServicioDeRegistro } from '../features/auth/servicio-de-registro';
import { ServicioDeRegistroHttp } from '../features/auth/servicio-de-registro-http';
import { ServicioDeSesionHttp } from '../features/auth/servicio-de-sesion-http';

/** Todo lo que las pantallas necesitan del mundo exterior, descrito por sus interfaces. */
export interface ServiciosDeLaApp {
  servicioDeRegistro: ServicioDeRegistro;
  servicioDeSesion: ServicioDeSesion;
}

/**
 * Raíz de composición: el ÚNICO lugar que decide qué implementación usa la app.
 * Las pruebas montan las pantallas con servicios falsos a través de ProveedorDeServicios.
 */
export function crearServiciosDeLaApp(): ServiciosDeLaApp {
  return {
    servicioDeRegistro: new ServicioDeRegistroHttp(),
    servicioDeSesion: new ServicioDeSesionHttp(),
  };
}

const ContextoDeServicios = createContext<ServiciosDeLaApp | null>(null);

export function ProveedorDeServicios({
  servicios,
  children,
}: {
  servicios: ServiciosDeLaApp;
  children: ReactNode;
}) {
  return <ContextoDeServicios.Provider value={servicios}>{children}</ContextoDeServicios.Provider>;
}

export function useServicios(): ServiciosDeLaApp {
  const servicios = useContext(ContextoDeServicios);
  if (servicios === null) {
    throw new Error('useServicios debe usarse dentro de <ProveedorDeServicios>');
  }
  return servicios;
}
