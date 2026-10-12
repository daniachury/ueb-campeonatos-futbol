import type {
  RespuestaCambioContrasena,
  SolicitudCambiarContrasenaPerfil,
} from '@shared/usuarios/contrato-perfil';
import type { SesionesRepository } from '../../auth/sesiones.repository';
import { ContrasenaPlana } from '../dominio/objeto-valor/contrasena-plana';
import { ErrorContrasenaActualIncorrecta } from './errores/error-contrasena-actual-incorrecta';
import type { CifradorDeContrasenas } from './puertos/cifrador-de-contrasenas';
import type { Reloj } from './puertos/reloj';
import type { RepositorioDeUsuarios } from './puertos/repositorio-de-usuarios';

export interface DependenciasCambiarContrasenaPerfil {
  repositorioDeUsuarios: RepositorioDeUsuarios;
  sesionesRepository: SesionesRepository;
  cifradorDeContrasenas: CifradorDeContrasenas;
  reloj: Reloj;
}

export class CambiarContrasenaPerfil {
  readonly #repositorioDeUsuarios: RepositorioDeUsuarios;
  readonly #sesionesRepository: SesionesRepository;
  readonly #cifradorDeContrasenas: CifradorDeContrasenas;
  readonly #reloj: Reloj;

  constructor(dependencias: DependenciasCambiarContrasenaPerfil) {
    this.#repositorioDeUsuarios = dependencias.repositorioDeUsuarios;
    this.#sesionesRepository = dependencias.sesionesRepository;
    this.#cifradorDeContrasenas = dependencias.cifradorDeContrasenas;
    this.#reloj = dependencias.reloj;
  }

  async ejecutar(
    usuarioId: string,
    solicitud: SolicitudCambiarContrasenaPerfil,
    hashTokenActual?: string,
  ): Promise<RespuestaCambioContrasena> {
    const usuario = await this.#repositorioDeUsuarios.buscarPorId(usuarioId);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // 1. Validar contraseña actual (Escenario 4)
    const coincide = await this.#cifradorDeContrasenas.coincide(
      solicitud.contrasenaActual,
      usuario.contrasenaCifrada,
    );

    if (!coincide) {
      throw new ErrorContrasenaActualIncorrecta();
    }

    // 2. Validar reglas de la nueva contraseña con objeto de valor
    const nuevaPlana = ContrasenaPlana.crear(solicitud.nuevaContrasena);
    const nuevaCifrada = await this.#cifradorDeContrasenas.cifrar(nuevaPlana);

    // 3. Guardar nueva contraseña cifrada
    await this.#repositorioDeUsuarios.actualizarContrasena(
      usuarioId,
      nuevaCifrada,
      this.#reloj.ahora(),
    );

    // 4. Invalidar todas las demás sesiones abiertas del usuario (Escenario 4)
    if (hashTokenActual) {
      await this.#sesionesRepository.eliminarOtrasSesionesDelUsuario(usuarioId, hashTokenActual);
    }

    return {
      mensaje: 'Contraseña actualizada',
    };
  }
}
