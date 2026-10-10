import { describe, expect, it } from 'vitest';
import type { ErrorApi } from '@shared/api';
import type { UsuarioAutenticado } from '@shared/usuarios/contrato-inicio-de-sesion';
import { crearApp } from '../../app';
import { crearD1DeAutenticacion, crearUsuarioGuardado } from '../../test/d1-de-autenticacion';

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
    { DB: db },
  );
}

const iniciarSesion = (db: D1Database, correo: string, contrasena: string) =>
  pedir(db, '/api/auth/login', { metodo: 'POST', cuerpo: { correo, contrasena } });

/** "sesion=abc; Max-Age=…" → "sesion=abc", listo para enviarlo de vuelta. */
const cookieDe = (respuesta: Response) =>
  (respuesta.headers.get('set-cookie') ?? '').split(';')[0] ?? '';

describe('POST /api/auth/login (KAN-17)', () => {
  it('inicia la sesión de la jugadora con el correo en mayúsculas y envía la cookie (Escenario 1)', async () => {
    const { db } = crearD1DeAutenticacion([crearUsuarioGuardado()]);

    const respuesta = await iniciarSesion(db, 'Laura@mail.com', 'balon2026');

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({
      id: 'usuario-laura',
      nombreCompleto: 'Laura Gómez',
      correo: 'laura@mail.com',
      telefono: '3001234567',
      rol: 'jugador',
    });
    const cookie = respuesta.headers.get('set-cookie') ?? '';
    expect(cookie).toMatch(/^sesion=[\w-]{43};/);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Max-Age=86400');
  });

  it('responde con el rol de administrador (Escenario 2)', async () => {
    const { db } = crearD1DeAutenticacion([
      crearUsuarioGuardado({ id: 'admin-1', correo: 'admin@mail.com', rol: 'admin' }),
    ]);

    const respuesta = await iniciarSesion(db, 'admin@mail.com', 'balon2026');

    expect(((await respuesta.json()) as UsuarioAutenticado).rol).toBe('admin');
  });

  it.each([
    ['correo inexistente', 'nadie@mail.com', 'balon2026'],
    ['contraseña incorrecta', 'laura@mail.com', 'otra12345'],
  ])(
    'responde 401 con el mismo mensaje ante un %s (Escenario 3)',
    async (_caso, correo, contrasena) => {
      const { db } = crearD1DeAutenticacion([crearUsuarioGuardado()]);

      const respuesta = await iniciarSesion(db, correo, contrasena);

      expect(respuesta.status).toBe(401);
      expect(await respuesta.json()).toEqual({
        codigo: 'CREDENCIALES_INCORRECTAS',
        mensaje: 'Correo o contraseña incorrectos',
      });
      expect(respuesta.headers.get('set-cookie')).toBeNull();
    },
  );

  it('responde 429 al quinto fallo y rechaza luego la contraseña correcta (Escenario 4)', async () => {
    const { db } = crearD1DeAutenticacion([crearUsuarioGuardado()]);
    for (let fallo = 1; fallo <= 4; fallo++) {
      expect((await iniciarSesion(db, 'laura@mail.com', 'otra12345')).status).toBe(401);
    }

    const quintoFallo = await iniciarSesion(db, 'laura@mail.com', 'otra12345');
    const conLaContrasenaCorrecta = await iniciarSesion(db, 'LAURA@mail.com', 'balon2026');

    expect(quintoFallo.status).toBe(429);
    expect(((await quintoFallo.json()) as ErrorApi).mensaje).toBe(
      'Demasiados intentos. Intenta de nuevo en 15 minutos',
    );
    expect(conLaContrasenaCorrecta.status).toBe(429);
  });

  it('responde 403 a una cuenta desactivada con credenciales correctas (Escenario 5)', async () => {
    const { db } = crearD1DeAutenticacion([crearUsuarioGuardado({ activo: 0 })]);

    const respuesta = await iniciarSesion(db, 'laura@mail.com', 'balon2026');

    expect(respuesta.status).toBe(403);
    expect(await respuesta.json()).toEqual({
      codigo: 'CUENTA_DESACTIVADA',
      mensaje: 'Tu cuenta está desactivada. Contacta al administrador',
    });
  });

  it('responde 400 si falta la contraseña, sin consultar la base', async () => {
    const { db, consultas } = crearD1DeAutenticacion();

    const respuesta = await iniciarSesion(db, 'laura@mail.com', '');

    expect(respuesta.status).toBe(400);
    expect(consultas).toHaveLength(0);
  });
});

describe('sesión con cookie (KAN-17)', () => {
  it('GET /api/auth/sesion devuelve a quien tiene la sesión', async () => {
    const { db } = crearD1DeAutenticacion([crearUsuarioGuardado()]);
    const cookie = cookieDe(await iniciarSesion(db, 'laura@mail.com', 'balon2026'));

    const respuesta = await pedir(db, '/api/auth/sesion', { cookie });

    expect(respuesta.status).toBe(200);
    expect(((await respuesta.json()) as UsuarioAutenticado).correo).toBe('laura@mail.com');
    expect(respuesta.headers.get('cache-control')).toBe('no-store');
  });

  it('requireAuth deja pasar una cookie válida a las rutas con sesión', async () => {
    const { db } = crearD1DeAutenticacion([crearUsuarioGuardado()]);
    const cookie = cookieDe(await iniciarSesion(db, 'laura@mail.com', 'balon2026'));

    const respuesta = await pedir(db, '/api/usuarios/me', { cookie });

    // La ruta aún no existe (KAN-19): llegar al 404 prueba que la sesión pasó el filtro.
    expect(respuesta.status).toBe(404);
  });

  it('después de cerrar sesión el token anterior responde 401 (Escenario 6)', async () => {
    const { db } = crearD1DeAutenticacion([crearUsuarioGuardado()]);
    const cookie = cookieDe(await iniciarSesion(db, 'laura@mail.com', 'balon2026'));

    const cierre = await pedir(db, '/api/auth/logout', { metodo: 'POST', cookie });
    const conElTokenAnterior = await pedir(db, '/api/usuarios/me', { cookie });

    expect(cierre.status).toBe(204);
    expect(cierre.headers.get('set-cookie')).toContain('sesion=;');
    expect(conElTokenAnterior.status).toBe(401);
    expect(((await conElTokenAnterior.json()) as ErrorApi).codigo).toBe('NO_AUTENTICADO');
  });

  it('una sesión de más de 24 horas responde 401 SESION_EXPIRADA (Escenario 7)', async () => {
    const { db, vencerSesiones } = crearD1DeAutenticacion([crearUsuarioGuardado()]);
    const cookie = cookieDe(await iniciarSesion(db, 'laura@mail.com', 'balon2026'));
    vencerSesiones();

    const respuesta = await pedir(db, '/api/auth/sesion', { cookie });

    expect(respuesta.status).toBe(401);
    expect(await respuesta.json()).toEqual({
      codigo: 'SESION_EXPIRADA',
      mensaje: 'Tu sesión expiró, ingresa de nuevo',
    });
  });

  it('la cuenta registrada (KAN-16) puede iniciar sesión después con su contraseña', async () => {
    const { db } = crearD1DeAutenticacion();
    await pedir(db, '/api/auth/registro', {
      metodo: 'POST',
      cuerpo: {
        nombreCompleto: 'Camilo Rojas',
        correo: 'Camilo.Rojas@mail.com',
        telefono: '3104567890',
        contrasena: 'golazo2026',
      },
    });

    const respuesta = await iniciarSesion(db, 'camilo.rojas@mail.com', 'golazo2026');

    expect(respuesta.status).toBe(200);
  });
});
