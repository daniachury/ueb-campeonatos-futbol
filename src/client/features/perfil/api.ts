import type {
  PerfilUsuario,
  RespuestaCambioContrasena,
  SolicitudActualizarPerfil,
  SolicitudCambiarContrasenaPerfil,
} from '@shared/usuarios/contrato-perfil';
import { pedir } from '../../common/api/client';

export async function obtenerMiPerfil(): Promise<PerfilUsuario> {
  return pedir<PerfilUsuario>('/me');
}

export async function actualizarMiPerfil(
  datos: SolicitudActualizarPerfil,
): Promise<PerfilUsuario> {
  return pedir<PerfilUsuario>('/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
}

export async function cambiarMiContrasena(
  datos: SolicitudCambiarContrasenaPerfil,
): Promise<RespuestaCambioContrasena> {
  return pedir<RespuestaCambioContrasena>('/me/contrasena', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
}
