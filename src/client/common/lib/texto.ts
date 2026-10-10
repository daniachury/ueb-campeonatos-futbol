/** "Laura Gómez" → "LG". Toma la inicial de las dos primeras palabras. */
export function obtenerIniciales(nombreCompleto: string): string {
  return nombreCompleto
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra.charAt(0).toUpperCase())
    .join('');
}

/** "Laura Gómez" → "Laura". */
export function obtenerPrimerNombre(nombreCompleto: string): string {
  const [primerNombre] = nombreCompleto.trim().split(/\s+/);
  return primerNombre ?? nombreCompleto;
}
