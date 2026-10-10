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

  const detalles: ErrorDeCampo[] = [];
  for (const problema of resultado.error.issues) {
    const detalle = { campo: problema.path.map(String).join('.'), mensaje: problema.message };
    // Varias reglas de un campo pueden compartir mensaje (KAN-16 define uno por campo): se envía una vez.
    const yaEstaIncluido = detalles.some(
      (incluido) => incluido.campo === detalle.campo && incluido.mensaje === detalle.mensaje,
    );
    if (!yaEstaIncluido) detalles.push(detalle);
  }
  throw errores.validacion(detalles);
}
