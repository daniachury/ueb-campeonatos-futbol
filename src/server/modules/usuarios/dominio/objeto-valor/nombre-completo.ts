import {
  REGLAS_NOMBRE_COMPLETO,
  normalizarNombreCompleto,
} from '../../../../../shared/usuarios/reglas-registro-jugador';
import { ErrorDeValidacionDeDominio } from '../errores/error-de-validacion-dominio';
import { ObjetoDeValorDeTexto } from './objeto-de-valor-texto';

export class NombreCompleto extends ObjetoDeValorDeTexto {
  /** Privado: la única puerta de entrada es crear(), que valida primero. */
  private constructor(nombreValidado: string) {
    super(nombreValidado);
  }

  static crear(nombreIngresado: string): NombreCompleto {
    const nombreNormalizado = normalizarNombreCompleto(nombreIngresado);

    if (!NombreCompleto.cumpleLasReglas(nombreNormalizado)) {
      throw new ErrorDeValidacionDeDominio('nombreCompleto', REGLAS_NOMBRE_COMPLETO.mensajeError);
    }
    return new NombreCompleto(nombreNormalizado);
  }

  /** "Laura Gómez" → "Laura". Sirve para el saludo de bienvenida. */
  get primerNombre(): string {
    return this.valor.split(' ')[0] ?? this.valor;
  }

  private static cumpleLasReglas(nombre: string): boolean {
    const { longitudMinima, longitudMaxima, patronCaracteresPermitidos } = REGLAS_NOMBRE_COMPLETO;
    const tieneLongitudPermitida =
      nombre.length >= longitudMinima && nombre.length <= longitudMaxima;

    return tieneLongitudPermitida && patronCaracteresPermitidos.test(nombre);
  }
}
