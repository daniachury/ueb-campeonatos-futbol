import type { ErrorDeCampo } from '@shared/api';
import { errores } from './errors';

interface ResultadoValidacion {
  success: boolean;
  error?: {
    issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>;
  };
}

/**
 * Hook para `zValidator` de @hono/zod-validator.
 * Convierte los errores de zod en una respuesta 400 con el formato estándar de la API:
 *
 *   zValidator('json', miSchema, siFallaLaValidacion)
 */
export function siFallaLaValidacion(resultado: ResultadoValidacion): void {
  if (resultado.success || !resultado.error) return;

  const detalles: ErrorDeCampo[] = resultado.error.issues.map((problema) => ({
    campo: problema.path.map(String).join('.'),
    mensaje: problema.message,
  }));
  throw errores.validacion(detalles);
}
