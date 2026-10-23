import { describe, expect, it } from 'vitest';
import type { ErrorApi, ErrorDeCampo } from '@shared/api';
import type { JugadorRegistrado } from '@shared/usuarios/contrato-registro-jugador';
import { crearApp } from '../../app';
import { crearD1Falsa } from '../../test/d1-falsa';
import { crearLimitadorFalso } from '../../test/limitador-falso';

const SOLICITUD_DE_LAURA = {
  nombreCompleto: 'Laura Gómez',
  correo: 'Laura@Mail.com ',
  telefono: '3001234567',
  contrasena: 'clave123',
};

/** D1 falsa con memoria: recuerda los correos insertados, como la tabla usuarios. */
function crearBaseDeDatosDePrueba() {
  const correosRegistrados = new Set<string>();
  const { db, consultas } = crearD1Falsa((sql, parametros) => {
    if (sql.includes('FROM usuarios WHERE correo')) {
      return correosRegistrados.has(String(parametros[0])) ? [{ existe: 1 }] : [];
    }
    if (sql.includes('INSERT INTO usuarios')) {
      correosRegistrados.add(String(parametros[2]));
    }
    return [];
  });

  const insercionesEn = (tabla: string) =>
    consultas.filter((consulta) => consulta.sql.includes(`INSERT INTO ${tabla}`));

  return { db, consultas, insercionesEn };
}

function registrar(cuerpo: unknown, db: D1Database, limitador: RateLimit = crearLimitadorFalso()) {
  return crearApp().request(
    '/api/auth/registro',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '203.0.113.7' },
      body: JSON.stringify(cuerpo),
    },
    { DB: db, LIMITE_DE_REGISTRO: limitador },
  );
}

