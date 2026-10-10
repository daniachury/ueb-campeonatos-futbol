import {
  RUTAS_API_SESION,
  type SolicitudInicioDeSesion,
  type UsuarioAutenticado,
} from '@shared/usuarios/contrato-inicio-de-sesion';
import {
  RUTA_API_REGISTRO_JUGADOR,
  type JugadorRegistrado,
} from '@shared/usuarios/contrato-registro-jugador';
import type { SolicitudRegistroJugador } from '@shared/usuarios/esquema-registro-jugador';
import { pedir } from '../../common/api/client';

/** POST /api/auth/registro (UEB-Proyect-03 · KAN-16). La API responde con la cookie de sesión. */
export async function registrarJugador(
  solicitud: SolicitudRegistroJugador,
): Promise<JugadorRegistrado> {
  return pedir<JugadorRegistrado>(RUTA_API_REGISTRO_JUGADOR, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(solicitud),
  });
}

/** POST /api/auth/login (UEB-Proyect-04 · KAN-17). La API responde con la cookie de sesión. */
export async function iniciarSesion(
  credenciales: SolicitudInicioDeSesion,
): Promise<UsuarioAutenticado> {
  return pedir<UsuarioAutenticado>(RUTAS_API_SESION.INICIAR, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credenciales),
  });
}

/** POST /api/auth/logout: invalida el token y borra la cookie. */
export async function cerrarSesion(): Promise<void> {
  await pedir<null>(RUTAS_API_SESION.CERRAR, { method: 'POST' });
}

/** GET /api/auth/sesion: quién tiene la sesión según la cookie (401 si nadie). */
export async function consultarSesion(): Promise<UsuarioAutenticado> {
  return pedir<UsuarioAutenticado>(RUTAS_API_SESION.ACTUAL);
}
