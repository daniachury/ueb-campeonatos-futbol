import { describe, expect, it } from 'vitest';
import type { ErrorApi, ErrorDeCampo } from '@shared/api';
import type { JugadorRegistrado } from '@shared/usuarios/contrato-registro-jugador';
import { crearApp } from '../../app';
import { crearD1Falsa } from '../../test/d1-falsa';

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

function registrar(cuerpo: unknown, db: D1Database) {
  return crearApp().request(
    '/api/auth/registro',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    },
    { DB: db },
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
    expect(cookie).toMatch(/^sesion=[\w-]{43};/);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Max-Age=86400');

    const token = cookie.split(';')[0]?.replace('sesion=', '');
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
