import { randomUUID } from 'node:crypto';

/**
 * Sufijo corto y único por llamada: evita choques entre pruebas que corren en paralelo
 * sobre la misma base de datos.
 */
export function sufijoUnico(): string {
  return randomUUID().slice(0, 8);
}

export function nuevoId(prefijo: string): string {
  return `${prefijo}-${randomUUID()}`;
}

/** Los nombres solo admiten letras y espacios: el sufijo se escribe con letras. */
export function sufijoEnLetras(): string {
  const letras = 'abcdefghijklmnopqrstuvwxyz';
  return Array.from({ length: 6 }, () => letras[Math.floor(Math.random() * letras.length)]).join(
    '',
  );
}
