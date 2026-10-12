import type { PerfilUsuario, SolicitudActualizarPerfil } from '@shared/usuarios/contrato-perfil';
import { CorreoElectronico } from '../dominio/objeto-valor/correo-electronico';
import { NombreCompleto } from '../dominio/objeto-valor/nombre-completo';
import { Telefono } from '../dominio/objeto-valor/telefono';
import { ErrorContrasenaActualIncorrecta } from './errores/error-contrasena-actual-incorrecta';
import { ErrorCorreoYaRegistrado } from './errores/error-correo-ya-registrado';
import type { CifradorDeContrasenas } from './puertos/cifrador-de-contrasenas';
import type { Reloj } from './puertos/reloj';
import type { RepositorioDeUsuarios } from './puertos/repositorio-de-usuarios';

export interface DependenciasActualizarPerfil {
  repositorioDeUsuarios: RepositorioDeUsuarios;
  cifradorDeContrasenas: CifradorDeContrasenas;
  reloj: Reloj;
}

export class ActualizarPerfil {
  readonly #repositorioDeUsuarios: RepositorioDeUsuarios;
  readonly #cifradorDeContrasenas: CifradorDeContrasenas;
  readonly #reloj: Reloj;

  constructor(dependencias: DependenciasActualizarPerfil) {
    this.#repositorioDeUsuarios = dependencias.repositorioDeUsuarios;
    this.#cifradorDeContrasenas = dependencias.cifradorDeContrasenas;
    this.#reloj = dependencias.reloj;
  }

  async ejecutar(usuarioId: string, solicitud: SolicitudActualizarPerfil): Promise<PerfilUsuario> {
    const usuario = await this.#repositorioDeUsuarios.buscarPorId(usuarioId);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    const datosAActualizar: { nombreCompleto?: string; correo?: string; telefono?: string } = {};

    // 1. Validar nombre completo si viene
    if (solicitud.nombreCompleto !== undefined) {
      const nombreVo = NombreCompleto.crear(solicitud.nombreCompleto);
      datosAActualizar.nombreCompleto = nombreVo.valor;
    }

    // 2. Validar teléfono si viene
    if (solicitud.telefono !== undefined) {
      const telefonoVo = Telefono.crear(solicitud.telefono);
      datosAActualizar.telefono = telefonoVo.valor;
    }

    // 3. Validar correo si viene y es distinto al actual
    if (solicitud.correo !== undefined) {
      const correoVo = CorreoElectronico.crear(solicitud.correo);
      if (correoVo.valor !== usuario.correo.valor) {
        // Escenario 2: Requiere verificar la contraseña actual
        if (!solicitud.contrasenaActual) {
          throw new ErrorContrasenaActualIncorrecta();
        }

        const contrasenaCorrecta = await this.#cifradorDeContrasenas.coincide(
          solicitud.contrasenaActual,
          usuario.contrasenaCifrada,
        );

        if (!contrasenaCorrecta) {
          throw new ErrorContrasenaActualIncorrecta();
        }

        // Escenario 3: Verificar que el nuevo correo no esté registrado por otra cuenta
        const usuarioConMismoCorreo = await this.#repositorioDeUsuarios.buscarPorCorreo(correoVo);
        if (usuarioConMismoCorreo && usuarioConMismoCorreo.id !== usuarioId) {
          throw new ErrorCorreoYaRegistrado();
        }

        datosAActualizar.correo = correoVo.valor;
      }
    }

    // Guardar si hubo cambios en los campos permitidos
    if (Object.keys(datosAActualizar).length > 0) {
      await this.#repositorioDeUsuarios.actualizarPerfil(
        usuarioId,
        datosAActualizar,
        this.#reloj.ahora(),
      );
    }

    return {
      id: usuario.id,
      nombreCompleto: datosAActualizar.nombreCompleto ?? usuario.nombreCompleto.valor,
      correo: datosAActualizar.correo ?? usuario.correo.valor,
      telefono: datosAActualizar.telefono ?? usuario.telefono.valor,
      rol: usuario.rol,
    };
  }
}
