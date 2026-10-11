import { describe, expect, it } from 'vitest';
import type { ErrorApi } from '@shared/api';
import { crearApp } from './app';
import { crearD1Falsa, crearD1QueFalla } from './test/d1-falsa';

const pedir = (ruta: string, db: D1Database = crearD1Falsa().db) =>
  crearApp().request(ruta, {}, { DB: db });

describe('GET /api/health', () => {
  it('responde ok cuando la base de datos contesta', async () => {
    const respuesta = await pedir('/api/health', crearD1Falsa(() => [{ 1: 1 }]).db);

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({ estado: 'ok', baseDeDatos: 'ok' });
  });

  it('responde 503 cuando la base de datos no contesta', async () => {
    const respuesta = await pedir('/api/health', crearD1QueFalla());

    expect(respuesta.status).toBe(503);
    expect(await respuesta.json()).toEqual({ estado: 'degradado', baseDeDatos: 'error' });
  });
});

describe('seguridad por defecto (UEB-Proyect-02)', () => {
  it.each([
    '/api/admin/torneos',
    '/api/admin/inscripciones/torneos/t1',
    '/api/admin/ruta-que-aun-no-existe',
    '/api/equipos',
    '/api/equipos/123',
    '/api/usuarios/me',
    '/api/tabla/t1',
  ])('%s responde 401 sin sesión', async (ruta) => {
    const respuesta = await pedir(ruta);
    const cuerpo = (await respuesta.json()) as ErrorApi;

    expect(respuesta.status).toBe(401);
    expect(cuerpo.codigo).toBe('NO_AUTENTICADO');
  });
});

describe('rutas inexistentes', () => {
  it('responden 404 con el formato estándar', async () => {
    const respuesta = await pedir('/api/no-existe');

    expect(respuesta.status).toBe(404);
    expect(await respuesta.json()).toEqual({
      codigo: 'NO_ENCONTRADO',
      mensaje: 'Ruta no encontrada',
    });
  });
});
