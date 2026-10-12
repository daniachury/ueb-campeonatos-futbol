/**
 * Datos del entorno de pruebas e2e. Es el único lugar que conoce puertos y direcciones:
 * si algo cambia, se cambia aquí. La base D1 desechable vive en .wrangler/e2e
 * (script `e2e:servidor` de package.json), separada de la de desarrollo.
 */
export const ENTORNO = {
  /** El Worker compilado desde la rama actual, servido por `wrangler dev` (runtime workerd). */
  urlBase: process.env.E2E_URL_BASE ?? 'http://localhost:8788',
  puerto: 8788,
  /**
   * API local de `wrangler dev` para consultar la D1 a través del mismo runtime que la app.
   * Escribir el archivo SQLite por fuera rompe las transacciones de la D1 local.
   */
  rutaDeLaApiDeD1: '/cdn-cgi/local/explorer/api/d1/database',
  nombreDelBindingD1: 'DB',
  /** El registro público admite 5 cuentas por minuto por IP (wrangler.jsonc · ratelimits). */
  registrosPorMinuto: 5,
} as const;
