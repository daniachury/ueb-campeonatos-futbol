import {
  CODIGOS_ERROR_RECUPERACION,
  MENSAJES_RECUPERACION,
} from '@shared/usuarios/contrato-recuperacion-cuenta';
import { normalizarCorreo } from '@shared/usuarios/reglas-registro-jugador';
import { AppError } from '../../core/errors';
import { CorreoElectronico } from '../usuarios/dominio/objeto-valor/correo-electronico';
import { ContrasenaPlana } from '../usuarios/dominio/objeto-valor/contrasena-plana';
import type { CifradorDeContrasenas } from '../usuarios/aplicacion/puertos/cifrador-de-contrasenas';
import type { RepositorioDeUsuarios } from '../usuarios/aplicacion/puertos/repositorio-de-usuarios';
import { calcularHashDeToken } from './sesiones.service';
import type { TokensRecuperacionRepository } from './tokens-recuperacion.repository';

const DURACION_TOKEN_RECUPERACION_MS = 60 * 60 * 1000; // 60 minutos
const BYTES_DEL_TOKEN = 32;

export function crearTokensRecuperacionService(
  tokensRepo: TokensRecuperacionRepository,
  usuariosRepo: RepositorioDeUsuarios,
  cifrador: CifradorDeContrasenas,
  ahora: () => Date = () => new Date(),
) {
  return {
    /**
     * KAN-50 · Escenarios 1 y 2:
     * Genera un token de un solo uso válido por 60 min para jugador, capitán o admin.
     */
    async solicitarRecuperacion(
      correoPlano: string,
    ): Promise<{ token: string; enlace: string; mensaje: string }> {
      const correoNormalizado = normalizarCorreo(correoPlano);
      let usuario;
      try {
        const objetoCorreo = CorreoElectronico.crear(correoNormalizado);
        usuario = await usuariosRepo.buscarPorCorreo(objetoCorreo);
      } catch {
        usuario = null;
      }

      if (!usuario || !usuario.activo || (usuario.rol !== 'jugador' && usuario.rol !== 'admin')) {
        throw new AppError(
          404,
          CODIGOS_ERROR_RECUPERACION.CORREO_NO_ENCONTRADO,
          MENSAJES_RECUPERACION.CORREO_NO_ENCONTRADO,
        );
      }

      const token = generarTokenAleatorio();
      const tokenHash = await calcularHashDeToken(token);
      const fechaCreacion = ahora();
      const expiraEn = new Date(fechaCreacion.getTime() + DURACION_TOKEN_RECUPERACION_MS);

      await tokensRepo.guardar({
        id: crypto.randomUUID(),
        usuarioId: usuario.id,
        tokenHash,
        expiraEn: expiraEn.toISOString(),
        creadoEn: fechaCreacion.toISOString(),
      });

      return {
        token,
        enlace: `/restablecer-contrasena?token=${token}`,
        mensaje: 'Enlace de recuperación generado',
      };
    },

    /**
     * KAN-50 · Escenario 6:
     * Valida que el token exista, no esté vencido (> 60m) ni haya sido consumido.
     */
    async validarToken(token: string) {
      const tokenHash = await calcularHashDeToken(token);
      const registro = await tokensRepo.buscarPorHash(tokenHash);

      if (!registro || registro.usado || new Date(registro.expiraEn) <= ahora()) {
        throw new AppError(
          400,
          CODIGOS_ERROR_RECUPERACION.TOKEN_INVALIDO_O_EXPIRADO,
          MENSAJES_RECUPERACION.TOKEN_INVALIDO_O_EXPIRADO,
        );
      }

      if (!registro.usuario.activo) {
        throw new AppError(
          400,
          CODIGOS_ERROR_RECUPERACION.TOKEN_INVALIDO_O_EXPIRADO,
          MENSAJES_RECUPERACION.TOKEN_INVALIDO_O_EXPIRADO,
        );
      }

      return {
        valido: true,
        usuarioId: registro.usuarioId,
        correo: registro.usuario.correo,
      };
    },

    /**
     * KAN-50 · Escenario 5:
     * Cifra la nueva contraseña, actualiza usuarios, marca token usado y revoca todas las sesiones.
     */
    async restablecerContrasena(token: string, nuevaContrasena: string): Promise<void> {
      const tokenHash = await calcularHashDeToken(token);
      const registro = await tokensRepo.buscarPorHash(tokenHash);

      if (!registro || registro.usado || new Date(registro.expiraEn) <= ahora()) {
        throw new AppError(
          400,
          CODIGOS_ERROR_RECUPERACION.TOKEN_INVALIDO_O_EXPIRADO,
          MENSAJES_RECUPERACION.TOKEN_INVALIDO_O_EXPIRADO,
        );
      }

      const contrasenaPlana = ContrasenaPlana.crear(nuevaContrasena);
      const contrasenaCifrada = await cifrador.cifrar(contrasenaPlana);
      const fechaActual = ahora().toISOString();

      await tokensRepo.restablecerContrasenaYRevocarSesiones(
        registro.usuarioId,
        registro.id,
        contrasenaCifrada.obtenerHashParaGuardar(),
        fechaActual,
      );
    },
  };
}

export type TokensRecuperacionService = ReturnType<typeof crearTokensRecuperacionService>;

function generarTokenAleatorio(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(BYTES_DEL_TOKEN));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}
