import { createMiddleware } from 'hono/factory';
import type { AppEnv, Bindings } from '../env';
import { AppError } from '../errors';

/** Bindings de wrangler.jsonc (`ratelimits`) que sirven como limitadores. */
type NombreDelLimitador = {
  [Nombre in keyof Bindings]-?: NonNullable<Bindings[Nombre]> extends RateLimit ? Nombre : never;
}[keyof Bindings];

/**
 * Limita cuántas peticiones puede hacer una misma IP a una ruta, con el Rate Limiting de
 * Cloudflare. El límite y el periodo se configuran en wrangler.jsonc.
 * Al pasarse responde 429 DEMASIADAS_PETICIONES sin llegar a la ruta.
 */
export const limitarPeticionesPorIp = (limitador: NombreDelLimitador) =>
  createMiddleware<AppEnv>(async (c, next) => {
    // Cloudflare pone la IP real del cliente; en desarrollo local puede no venir.
    const ip = c.req.header('cf-connecting-ip') ?? 'sin-ip';
    const { success } = await c.env[limitador].limit({ key: ip });
    if (!success) {
      throw new AppError(
        429,
        'DEMASIADAS_PETICIONES',
        'Hiciste demasiados intentos. Espera un minuto e intenta de nuevo.',
      );
    }
    await next();
  });