describe('POST /api/auth/registro (KAN-16)', () => {
  it('crea la cuenta de jugador con el correo normalizado y responde 201 (Escenario 1)', async () => {
    const { db, insercionesEn } = crearBaseDeDatosDePrueba();

    const respuesta = await registrar(SOLICITUD_DE_LAURA, db);
    const jugador = (await respuesta.json()) as JugadorRegistrado;

    expect(respuesta.status).toBe(201);
    expect(jugador).toEqual({
      id: expect.any(String),
      nombreCompleto: 'Laura Gómez',
      correo: 'laura@mail.com',
      telefono: '3001234567',
      rol: 'jugador',
    });
    expect(insercionesEn('usuarios')[0]?.parametros[2]).toBe('laura@mail.com');
  });

  it('inicia la sesión con una cookie HttpOnly y guarda solo el hash del token (Escenario 1)', async () => {
    const { db, insercionesEn } = crearBaseDeDatosDePrueba();

    const respuesta = await registrar(SOLICITUD_DE_LAURA, db);

    const cookie = respuesta.headers.get('set-cookie') ?? '';
    expect(cookie).toMatch(/^__Host-sesion=[\w-]{43};/);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Max-Age=86400');
    expect(cookie).toContain('Path=/');
    expect(cookie).not.toContain('Domain');

    const token = cookie.split(';')[0]?.replace('__Host-sesion=', '');
    const [sesionGuardada] = insercionesEn('sesiones');
    const jugador = (await respuesta.json()) as JugadorRegistrado;
    expect(sesionGuardada?.parametros[1]).toBe(jugador.id);
    expect(sesionGuardada?.parametros[2]).toMatch(/^[0-9a-f]{64}$/);
    expect(sesionGuardada?.parametros).not.toContain(token);
  });

  it('responde 409 si el correo ya existe aunque cambien las mayúsculas (Escenario 2)', async () => {
    const { db, insercionesEn } = crearBaseDeDatosDePrueba();
    await registrar({ ...SOLICITUD_DE_LAURA, correo: 'laura@mail.com' }, db);

    const respuesta = await registrar({ ...SOLICITUD_DE_LAURA, correo: 'LAURA@mail.com' }, db);
    const cuerpo = (await respuesta.json()) as ErrorApi;

    expect(respuesta.status).toBe(409);
    expect(cuerpo).toEqual({
      codigo: 'CORREO_YA_REGISTRADO',
      mensaje: 'Este correo ya está registrado',
      detalles: [{ campo: 'correo', mensaje: 'Este correo ya está registrado' }],
    });
    expect(insercionesEn('usuarios')).toHaveLength(1);
    expect(respuesta.headers.get('set-cookie')).toBeNull();
  });

  it('ignora un "rol": "admin" colado en la petición (Escenario 4)', async () => {
    const { db, insercionesEn } = crearBaseDeDatosDePrueba();

    const respuesta = await registrar({ ...SOLICITUD_DE_LAURA, rol: 'admin' }, db);
    const jugador = (await respuesta.json()) as JugadorRegistrado;

    expect(respuesta.status).toBe(201);
    expect(jugador.rol).toBe('jugador');
    expect(insercionesEn('usuarios')[0]?.parametros[5]).toBe('jugador');
  });

  it('nunca devuelve la contraseña en la respuesta (Escenario 5)', async () => {
    const { db } = crearBaseDeDatosDePrueba();

    const respuesta = await registrar(SOLICITUD_DE_LAURA, db);
    const cuerpoComoTexto = await respuesta.text();

    expect(cuerpoComoTexto).not.toContain('clave123');
    expect(cuerpoComoTexto).not.toMatch(/contrasena|hash/i);
  });

  it('responde 429 cuando la misma IP pasa el límite de registros, sin tocar la base', async () => {
    const { db, insercionesEn } = crearBaseDeDatosDePrueba();
    const limitador = crearLimitadorFalso(1);

    await registrar(SOLICITUD_DE_LAURA, db, limitador);
    const respuesta = await registrar(
      { ...SOLICITUD_DE_LAURA, correo: 'otra@mail.com' },
      db,
      limitador,
    );

    expect(respuesta.status).toBe(429);
    expect(((await respuesta.json()) as ErrorApi).codigo).toBe('DEMASIADAS_PETICIONES');
    expect(insercionesEn('usuarios')).toHaveLength(1);
  });

  it('guarda solo el hash de la contraseña en la base de datos (Escenario 5)', async () => {
    const { db, insercionesEn } = crearBaseDeDatosDePrueba();

    await registrar(SOLICITUD_DE_LAURA, db);
    const hashGuardado = insercionesEn('usuarios')[0]?.parametros[4];

    expect(hashGuardado).toMatch(/^pbkdf2_sha256\$/);
    expect(hashGuardado).not.toContain('clave123');
  });

  it('envía un solo mensaje por campo aunque fallen varias reglas', async () => {
    const { db } = crearBaseDeDatosDePrueba();

    const respuesta = await registrar({ ...SOLICITUD_DE_LAURA, contrasena: 'corta' }, db);
    const cuerpo = (await respuesta.json()) as ErrorApi;

    expect(cuerpo.detalles as ErrorDeCampo[]).toEqual([
      {
        campo: 'contrasena',
        mensaje: 'La contraseña debe tener mínimo 8 caracteres, con letras y números',
      },
    ]);
  });

  it('responde 400 con el campo y el mensaje de Jira, sin tocar la base (Escenario 3)', async () => {
    const { db, consultas } = crearBaseDeDatosDePrueba();

    const respuesta = await registrar({ ...SOLICITUD_DE_LAURA, telefono: '300abc' }, db);
    const cuerpo = (await respuesta.json()) as ErrorApi;

    expect(respuesta.status).toBe(400);
    expect(cuerpo.codigo).toBe('VALIDACION');
    expect(cuerpo.detalles as ErrorDeCampo[]).toEqual([
      { campo: 'telefono', mensaje: 'Ingresa un teléfono válido (7 a 15 dígitos)' },
    ]);
    expect(consultas).toHaveLength(0);
  });
});

