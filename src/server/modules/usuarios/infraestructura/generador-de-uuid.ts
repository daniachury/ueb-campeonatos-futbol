import type { GeneradorDeIdentificadores } from '../aplicacion/puertos/generador-de-identificadores';

/** Adaptador: identificadores UUID v4 con la Web Crypto API que trae Workers. */
export class GeneradorDeUuid implements GeneradorDeIdentificadores {
  generar(): string {
    return crypto.randomUUID();
  }
}
