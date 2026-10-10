import type { Reloj } from '../aplicacion/puertos/reloj';

/** Adaptador: la hora real del servidor. */
export class RelojDelSistema implements Reloj {
  ahora(): Date {
    return new Date();
  }
}
