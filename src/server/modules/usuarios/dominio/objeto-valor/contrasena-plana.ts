import { REGLAS_CONTRASENA } from '../../../../../shared/usuarios/reglas-registro-jugador';
import { ErrorDeValidacionDeDominio } from '../errores/error-de-validacion-dominio';

const TEXTO_OCULTO = '[contraseña oculta]';

/**
 * La contraseña tal como la escribió la persona. Vive solo el tiempo necesario para cifrarla.
 *
 * - No hereda de ObjetoDeValorDeTexto a propósito: no queremos un `valor` público.
 * - `#valor` es privado de verdad en tiempo de ejecución (no solo para TypeScript).
 * - Si alguien la imprime en un log o la convierte a JSON por error, sale oculta.
 * - No se recortan espacios: un espacio puede ser parte intencional de la contraseña.
 */
export class ContrasenaPlana {
  readonly #valor: string;

  private constructor(contrasenaValidada: string) {
    this.#valor = contrasenaValidada;
  }

  static crear(contrasenaIngresada: string): ContrasenaPlana {
    if (!ContrasenaPlana.cumpleLaPoliticaDeSeguridad(contrasenaIngresada)) {
      throw new ErrorDeValidacionDeDominio('contrasena', REGLAS_CONTRASENA.mensajeError);
    }
    return new ContrasenaPlana(contrasenaIngresada);
  }

  /** Único acceso al texto plano. El nombre es largo a propósito: obliga a pensar antes de usarlo. */
  revelarParaCifrar(): string {
    return this.#valor;
  }

  toString(): string {
    return TEXTO_OCULTO;
  }

  toJSON(): string {
    return TEXTO_OCULTO;
  }

  private static cumpleLaPoliticaDeSeguridad(contrasena: string): boolean {
    const { longitudMinima, patronAlMenosUnaLetra, patronAlMenosUnNumero } = REGLAS_CONTRASENA;

    return (
      contrasena.length >= longitudMinima &&
      patronAlMenosUnaLetra.test(contrasena) &&
      patronAlMenosUnNumero.test(contrasena)
    );
  }
}