describe('PATCH /api/auth/cambiar-contrasena (KAN-18 · Escenario 2)', () => {
  it('rechaza con 401 si no hay sesión activa', async () => {
    const { db } = crearBaseDeDatosDePrueba();
    const app = crearApp();
    const res = await app.request(
      '/api/auth/cambiar-contrasena',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contrasenaActual: 'actual123', contrasenaNueva: 'nuevaClave1' }),
      },
      { DB: db, LIMITE_DE_REGISTRO: crearLimitadorFalso() },
    );

    expect(res.status).toBe(401);
  });

  it('rechaza con 400 si la contraseña nueva no cumple reglas', async () => {
    const { db } = await import('../../test/d1-de-autenticacion').then((m) =>
      m.crearD1DeAutenticacion([
        m.crearUsuarioGuardado({
          id: 'user-1',
          correo: 'user@test.com',
          hash_contrasena: 'actual123',
        }),
      ]),
    );
    const app = crearApp();
    const loginRes = await app.request(
      '/api/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: 'user@test.com', contrasena: 'actual123' }),
      },
      { DB: db, LIMITE_DE_REGISTRO: crearLimitadorFalso() },
    );
    const cookie = (loginRes.headers.get('set-cookie') ?? '').split(';')[0] ?? '';

    const res = await app.request(
      '/api/auth/cambiar-contrasena',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({ contrasenaActual: 'actual123', contrasenaNueva: 'corta' }),
      },
      { DB: db, LIMITE_DE_REGISTRO: crearLimitadorFalso() },
    );

    expect(res.status).toBe(400);
  });

  it('rechaza con 400 si la nueva contraseña es igual a la actual', async () => {
    const { db } = await import('../../test/d1-de-autenticacion').then((m) =>
      m.crearD1DeAutenticacion([
        m.crearUsuarioGuardado({
          id: 'user-1',
          correo: 'user@test.com',
          hash_contrasena: 'actual123',
        }),
      ]),
    );
    const app = crearApp();
    const loginRes = await app.request(
      '/api/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: 'user@test.com', contrasena: 'actual123' }),
      },
      { DB: db, LIMITE_DE_REGISTRO: crearLimitadorFalso() },
    );
    const cookie = (loginRes.headers.get('set-cookie') ?? '').split(';')[0] ?? '';

    const res = await app.request(
      '/api/auth/cambiar-contrasena',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({ contrasenaActual: 'actual123', contrasenaNueva: 'actual123' }),
      },
      { DB: db, LIMITE_DE_REGISTRO: crearLimitadorFalso() },
    );

    expect(res.status).toBe(400);
  });

  it('rechaza con 401 si la contraseña actual es errónea', async () => {
    const { db } = await import('../../test/d1-de-autenticacion').then((m) =>
      m.crearD1DeAutenticacion([
        m.crearUsuarioGuardado({
          id: 'user-1',
          correo: 'user@test.com',
          hash_contrasena: 'actual123',
        }),
      ]),
    );
    const app = crearApp();
    const loginRes = await app.request(
      '/api/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: 'user@test.com', contrasena: 'actual123' }),
      },
      { DB: db, LIMITE_DE_REGISTRO: crearLimitadorFalso() },
    );
    const cookie = (loginRes.headers.get('set-cookie') ?? '').split(';')[0] ?? '';

    const res = await app.request(
      '/api/auth/cambiar-contrasena',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({
          contrasenaActual: 'equivocada123',
          contrasenaNueva: 'nuevaClave123',
        }),
      },
      { DB: db, LIMITE_DE_REGISTRO: crearLimitadorFalso() },
    );

    expect(res.status).toBe(401);
  });

  it('actualiza la contraseña exitosamente y responde 200', async () => {
    const { db, usuarios } = await import('../../test/d1-de-autenticacion').then((m) =>
      m.crearD1DeAutenticacion([
        m.crearUsuarioGuardado({
          id: 'admin-temp',
          correo: 'admin@test.com',
          hash_contrasena: 'temporal123',
          rol: 'admin',
          debe_cambiar_contrasena: 1,
        }),
      ]),
    );
    const app = crearApp();
    const loginRes = await app.request(
      '/api/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: 'admin@test.com', contrasena: 'temporal123' }),
      },
      { DB: db, LIMITE_DE_REGISTRO: crearLimitadorFalso() },
    );
    const cookie = (loginRes.headers.get('set-cookie') ?? '').split(';')[0] ?? '';

    const res = await app.request(
      '/api/auth/cambiar-contrasena',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({
          contrasenaActual: 'temporal123',
          contrasenaNueva: 'Definitiva2026',
        }),
      },
      { DB: db, LIMITE_DE_REGISTRO: crearLimitadorFalso() },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ mensaje: 'Contraseña actualizada' });

    const usuario = usuarios.find((u) => u.id === 'admin-temp');
    expect(usuario?.debe_cambiar_contrasena).toBe(0);
  });
});

