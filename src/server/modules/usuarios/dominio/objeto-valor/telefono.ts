import {
  REGLAS_TELEFONO,
  normalizarTelefono,
} from '../../../../../shared/usuarios/reglas-registro-jugador';
import { ErrorDeValidacionDeDominio } from '../errores/error-de-validacion-dominio';
import { ObjetoDeValorDeTexto } from './objeto-de-valor-texto';

export class Telefono extends ObjetoDeValorDeTexto {
  private constructor(telefonoValidado: string) {
    super(telefonoValidado);
  }

  static crear(telefonoIngresado: string): Telefono {
    const telefonoNormalizado = normalizarTelefono(telefonoIngresado);

    if (!REGLAS_TELEFONO.patronFormato.test(telefonoNormalizado)) {
      throw new ErrorDeValidacionDeDominio('telefono', REGLAS_TELEFONO.mensajeError);
    }
    return new Telefono(telefonoNormalizado);
  }
}
