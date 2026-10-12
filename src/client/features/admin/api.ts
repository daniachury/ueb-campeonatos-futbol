import { pedir } from '../../common/api/client';
import {
  RUTAS_API_ADMIN_USUARIOS,
  type AdminPromovido,
  type AdminRegistrado,
  type SolicitudRegistroAdmin,
} from '@shared/usuarios/contrato-registro-admin';

/**
 * Registra un nuevo administrador (KAN-18 · POST /api/admin/usuarios).
 * Devuelve la respuesta con la contraseña temporal generada.
 */
export async function registrarAdmin(datos: SolicitudRegistroAdmin): Promise<AdminRegistrado> {
  return pedir<AdminRegistrado>(RUTAS_API_ADMIN_USUARIOS.CREAR, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
}

/**
 * Promueve a un jugador existente a administrador (KAN-18 · POST /api/admin/usuarios/:id/promover).
 */
export async function promoverJugador(jugadorId: string): Promise<AdminPromovido> {
  return pedir<AdminPromovido>(RUTAS_API_ADMIN_USUARIOS.PROMOVER(jugadorId), {
    method: 'POST',
  });
}

/**
 * Cambia la contraseña obligatoria del primer ingreso (KAN-18 · PATCH /api/auth/cambiar-contrasena).
 */
export async function cambiarContrasena(datos: {
  contrasenaActual: string;
  contrasenaNueva: string;
}): Promise<{ mensaje: string }> {
  return pedir<{ mensaje: string }>(RUTAS_API_ADMIN_USUARIOS.CAMBIAR_CONTRASENA, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
}