describe('Flujo de recuperación de cuenta y restablecimiento (KAN-50)', () => {
  it('genera enlace y responde 200 para un correo registrado (Escenario 1)', async () => {
    const { db } = await import('../../test/d1-de-autenticacion').then((m) =>
      m.crearD1DeAutenticacion([
        m.crearUsuarioGuardado({
          id: 'usr-capitan',
          correo: 'capitan@unbosque.edu.co',
          rol: 'jugador',
        }),
      ]),
    );
    const app = crearApp();

    const res = await app.request(
      '/api/auth/recuperar-cuenta',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '203.0.113.19' },
        body: JSON.stringify({ correo: 'capitan@unbosque.edu.co' }),
      },
      { DB: db, LIMITE_DE_REGISTRO: crearLimitadorFalso() },
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { token: string; enlace: string };
    expect(body.token).toBeDefined();
    expect(body.enlace).toBe(`/restablecer-contrasena?token=${body.token}`);
  });

  it('responde 404 si el correo no existe en el sistema (Escenario 2)', async () => {
    const { db } = await import('../../test/d1-de-autenticacion').then((m) =>
      m.crearD1DeAutenticacion([]),
    );
    const app = crearApp();

    const res = await app.request(
      '/api/auth/recuperar-cuenta',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '203.0.113.20' },
        body: JSON.stringify({ correo: 'desconocido@unbosque.edu.co' }),
      },
      { DB: db, LIMITE_DE_REGISTRO: crearLimitadorFalso() },
    );

    expect(res.status).toBe(404);
    const error = (await res.json()) as ErrorApi;
    expect(error.mensaje).toBe(
      'No se encontró una cuenta de jugador, capitán o administrador asociada a este correo',
    );
  });

  it('responde 400 si el correo no tiene formato válido', async () => {
    const { db } = await import('../../test/d1-de-autenticacion').then((m) =>
      m.crearD1DeAutenticacion([]),
    );
    const app = crearApp();

    const res = await app.request(
      '/api/auth/recuperar-cuenta',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '203.0.113.21' },
        body: JSON.stringify({ correo: 'no-es-correo' }),
      },
      { DB: db, LIMITE_DE_REGISTRO: crearLimitadorFalso() },
    );

    expect(res.status).toBe(400);
    const error = (await res.json()) as ErrorApi;
    expect(error.detalles).toEqual([
      { campo: 'correo', mensaje: 'Ingresa un correo válido' },
    ]);
  });

  it('valida token existente vía GET /api/auth/validar-token-recuperacion', async () => {
    const { db } = await import('../../test/d1-de-autenticacion').then((m) =>
      m.crearD1DeAutenticacion([
        m.crearUsuarioGuardado({
          id: 'usr-admin',
          correo: 'admin@unbosque.edu.co',
          rol: 'admin',
        }),
      ]),
    );
    const app = crearApp();

    const solRes = await app.request(
      '/api/auth/recuperar-cuenta',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '203.0.113.22' },
        body: JSON.stringify({ correo: 'admin@unbosque.edu.co' }),
      },
      { DB: db, LIMITE_DE_REGISTRO: crearLimitadorFalso() },
    );
    const { token } = (await solRes.json()) as { token: string };

    const valRes = await app.request(
      `/api/auth/validar-token-recuperacion?token=${token}`,
      { method: 'GET' },
      { DB: db, LIMITE_DE_REGISTRO: crearLimitadorFalso() },
    );

    expect(valRes.status).toBe(200);
    const valBody = (await valRes.json()) as { valido: boolean; correo: string };
    expect(valBody.valido).toBe(true);
    expect(valBody.correo).toBe('admin@unbosque.edu.co');
  });

  it('responde 400 si la contraseña nueva no cumple reglas alfanuméricas (Escenario 3)', async () => {
    const { db } = await import('../../test/d1-de-autenticacion').then((m) =>
      m.crearD1DeAutenticacion([
        m.crearUsuarioGuardado({
          id: 'usr-jugador',
          correo: 'jugador@unbosque.edu.co',
        }),
      ]),
    );
    const app = crearApp();

    const solRes = await app.request(
      '/api/auth/recuperar-cuenta',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '203.0.113.23' },
        body: JSON.stringify({ correo: 'jugador@unbosque.edu.co' }),
      },
      { DB: db, LIMITE_DE_REGISTRO: crearLimitadorFalso() },
    );
    const { token } = (await solRes.json()) as { token: string };

    const res = await app.request(
      '/api/auth/restablecer-contrasena',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          nuevaContrasena: 'universidad', // Solo letras
          confirmarContrasena: 'universidad',
        }),
      },
      { DB: db, LIMITE_DE_REGISTRO: crearLimitadorFalso() },
    );

    expect(res.status).toBe(400);
    const error = (await res.json()) as ErrorApi;
    expect(error.detalles).toEqual([
      {
        campo: 'nuevaContrasena',
        mensaje: 'La contraseña debe tener mínimo 8 caracteres, con letras y números',
      },
    ]);
  });

  it('responde 400 si las contraseñas no coinciden (Escenario 4)', async () => {
    const { db } = await import('../../test/d1-de-autenticacion').then((m) =>
      m.crearD1DeAutenticacion([
        m.crearUsuarioGuardado({
          id: 'usr-jugador2',
          correo: 'jugador2@unbosque.edu.co',
        }),
      ]),
    );
    const app = crearApp();

    const solRes = await app.request(
      '/api/auth/recuperar-cuenta',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '203.0.113.24' },
        body: JSON.stringify({ correo: 'jugador2@unbosque.edu.co' }),
      },
      { DB: db, LIMITE_DE_REGISTRO: crearLimitadorFalso() },
    );
    const { token } = (await solRes.json()) as { token: string };

    const res = await app.request(
      '/api/auth/restablecer-contrasena',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          nuevaContrasena: 'Bosque2026',
          confirmarContrasena: 'Bosque2025',
        }),
      },
      { DB: db, LIMITE_DE_REGISTRO: crearLimitadorFalso() },
    );

    expect(res.status).toBe(400);
    const error = (await res.json()) as ErrorApi;
    expect(error.detalles).toEqual([
      { campo: 'confirmarContrasena', mensaje: 'Las contraseñas no coinciden' },
    ]);
  });

  it('restablece contraseña con éxito, revoca sesiones y bloquea reuso (Escenarios 5 y 6)', async () => {
    const { db, sesiones, usuarios } = await import('../../test/d1-de-autenticacion').then((m) =>
      m.crearD1DeAutenticacion([
        m.crearUsuarioGuardado({
          id: 'usr-exito',
          correo: 'exito@unbosque.edu.co',
          hash_contrasena: 'claveVieja123',
        }),
      ]),
    );
    sesiones.push({
      usuario_id: 'usr-exito',
      hash_token: 'hash_sesion_previa',
      expira_en: new Date(Date.now() + 86400000).toISOString(),
    });

    const app = crearApp();

    const solRes = await app.request(
      '/api/auth/recuperar-cuenta',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '203.0.113.25' },
        body: JSON.stringify({ correo: 'exito@unbosque.edu.co' }),
      },
      { DB: db, LIMITE_DE_REGISTRO: crearLimitadorFalso() },
    );
    const { token } = (await solRes.json()) as { token: string };

    const res = await app.request(
      '/api/auth/restablecer-contrasena',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          nuevaContrasena: 'Bosque2026',
          confirmarContrasena: 'Bosque2026',
        }),
      },
      { DB: db, LIMITE_DE_REGISTRO: crearLimitadorFalso() },
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { mensaje: string };
    expect(body.mensaje).toBe('Contraseña restablecida con éxito');

    // Verificar que la contraseña cambió y se cifró con pbkdf2
    const usuario = usuarios.find((u) => u.id === 'usr-exito');
    expect(usuario?.hash_contrasena).toMatch(/^pbkdf2_sha256\$/);

    // Verificar que las sesiones previas fueron revocadas
    expect(sesiones.filter((s) => s.usuario_id === 'usr-exito')).toHaveLength(0);

    // Intentar reusar el token debe fallar con 400
    const reusoRes = await app.request(
      '/api/auth/restablecer-contrasena',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          nuevaContrasena: 'OtraClave2026',
          confirmarContrasena: 'OtraClave2026',
        }),
      },
      { DB: db, LIMITE_DE_REGISTRO: crearLimitadorFalso() },
    );

    expect(reusoRes.status).toBe(400);
    const errorReuso = (await reusoRes.json()) as ErrorApi;
    expect(errorReuso.mensaje).toBe(
      'El enlace de recuperación es inválido o ha expirado. Genera uno nuevo.',
    );
  });
});
