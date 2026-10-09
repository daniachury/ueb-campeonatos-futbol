import { vi } from 'vitest';

/** Respuesta mínima compatible con lo que usa `pedir()`. */
export function respuestaJson(cuerpo: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => cuerpo,
  } as Response;
}

/** Reemplaza `fetch` global para que siempre responda con `cuerpo` y `status`. */
export function simularFetch(cuerpo: unknown, status = 200) {
  const fetchFalso = vi.fn<typeof fetch>(async () => respuestaJson(cuerpo, status));
  vi.stubGlobal('fetch', fetchFalso);
  return fetchFalso;
}
