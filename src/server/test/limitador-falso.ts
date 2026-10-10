/**
 * Doble de prueba del Rate Limiting de Cloudflare: deja pasar `limite` peticiones por clave
 * y rechaza las siguientes. Por defecto no limita nada.
 */
export function crearLimitadorFalso(limite = Number.POSITIVE_INFINITY): RateLimit {
  const peticionesPorClave = new Map<string, number>();
  return {
    async limit({ key }) {
      const peticiones = (peticionesPorClave.get(key) ?? 0) + 1;
      peticionesPorClave.set(key, peticiones);
      return { success: peticiones <= limite };
    },
  };
}
