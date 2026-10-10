import type { UsuarioAutenticado } from '@shared/usuarios/contrato-inicio-de-sesion';
import { COOKIE_DE_SESION } from '../../core/cookie-de-sesion';
import type { SesionesRepository } from './sesiones.repository';

const BYTES_DEL_TOKEN = 32;

/** Resultado de revisar el token de una cookie. */
export type ResultadoDeValidacion =
  | { estado: 'valida'; usuario: UsuarioAutenticado }
  | { estado: 'expirada' }
  | { estado: 'invalida' };

export interface SesionIniciada {
  /** Va solo en la cookie: nunca se guarda en la base de datos. */
  token: string;
  expiraEn: Date;
}

/**
 * Casos de uso de sesiones. No sabe nada de HTTP ni de SQL.
 * Recibe el repositorio y el reloj como parámetros para poder probarlo.
 */
export function crearSesionesService(
  repositorio: SesionesRepository,
  ahora: () => Date = () => new Date(),
) {
  return {
    /** KAN-16 y KAN-17: quien se registra o inicia sesión queda con una sesión de 24 h. */
    async iniciar(usuarioId: string): Promise<SesionIniciada> {
      const token = generarTokenAleatorio();
      const fechaDeInicio = ahora();
      const expiraEn = new Date(
        fechaDeInicio.getTime() + COOKIE_DE_SESION.duracionEnSegundos * 1000,
      );

      await repositorio.crear({
        id: crypto.randomUUID(),
        usuarioId,
        hashToken: await calcularHashDeToken(token),
        expiraEn: expiraEn.toISOString(),
        creadoEn: fechaDeInicio.toISOString(),
      });

      return { token, expiraEn };
    },

    /**
     * KAN-17: revisa el token de la cookie.
     * - Vencido (Escenario 7) → 'expirada', y se borra para que no se pueda volver a usar.
     * - Inexistente (por ejemplo, ya cerrado, Escenario 6) o de una cuenta desactivada → 'invalida'.
     */
    async validar(token: string): Promise<ResultadoDeValidacion> {
      const hashToken = await calcularHashDeToken(token);
      const sesion = await repositorio.buscarPorHashDelToken(hashToken);
      if (sesion === null || !sesion.usuario.activo) return { estado: 'invalida' };

      if (new Date(sesion.expiraEn) <= ahora()) {
        await repositorio.eliminarPorHashDelToken(hashToken);
        return { estado: 'expirada' };
      }

      const { activo: _activo, ...usuario } = sesion.usuario;
      return { estado: 'valida', usuario };
    },

    /** KAN-17 · Escenario 6: el token deja de servir; usarlo de nuevo devuelve 401. */
    async cerrar(token: string): Promise<void> {
      await repositorio.eliminarPorHashDelToken(await calcularHashDeToken(token));
    },
  };
}

export type SesionesService = ReturnType<typeof crearSesionesService>;

/** SHA-256 en hexadecimal: así se guarda y se busca el token. */
export async function calcularHashDeToken(token: string): Promise<string> {
  const resumen = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(resumen), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** 32 bytes aleatorios en base64url: imposible de adivinar y seguro para una cookie. */
function generarTokenAleatorio(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(BYTES_DEL_TOKEN));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}
