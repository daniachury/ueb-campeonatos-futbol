import { describe, expect, it } from 'vitest';
import {
  CODIGOS_ERROR_ADMIN,
  type AdminPromovido,
  type AdminRegistrado,
} from '@shared/usuarios/contrato-registro-admin';
import { crearApp } from '../../app';
import { crearD1DeAutenticacion, crearUsuarioGuardado } from '../../test/d1-de-autenticacion';
import { crearLimitadorFalso } from '../../test/limitador-falso';

function pedir(
  db: D1Database,
  ruta: string,
  opciones: { metodo?: string; cuerpo?: unknown; cookie?: string } = {},
) {
  const encabezados: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opciones.cookie) encabezados.Cookie = opciones.cookie;
  return crearApp().request(
    ruta,
    {
      method: opciones.metodo ?? 'GET',
      headers: encabezados,
      body: opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo),
    },
    { DB: db, LIMITE_DE_REGISTRO: crearLimitadorFalso() },
  );
}

const cookieDe = (res: Response) => (res.headers.get('set-cookie') ?? '').split(';')[0] ?? '';

async function loginAdmin(db: D1Database): Promise<string> {
  const res = await pedir(db, '/api/auth/login', {
    metodo: 'POST',
    cuerpo: { correo: 'admin@unbosque.edu.co', contrasena: 'balon2026' },
  });
  return cookieDe(res);
}

async function loginJugador(db: D1Database): Promise<string> {
  const res = await pedir(db, '/api/auth/login', {
    metodo: 'POST',
    cuerpo: { correo: 'jugador@unbosque.edu.co', contrasena: 'balon2026' },
  });
  return cookieDe(res);
}

