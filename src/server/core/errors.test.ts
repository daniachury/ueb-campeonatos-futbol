import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { describe, expect, it, vi } from 'vitest';
import { errores, manejarError } from './errors';

function appQueLanza(error: unknown) {
  const app = new Hono();
  app.get('/', () => {
    throw error;
  });
  app.onError(manejarError);
  return app;
}

describe('manejarError', () => {
  it('convierte un AppError en su estado y en { codigo, mensaje, detalles }', async () => {
    const detalles = [{ campo: 'nombre', mensaje: 'Requerido' }];
    const respuesta = await appQueLanza(errores.validacion(detalles)).request('/');

    expect(respuesta.status).toBe(400);
    expect(await respuesta.json()).toEqual({
      codigo: 'VALIDACION',
      mensaje: 'Los datos enviados no son válidos',
      detalles,
    });
  });

  it('omite detalles cuando el error no los trae', async () => {
    const respuesta = await appQueLanza(errores.sinPermiso()).request('/');

    expect(respuesta.status).toBe(403);
    expect(await respuesta.json()).toEqual({
      codigo: 'SIN_PERMISO',
      mensaje: 'No tienes permiso para realizar esta acción',
    });
  });

  it.each([
    [errores.noEncontrado('Torneo'), 404, 'NO_ENCONTRADO'],
    [errores.conflicto('EQUIPO_LLENO', 'El equipo ya tiene 25 jugadores'), 409, 'EQUIPO_LLENO'],
  ])('respeta el estado y el código de %s', async (error, estado, codigo) => {
    const respuesta = await appQueLanza(error).request('/');

    expect(respuesta.status).toBe(estado);
    expect(((await respuesta.json()) as { codigo: string }).codigo).toBe(codigo);
  });

  it('traduce una HTTPException de Hono al formato estándar', async () => {
    const respuesta = await appQueLanza(
      new HTTPException(413, { message: 'Archivo muy grande' }),
    ).request('/');

    expect(respuesta.status).toBe(413);
    expect(await respuesta.json()).toEqual({ codigo: 'HTTP_413', mensaje: 'Archivo muy grande' });
  });

  it('responde 500 sin exponer el mensaje interno de un error inesperado', async () => {
    const consola = vi.spyOn(console, 'error').mockImplementation(() => {});

    const respuesta = await appQueLanza(new Error('SQLITE_ERROR: no such table')).request('/');
    const texto = await respuesta.text();

    expect(respuesta.status).toBe(500);
    expect(texto).not.toContain('SQLITE');
    expect(JSON.parse(texto)).toEqual({
      codigo: 'ERROR_INTERNO',
      mensaje: 'Ocurrió un error inesperado. Intenta de nuevo.',
    });
    expect(consola).toHaveBeenCalled();
  });
});
