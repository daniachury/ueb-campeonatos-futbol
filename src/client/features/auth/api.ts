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

/** POST /api/auth/recuperar-cuenta (KAN-50 · Escenario 1 y 2). */
export async function solicitarRecuperacionCuenta(
  correo: string,
): Promise<import('@shared/usuarios/contrato-recuperacion-cuenta').RespuestaRecuperacionCuenta> {
  const { RUTAS_API_RECUPERACION } = await import(
    '@shared/usuarios/contrato-recuperacion-cuenta'
  );
  return pedir(RUTAS_API_RECUPERACION.SOLICITAR, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo }),
  });
}

/** GET /api/auth/validar-token-recuperacion?token=... (KAN-50 · Escenarios 3 y 6). */
export async function validarTokenRecuperacion(
  token: string,
): Promise<import('@shared/usuarios/contrato-recuperacion-cuenta').RespuestaValidacionTokenRecuperacion> {
  const { RUTAS_API_RECUPERACION } = await import(
    '@shared/usuarios/contrato-recuperacion-cuenta'
  );
  return pedir(`${RUTAS_API_RECUPERACION.VALIDAR_TOKEN}?token=${encodeURIComponent(token)}`);
}

/** POST /api/auth/restablecer-contrasena (KAN-50 · Escenario 5). */
export async function restablecerContrasena(
  solicitud: import('@shared/usuarios/contrato-recuperacion-cuenta').SolicitudRestablecerContrasena,
): Promise<import('@shared/usuarios/contrato-recuperacion-cuenta').RespuestaRestablecerContrasena> {
  const { RUTAS_API_RECUPERACION } = await import(
    '@shared/usuarios/contrato-recuperacion-cuenta'
  );
  return pedir(RUTAS_API_RECUPERACION.RESTABLECER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(solicitud),
  });
}
