import { crearApp } from './app';

/**
 * Punto de entrada del Worker (ver `main` en wrangler.jsonc).
 * Cloudflare envía aquí todas las peticiones a /api/*; el resto lo sirve como archivos
 * estáticos del frontend (ver `assets` en wrangler.jsonc).
 */
export default crearApp();
