import type {
  SolicitudInicioDeSesion,
  UsuarioAutenticado,
} from '../../../../shared/usuarios/contrato-inicio-de-sesion';
import { REGLAS_INICIO_DE_SESION } from '../../../../shared/usuarios/reglas-inicio-de-sesion';
import { ErrorDeValidacionDeDominio } from '../dominio/errores/error-de-validacion-dominio';
import { ContrasenaCifrada } from '../dominio/objeto-valor/contrasena-cifrada';
import { CorreoElectronico } from '../dominio/objeto-valor/correo-electronico';
import type { Usuario } from '../dominio/usuario';
import {
  ErrorCredencialesIncorrectas,
  ErrorCuentaDesactivada,
  ErrorDemasiadosIntentos,
} from './errores/errores-de-inicio-de-sesion';
import type { CifradorDeContrasenas } from './puertos/cifrador-de-contrasenas';
import type {
  IntentosFallidos,
  RegistroDeIntentosFallidos,
} from './puertos/registro-de-intentos-fallidos';
import type { Reloj } from './puertos/reloj';
import type { RepositorioDeUsuarios } from './puertos/repositorio-de-usuarios';

/**
 * Se compara contra este valor cuando el correo no existe, para que la respuesta tarde
 * lo mismo que con una contraseña incorrecta (Escenario 3).
 */
const CONTRASENA_DE_REFERENCIA = ContrasenaCifrada.desdeHash('sin-cuenta-con-este-correo');
const MILISEGUNDOS_DE_BLOQUEO = REGLAS_INICIO_DE_SESION.minutosDeBloqueo * 60 * 1000;

export interface DependenciasDeIniciarSesion {
  repositorioDeUsuarios: RepositorioDeUsuarios;
  cifradorDeContrasenas: CifradorDeContrasenas;
  registroDeIntentosFallidos: RegistroDeIntentosFallidos;
  reloj: Reloj;
}

/**
 * Caso de uso «Iniciar sesión» (KAN-17).
 * Verifica las credenciales, aplica el bloqueo por intentos y devuelve quién entró.
 * Crear la sesión (token y cookie) es trabajo de la capa HTTP.
 */
export class IniciarSesion {
  readonly #repositorioDeUsuarios: RepositorioDeUsuarios;
  readonly #cifradorDeContrasenas: CifradorDeContrasenas;
  readonly #registroDeIntentosFallidos: RegistroDeIntentosFallidos;
  readonly #reloj: Reloj;

  constructor(dependencias: DependenciasDeIniciarSesion) {
    this.#repositorioDeUsuarios = dependencias.repositorioDeUsuarios;
    this.#cifradorDeContrasenas = dependencias.cifradorDeContrasenas;
    this.#registroDeIntentosFallidos = dependencias.registroDeIntentosFallidos;
    this.#reloj = dependencias.reloj;
  }

  async ejecutar(solicitud: SolicitudInicioDeSesion): Promise<UsuarioAutenticado> {
    const correo = convertirEnCorreoOFallar(solicitud.correo);
    const ahora = this.#reloj.ahora();

    // 1. Bloqueado: se rechaza incluso la contraseña correcta, sin consultar nada más (Escenario 4).
    const intentos = await this.#registroDeIntentosFallidos.obtener(correo);
    if (estaBloqueado(intentos, ahora)) {
      throw new ErrorDemasiadosIntentos();
    }

    // 2. Siempre se compara una contraseña, exista o no el correo (Escenario 3).
    const usuario = await this.#repositorioDeUsuarios.buscarPorCorreo(correo);
    const contrasenaCoincide = await this.#cifradorDeContrasenas.coincide(
      solicitud.contrasena,
      usuario?.contrasenaCifrada ?? CONTRASENA_DE_REFERENCIA,
    );
    if (usuario === null || !contrasenaCoincide) {
      await this.#registrarFallo(correo, intentos, ahora);
    }

    // 3. Credenciales correctas: el contador vuelve a cero (Escenario 4).
    await this.#registroDeIntentosFallidos.reiniciar(correo);
    const usuarioVerificado = usuario as Usuario;
    if (!usuarioVerificado.activo) {
      throw new ErrorCuentaDesactivada();
    }

    return convertirEnUsuarioAutenticado(usuarioVerificado);
  }

  /** Suma el fallo y bloquea al llegar al límite. Siempre termina lanzando un error. */
  async #registrarFallo(
    correo: CorreoElectronico,
    intentos: IntentosFallidos,
    ahora: Date,
  ): Promise<never> {
    // Si hubo un bloqueo que ya venció, se empieza a contar de nuevo.
    const fallosAnteriores = intentos.bloqueadoHasta === null ? intentos.fallosSeguidos : 0;
    const fallosSeguidos = fallosAnteriores + 1;
    const alcanzoElLimite = fallosSeguidos >= REGLAS_INICIO_DE_SESION.fallosSeguidosAntesDelBloqueo;

    await this.#registroDeIntentosFallidos.guardar(correo, {
      fallosSeguidos,
      bloqueadoHasta: alcanzoElLimite ? new Date(ahora.getTime() + MILISEGUNDOS_DE_BLOQUEO) : null,
    });
    throw alcanzoElLimite ? new ErrorDemasiadosIntentos() : new ErrorCredencialesIncorrectas();
  }
}

/** Un correo con formato inválido no puede tener cuenta: se responde igual que a uno inexistente. */
function convertirEnCorreoOFallar(correoEscrito: string): CorreoElectronico {
  try {
    return CorreoElectronico.crear(correoEscrito);
  } catch (error) {
    if (error instanceof ErrorDeValidacionDeDominio) throw new ErrorCredencialesIncorrectas();
    throw error;
  }
}

function estaBloqueado(intentos: IntentosFallidos, ahora: Date): boolean {
  return intentos.bloqueadoHasta !== null && intentos.bloqueadoHasta > ahora;
}

function convertirEnUsuarioAutenticado(usuario: Usuario): UsuarioAutenticado {
  return {
    id: usuario.id,
    nombreCompleto: usuario.nombreCompleto.valor,
    correo: usuario.correo.valor,
    telefono: usuario.telefono.valor,
    rol: usuario.rol,
  };
}
