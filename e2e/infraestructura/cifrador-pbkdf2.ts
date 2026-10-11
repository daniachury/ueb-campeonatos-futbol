import { webcrypto } from 'node:crypto';

/**
 * Genera el hash con el mismo formato que la app (src/server/.../cifrador-pbkdf2.ts):
 * `pbkdf2_sha256$<iteraciones>$<sal>$<hash>`. Así los usuarios sembrados pueden iniciar
 * sesión de verdad por la pantalla.
 *
 * Guarda el resultado por contraseña: casi todos los usuarios de prueba comparten la misma y
 * derivar 100.000 iteraciones por cada uno haría lenta la preparación.
 */
const ITERACIONES = 100_000;
const hashesCalculados = new Map<string, Promise<string>>();

export function cifrarContrasena(contrasena: string): Promise<string> {
  let hash = hashesCalculados.get(contrasena);
  if (!hash) {
    hash = derivar(contrasena);
    hashesCalculados.set(contrasena, hash);
  }
  return hash;
}

async function derivar(contrasena: string): Promise<string> {
  const sal = webcrypto.getRandomValues(new Uint8Array(16));
  const clave = await webcrypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(contrasena),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await webcrypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: ITERACIONES },
    clave,
    256,
  );
  const enBase64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');
  return ['pbkdf2_sha256', ITERACIONES, enBase64(sal), enBase64(new Uint8Array(bits))].join('$');
}
