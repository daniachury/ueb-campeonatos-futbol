import { describe, expect, it, vi } from 'vitest';
import { simularFetch } from '../../test/fetch-falso';
import { ApiError, pedir } from './client';

describe('pedir', () => {
  it('llama a /api + ruta pidiendo JSON y devuelve el cuerpo', async () => {
    const fetchFalso = simularFetch({ datos: [1, 2] });

    const resultado = await pedir<{ datos: number[] }>('/torneos');

    expect(resultado).toEqual({ datos: [1, 2] });
    const [url, opciones] = fetchFalso.mock.calls[0] ?? [];
    expect(url).toBe('/api/torneos');
    expect(new Headers(opciones?.headers).get('Accept')).toBe('application/json');
  });

  it('convierte un error de la API en ApiError con su código', async () => {
    simularFetch({ codigo: 'SIN_PERMISO', mensaje: 'No tienes permiso' }, 403);

    const error = await pedir('/admin/torneos').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 403,
      codigo: 'SIN_PERMISO',
      message: 'No tienes permiso',
    });
  });

  it('usa un mensaje genérico si el error no trae el formato de la API', async () => {
    simularFetch('<html>Bad gateway</html>', 502);

    const error = await pedir('/torneos').catch((e: unknown) => e);

    expect(error).toMatchObject({ status: 502, codigo: 'ERROR_DESCONOCIDO' });
  });

  it('tolera respuestas sin cuerpo JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 500,
        json: async () => {
          throw new SyntaxError('Unexpected end of JSON input');
        },
      })),
    );

    const error = await pedir('/torneos').catch((e: unknown) => e);

    expect(error).toMatchObject({ status: 500, codigo: 'ERROR_DESCONOCIDO' });
  });
});
