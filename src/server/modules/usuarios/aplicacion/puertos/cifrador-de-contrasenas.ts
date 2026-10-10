import type { ContrasenaCifrada } from '../../dominio/objeto-valor/contrasena-cifrada';
import type { ContrasenaPlana } from '../../dominio/objeto-valor/contrasena-plana';

/**
 * Puerto: convierte la contraseña en lo que se guarda y la compara al iniciar sesión.
 * KAN-16 · Escenario 5 pide un hash: lo cumple CifradorPbkdf2. Cambiarlo no toca los casos de uso.
 */
export interface CifradorDeContrasenas {
  cifrar(contrasena: ContrasenaPlana): Promise<ContrasenaCifrada>;
  /** KAN-17: ¿la contraseña escrita corresponde a la guardada? Debe tardar lo mismo si no. */
  coincide(contrasenaEscrita: string, contrasenaGuardada: ContrasenaCifrada): Promise<boolean>;
  /** ¿Lo guardado quedó sin hash o con un costo menor al actual? Entonces se vuelve a cifrar. */
  necesitaActualizarse(contrasenaGuardada: ContrasenaCifrada): boolean;
}