describe('Rutas de administración de usuarios (KAN-18 · UEB-Proyect-05)', () => {
  describe('POST /api/admin/usuarios', () => {
    it('rechaza con 401 si no hay cookie de sesión', async () => {
      const { db } = crearD1DeAutenticacion();
      const res = await pedir(db, '/api/admin/usuarios', {
        metodo: 'POST',
        cuerpo: {
          nombreCompleto: 'Nuevo Admin',
          correo: 'nuevo@unbosque.edu.co',
          telefono: '3001234567',
        },
      });
      expect(res.status).toBe(401);
    });

    it('rechaza con 403 SIN_PERMISO si el usuario autenticado es jugador', async () => {
      const { db } = crearD1DeAutenticacion([
        crearUsuarioGuardado({
          id: 'jugador-1',
          correo: 'jugador@unbosque.edu.co',
          rol: 'jugador',
        }),
      ]);
      const cookie = await loginJugador(db);

      const res = await pedir(db, '/api/admin/usuarios', {
        metodo: 'POST',
        cuerpo: {
          nombreCompleto: 'Nuevo Admin',
          correo: 'nuevo@unbosque.edu.co',
          telefono: '3001234567',
        },
        cookie,
      });

      expect(res.status).toBe(403);
      expect(await res.json()).toMatchObject({ codigo: 'SIN_PERMISO' });
    });

    it('rechaza con 403 DEBE_CAMBIAR_CONTRASENA si el admin debe cambiar contraseña primero', async () => {
      const { db } = crearD1DeAutenticacion([
        crearUsuarioGuardado({
          id: 'admin-temp',
          correo: 'admin@unbosque.edu.co',
          rol: 'admin',
          debe_cambiar_contrasena: 1,
        }),
      ]);
      const cookie = await loginAdmin(db);

      const res = await pedir(db, '/api/admin/usuarios', {
        metodo: 'POST',
        cuerpo: {
          nombreCompleto: 'Otro Admin',
          correo: 'otro@unbosque.edu.co',
          telefono: '3001234567',
        },
        cookie,
      });

      expect(res.status).toBe(403);
      expect(await res.json()).toMatchObject({
        codigo: CODIGOS_ERROR_ADMIN.DEBE_CAMBIAR_CONTRASENA,
      });
    });

    it('crea un administrador nuevo con rol admin y contraseña temporal (Escenario 1)', async () => {
      const { db, auditoria } = crearD1DeAutenticacion([
        crearUsuarioGuardado({
          id: 'admin-principal',
          correo: 'admin@unbosque.edu.co',
          rol: 'admin',
          debe_cambiar_contrasena: 0,
        }),
      ]);
      const cookie = await loginAdmin(db);

      const res = await pedir(db, '/api/admin/usuarios', {
        metodo: 'POST',
        cuerpo: {
          nombreCompleto: 'Felipe Reyes',
          correo: 'felipe@unbosque.edu.co',
          telefono: '3009876543',
        },
        cookie,
      });

      expect(res.status).toBe(201);
      const data = (await res.json()) as AdminRegistrado;
      expect(data).toMatchObject({
        nombreCompleto: 'Felipe Reyes',
        correo: 'felipe@unbosque.edu.co',
        telefono: '3009876543',
        rol: 'admin',
      });
      expect(data.contrasenaTemporal).toHaveLength(12);

      // Auditoría registrada
      expect(auditoria).toHaveLength(1);
      expect(auditoria[0]).toMatchObject({
        admin_creador_id: 'admin-principal',
        usuario_id: data.id,
        accion: 'CREAR_ADMIN',
      });
    });

    it('devuelve 409 CORREO_ES_JUGADOR si el correo pertenece a un jugador existente (Escenario 3)', async () => {
      const { db } = crearD1DeAutenticacion([
        crearUsuarioGuardado({
          id: 'admin-principal',
          correo: 'admin@unbosque.edu.co',
          rol: 'admin',
          debe_cambiar_contrasena: 0,
        }),
        crearUsuarioGuardado({
          id: 'jugador-carlos',
          nombre_completo: 'Carlos Ruiz',
          correo: 'carlos@unbosque.edu.co',
          rol: 'jugador',
        }),
      ]);
      const cookie = await loginAdmin(db);

      const res = await pedir(db, '/api/admin/usuarios', {
        metodo: 'POST',
        cuerpo: {
          nombreCompleto: 'Carlos Ruiz',
          correo: 'carlos@unbosque.edu.co',
          telefono: '3001234567',
        },
        cookie,
      });

      expect(res.status).toBe(409);
      const error = await res.json();
      expect(error).toMatchObject({
        codigo: CODIGOS_ERROR_ADMIN.CORREO_ES_JUGADOR,
        detalles: {
          jugadorId: 'jugador-carlos',
          nombreJugador: 'Carlos Ruiz',
        },
      });
    });

    it('devuelve 409 CORREO_YA_ES_ADMIN si el correo pertenece a otro admin (Escenario 4)', async () => {
      const { db } = crearD1DeAutenticacion([
        crearUsuarioGuardado({
          id: 'admin-principal',
          correo: 'admin@unbosque.edu.co',
          rol: 'admin',
          debe_cambiar_contrasena: 0,
        }),
        crearUsuarioGuardado({
          id: 'admin-dos',
          correo: 'admindos@unbosque.edu.co',
          rol: 'admin',
        }),
      ]);
      const cookie = await loginAdmin(db);

      const res = await pedir(db, '/api/admin/usuarios', {
        metodo: 'POST',
        cuerpo: {
          nombreCompleto: 'Admin Dos',
          correo: 'admindos@unbosque.edu.co',
          telefono: '3001234567',
        },
        cookie,
      });

      expect(res.status).toBe(409);
      expect(await res.json()).toMatchObject({
        codigo: CODIGOS_ERROR_ADMIN.CORREO_YA_ES_ADMIN,
      });
    });

    it('valida campos con Zod y devuelve 400 ante datos inválidos', async () => {
      const { db } = crearD1DeAutenticacion([
        crearUsuarioGuardado({
          id: 'admin-principal',
          correo: 'admin@unbosque.edu.co',
          rol: 'admin',
        }),
      ]);
      const cookie = await loginAdmin(db);

      const res = await pedir(db, '/api/admin/usuarios', {
        metodo: 'POST',
        cuerpo: {
          nombreCompleto: 'A', // Demasiado corto
          correo: 'no-es-correo',
          telefono: '123',
        },
        cookie,
      });

      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({
        codigo: 'VALIDACION',
      });
    });
  });

  describe('POST /api/admin/usuarios/:id/promover', () => {
    it('promueve un jugador existente a administrador (Escenario 3)', async () => {
      const { db, auditoria } = crearD1DeAutenticacion([
        crearUsuarioGuardado({
          id: 'admin-principal',
          correo: 'admin@unbosque.edu.co',
          rol: 'admin',
          debe_cambiar_contrasena: 0,
        }),
        crearUsuarioGuardado({
          id: 'jugador-promovible',
          nombre_completo: 'Sara Polo',
          correo: 'sara@unbosque.edu.co',
          rol: 'jugador',
        }),
      ]);
      const cookie = await loginAdmin(db);

      const res = await pedir(db, '/api/admin/usuarios/jugador-promovible/promover', {
        metodo: 'POST',
        cookie,
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as AdminPromovido;
      expect(data).toMatchObject({
        id: 'jugador-promovible',
        nombreCompleto: 'Sara Polo',
        correo: 'sara@unbosque.edu.co',
        rol: 'admin',
      });

      // Auditoría registrada
      expect(auditoria).toHaveLength(1);
      expect(auditoria[0]).toMatchObject({
        admin_creador_id: 'admin-principal',
        usuario_id: 'jugador-promovible',
        accion: 'PROMOVER_JUGADOR',
      });
    });

    it('devuelve 404 NO_ENCONTRADO si el jugador no existe', async () => {
      const { db } = crearD1DeAutenticacion([
        crearUsuarioGuardado({
          id: 'admin-principal',
          correo: 'admin@unbosque.edu.co',
          rol: 'admin',
        }),
      ]);
      const cookie = await loginAdmin(db);

      const res = await pedir(db, '/api/admin/usuarios/fantasma/promover', {
        metodo: 'POST',
        cookie,
      });

      expect(res.status).toBe(404);
      expect(await res.json()).toMatchObject({ codigo: 'NO_ENCONTRADO' });
    });

    it('devuelve 409 JUGADOR_EN_TORNEO_EN_CURSO si participa en un torneo en curso (Escenario 3)', async () => {
      const { db, equiposEnTorneo } = crearD1DeAutenticacion([
        crearUsuarioGuardado({
          id: 'admin-principal',
          correo: 'admin@unbosque.edu.co',
          rol: 'admin',
        }),
        crearUsuarioGuardado({
          id: 'jugador-en-torneo',
          correo: 'torneo@unbosque.edu.co',
          rol: 'jugador',
        }),
      ]);
      equiposEnTorneo.add('jugador-en-torneo');
      const cookie = await loginAdmin(db);

      const res = await pedir(db, '/api/admin/usuarios/jugador-en-torneo/promover', {
        metodo: 'POST',
        cookie,
      });

      expect(res.status).toBe(409);
      expect(await res.json()).toMatchObject({
        codigo: CODIGOS_ERROR_ADMIN.JUGADOR_EN_TORNEO_EN_CURSO,
      });
    });

    it('devuelve 409 CORREO_YA_ES_ADMIN si el usuario ya es administrador', async () => {
      const { db } = crearD1DeAutenticacion([
        crearUsuarioGuardado({
          id: 'admin-principal',
          correo: 'admin@unbosque.edu.co',
          rol: 'admin',
        }),
        crearUsuarioGuardado({
          id: 'otro-admin',
          correo: 'otro@unbosque.edu.co',
          rol: 'admin',
        }),
      ]);
      const cookie = await loginAdmin(db);

      const res = await pedir(db, '/api/admin/usuarios/otro-admin/promover', {
        metodo: 'POST',
        cookie,
      });

      expect(res.status).toBe(409);
      expect(await res.json()).toMatchObject({
        codigo: CODIGOS_ERROR_ADMIN.CORREO_YA_ES_ADMIN,
      });
    });
  });
});
