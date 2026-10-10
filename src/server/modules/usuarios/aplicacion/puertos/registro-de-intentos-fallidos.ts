import type { CorreoElectronico } from '../../dominio/objeto-valor/correo-electronico';

/** Fallos seguidos de un correo y, si lo hay, hasta cuándo está bloqueado. */
export interface IntentosFallidos {
  fallosSeguidos: number;
  bloqueadoHasta: Date | null;
}

/**
 * Puerto: recuerda los intentos fallidos por correo (KAN-17 · Escenario 4).
 * Se cuenta por correo, exista o no la cuenta: así el bloqueo no revela qué correos existen.
 */
export interface RegistroDeIntentosFallidos {
  obtener(correo: CorreoElectronico): Promise<IntentosFallidos>;
  guardar(correo: CorreoElectronico, intentos: IntentosFallidos): Promise<void>;
  /** Tras un inicio exitoso el contador vuelve a cero. */
  reiniciar(correo: CorreoElectronico): Promise<void>;
}
