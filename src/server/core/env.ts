import type { UsuarioSesion } from '@shared/usuarios';

/** Recursos de Cloudflare disponibles en `c.env`. Deben coincidir con wrangler.jsonc. */
export interface Bindings {
  DB: D1Database;
  /** Registro de jugadores: 5 por minuto por IP (ver `ratelimits` en wrangler.jsonc). */
  LIMITE_DE_REGISTRO: RateLimit;
  /** KAN-18 · Semilla del primer administrador. */
  ADMIN_NOMBRE?: string;
  ADMIN_CORREO?: string;
  ADMIN_TELEFONO?: string;
}

/** Valores que los middleware guardan en el contexto de cada petición. */
export interface Variables {
  usuario: UsuarioSesion;
}

/** Tipo de entorno que usan todas las instancias de Hono del backend. */
export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
