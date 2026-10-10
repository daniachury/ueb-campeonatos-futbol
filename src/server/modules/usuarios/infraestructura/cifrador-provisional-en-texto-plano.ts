import type { CifradorDeContrasenas } from '../aplicacion/puertos/cifrador-de-contrasenas';
import { ContrasenaCifrada } from '../dominio/objeto-valor/contrasena-cifrada';
import type { ContrasenaPlana } from '../dominio/objeto-valor/contrasena-plana';

/**
 * ADAPTADOR PROVISIONAL: guarda la contraseña tal cual, SIN hash.
 *
 * TODO(KAN-16 · Escenario 5): reemplazarlo por un cifrador real (bcrypt, argon2 o PBKDF2)
 * antes de registrar usuarios reales. El cambio es crear el adaptador nuevo y usarlo en
 * las raíces de composición de infraestructura/; los casos de uso y la tabla no cambian.
 *
 * Aun así, la contraseña nunca sale en una respuesta: ContrasenaCifrada la oculta en JSON.
 */
export class CifradorProvisionalEnTextoPlano implements CifradorDeContrasenas {
  async cifrar(contrasena: ContrasenaPlana): Promise<ContrasenaCifrada> {
    return ContrasenaCifrada.desdeHash(contrasena.revelarParaCifrar());
  }

  async coincide(
    contrasenaEscrita: string,
    contrasenaGuardada: ContrasenaCifrada,
  ): Promise<boolean> {
    return sonIgualesEnTiempoConstante(
      contrasenaEscrita,
      contrasenaGuardada.obtenerHashParaGuardar(),
    );
  }
}

/**
 * Compara todos los bytes aunque encuentre una diferencia al principio: así el tiempo de
 * respuesta no da pistas de cuántos caracteres acertó quien intenta adivinar.
 */
function sonIgualesEnTiempoConstante(textoA: string, textoB: string): boolean {
  const bytesA = new TextEncoder().encode(textoA);
  const bytesB = new TextEncoder().encode(textoB);
  const longitud = Math.max(bytesA.length, bytesB.length);
  let diferencias = bytesA.length ^ bytesB.length;
  for (let posicion = 0; posicion < longitud; posicion++) {
    diferencias |= (bytesA[posicion] ?? 0) ^ (bytesB[posicion] ?? 0);
  }
  return diferencias === 0;
}
