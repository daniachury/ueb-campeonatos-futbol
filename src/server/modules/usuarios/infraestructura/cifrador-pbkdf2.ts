import type { CifradorDeContrasenas } from '../aplicacion/puertos/cifrador-de-contrasenas';
import { ContrasenaCifrada } from '../dominio/objeto-valor/contrasena-cifrada';
import type { ContrasenaPlana } from '../dominio/objeto-valor/contrasena-plana';

/** Prefijo del formato guardado: `pbkdf2_sha256$<iteraciones>$<sal>$<hash>` (sal y hash en base64). */
const PREFIJO = 'pbkdf2_sha256';
/** Máximo que permite la Web Crypto API de Cloudflare Workers. */
const ITERACIONES = 100_000;
const BYTES_DE_SAL = 16;
const BITS_DEL_HASH = 256;

/**
 * Cifrador de contraseñas con PBKDF2-SHA256 de la Web Crypto API (KAN-16 · Escenario 5).
 * No necesita dependencias: Workers lo trae incorporado.
 *
 * Compatibilidad: las cuentas creadas con el adaptador provisional guardaron la contraseña
 * sin hash. `coincide` todavía las acepta y `necesitaActualizarse` avisa para que el inicio
 * de sesión las vuelva a guardar con hash.
 */
export class CifradorPbkdf2 implements CifradorDeContrasenas {
  async cifrar(contrasena: ContrasenaPlana): Promise<ContrasenaCifrada> {
    const sal = crypto.getRandomValues(new Uint8Array(BYTES_DE_SAL));
    const hash = await derivar(contrasena.revelarParaCifrar(), sal, ITERACIONES);
    return ContrasenaCifrada.desdeHash(
      [PREFIJO, ITERACIONES, aBase64(sal), aBase64(hash)].join('$'),
    );
  }

  async coincide(
    contrasenaEscrita: string,
    contrasenaGuardada: ContrasenaCifrada,
  ): Promise<boolean> {
    const guardado = contrasenaGuardada.obtenerHashParaGuardar();
    const partes = leerFormato(guardado);

    if (partes === null) {
      // Valor heredado sin hash (o la referencia de un correo inexistente). Se deriva igual
      // para que la respuesta tarde lo mismo y no revele qué correos tienen cuenta.
      await derivar(contrasenaEscrita, new Uint8Array(BYTES_DE_SAL), ITERACIONES);
      return sonIgualesEnTiempoConstante(
        new TextEncoder().encode(contrasenaEscrita),
        new TextEncoder().encode(guardado),
      );
    }

    const hashEscrito = await derivar(contrasenaEscrita, partes.sal, partes.iteraciones);
    return sonIgualesEnTiempoConstante(hashEscrito, partes.hash);
  }

  necesitaActualizarse(contrasenaGuardada: ContrasenaCifrada): boolean {
    const partes = leerFormato(contrasenaGuardada.obtenerHashParaGuardar());
    return partes === null || partes.iteraciones < ITERACIONES;
  }
}

interface PartesDelHash {
  iteraciones: number;
  sal: Uint8Array;
  hash: Uint8Array;
}

function leerFormato(guardado: string): PartesDelHash | null {
  const [prefijo, iteraciones, sal, hash, ...sobrantes] = guardado.split('$');
  if (prefijo !== PREFIJO || !iteraciones || !sal || !hash || sobrantes.length > 0) return null;

  const numeroDeIteraciones = Number(iteraciones);
  if (!Number.isInteger(numeroDeIteraciones) || numeroDeIteraciones <= 0) return null;
  return { iteraciones: numeroDeIteraciones, sal: deBase64(sal), hash: deBase64(hash) };
}

async function derivar(
  contrasena: string,
  sal: Uint8Array,
  iteraciones: number,
): Promise<Uint8Array> {
  const clave = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(contrasena),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: iteraciones },
    clave,
    BITS_DEL_HASH,
  );
  return new Uint8Array(bits);
}

/**
 * Compara todos los bytes aunque encuentre una diferencia al principio: así el tiempo de
 * respuesta no da pistas de cuántos bytes acertó quien intenta adivinar.
 */
function sonIgualesEnTiempoConstante(bytesA: Uint8Array, bytesB: Uint8Array): boolean {
  const longitud = Math.max(bytesA.length, bytesB.length);
  let diferencias = bytesA.length ^ bytesB.length;
  for (let posicion = 0; posicion < longitud; posicion++) {
    diferencias |= (bytesA[posicion] ?? 0) ^ (bytesB[posicion] ?? 0);
  }
  return diferencias === 0;
}

function aBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function deBase64(texto: string): Uint8Array {
  return Uint8Array.from(atob(texto), (caracter) => caracter.charCodeAt(0));
}
