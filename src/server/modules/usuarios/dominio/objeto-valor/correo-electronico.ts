import {
    REGLAS_CORREO,
    normalizarCorreo,
} from '../../../../../shared/usuarios/reglas-registro-jugador';
import { ErrorDeValidacionDeDominio } from '../errores/error-de-validacion-dominio';
import { ObjetoDeValorDeTexto } from './objeto-de-valor-texto';

/**
 * Correo siempre guardado en minúsculas y sin espacios alrededor.
 * Que sea ÚNICO no se puede saber aquí (requiere consultar la base de datos):
 * esa regla vive en el caso de uso del Paso 3.
 */
export class CorreoElectronico extends ObjetoDeValorDeTexto {
    private constructor(correoValidado: string) {
        super(correoValidado);
    }

    static crear(correoIngresado: string): CorreoElectronico {
        const correoNormalizado = normalizarCorreo(correoIngresado);

        if (!CorreoElectronico.tieneFormatoValido(correoNormalizado)) {
            throw new ErrorDeValidacionDeDominio('correo', REGLAS_CORREO.mensajeFormatoInvalido);
        }
        return new CorreoElectronico(correoNormalizado);
    }

    private static tieneFormatoValido(correo: string): boolean {
        return correo.length <= REGLAS_CORREO.longitudMaxima && REGLAS_CORREO.patronFormato.test(correo);
    }
}