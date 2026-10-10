import { describe, expect, it } from 'vitest';
import { ApiError } from '../../common/api/client';
import { simularFetch } from '../../test/fetch-falso';
import { ErrorCorreoYaRegistrado } from './servicio-de-registro';
import { ServicioDeRegistroHttp } from './servicio-de-registro-http';

const SOLICITUD_DE_LAURA = {
  nombreCompleto: 'Laura Gómez',
  correo: 'laura@mail.com',
  telefono: '3001234567',
  contrasena: 'clave123',
};

const JUGADORA_LAURA = {
  id: 'jugador-001',
  nombreCompleto: 'Laura Gómez',
  correo: 'laura@mail.com',
  telefono: '3001234567',
  rol: 'jugador',
};

describe('ServicioDeRegistroHttp', () => {
  it('envía la solicitud como JSON a POST /api/auth/registro y devuelve el jugador', async () => {
    const fetchFalso = simularFetch(JUGADORA_LAURA, 201);

    const jugador = await new ServicioDeRegistroHttp().registrarJugador(SOLICITUD_DE_LAURA);

    expect(jugador).toEqual(JUGADORA_LAURA);
    const [url, opciones] = fetchFalso.mock.calls[0] ?? [];
    expect(url).toBe('/api/auth/registro');
    expect(opciones?.method).toBe('POST');
    expect(JSON.parse(String(opciones?.body))).toEqual(SOLICITUD_DE_LAURA);
  });

  it('convierte el 409 de correo duplicado en ErrorCorreoYaRegistrado (Escenario 2)', async () => {
    simularFetch(
      { codigo: 'CORREO_YA_REGISTRADO', mensaje: 'Este correo ya está registrado' },
      409,
    );

    const intento = new ServicioDeRegistroHttp().registrarJugador(SOLICITUD_DE_LAURA);

    await expect(intento).rejects.toThrow(ErrorCorreoYaRegistrado);
  });

  it('deja pasar los demás errores de la API', async () => {
    simularFetch({ codigo: 'ERROR_INTERNO', mensaje: 'Ocurrió un error inesperado.' }, 500);

    const intento = new ServicioDeRegistroHttp().registrarJugador(SOLICITUD_DE_LAURA);

    await expect(intento).rejects.toBeInstanceOf(ApiError);
  });
});
