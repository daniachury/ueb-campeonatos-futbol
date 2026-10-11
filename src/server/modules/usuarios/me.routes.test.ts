import { describe, expect, it } from 'vitest';
import type { ErrorApi } from '@shared/api';
import type { PerfilUsuario, RespuestaCambioContrasena } from '@shared/usuarios/contrato-perfil';
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

const iniciarSesion = (db: D1Database, correo: string, contrasena: string) =>
  pedir(db, '/api/auth/login', { metodo: 'POST', cuerpo: { correo, contrasena } });

const cookieDe = (respuesta: Response) =>
  (respuesta.headers.get('set-cookie') ?? '').split(';')[0] ?? '';

describe('Rutas de Mi Perfil /api/me (KAN-19 · UEB-Proyect-06)', () => {
  it('sin sesión responde 401 NO_AUTENTICADO', async () => {
    const { db } = crearD1DeAutenticacion([crearUsuarioGuardado()]);

    const resGet = await pedir(db, '/api/me');
    expect(resGet.status).toBe(401);

    const resPatch = await pedir(db, '/api/me', {
      metodo: 'PATCH',
      cuerpo: { nombreCompleto: 'Carlos' },
    });
    expect(resPatch.status).toBe(401);
  });

  it('GET /api/me: devuelve los datos del perfil del usuario autenticado', async () => {
    const { db } = crearD1DeAutenticacion([crearUsuarioGuardado()]);
    const resLogin = await iniciarSesion(db, 'laura@mail.com', 'balon2026');
    const cookie = cookieDe(resLogin);

    const res = await pedir(db, '/api/me', { cookie });
    expect(res.status).toBe(200);

    const perfil = (await res.json()) as PerfilUsuario;
    expect(perfil).toEqual({
      id: 'usuario-laura',
      nombreCompleto: 'Laura Gómez',
      correo: 'laura@mail.com',
      telefono: '3001234567',
      rol: 'jugador',
    });
  });

  it('PATCH /api/me: Escenario 1 · actualiza nombre y teléfono sin requerir contraseña actual', async () => {
    const { db } = crearD1DeAutenticacion([crearUsuarioGuardado()]);
    const resLogin = await iniciarSesion(db, 'laura@mail.com', 'balon2026');
    const cookie = cookieDe(resLogin);

    const res = await pedir(db, '/api/me', {
      metodo: 'PATCH',
      cuerpo: { nombreCompleto: 'Laura Marcela Gomez', telefono: '3109876543' },
      cookie,
    });
    expect(res.status).toBe(200);

    const perfil = (await res.json()) as PerfilUsuario;
    expect(perfil.nombreCompleto).toBe('Laura Marcela Gomez');
    expect(perfil.telefono).toBe('3109876543');
    expect(perfil.correo).toBe('laura@mail.com');
  });

  it('PATCH /api/me: Escenario 2 · actualiza correo si la contraseña actual es correcta', async () => {
    const { db } = crearD1DeAutenticacion([crearUsuarioGuardado()]);
    const resLogin = await iniciarSesion(db, 'laura@mail.com', 'balon2026');
    const cookie = cookieDe(resLogin);

    const res = await pedir(db, '/api/me', {
      metodo: 'PATCH',
      cuerpo: { correo: 'laura.nueva@unbosque.edu.co', contrasenaActual: 'balon2026' },
      cookie,
    });
    expect(res.status).toBe(200);

    const perfil = (await res.json()) as PerfilUsuario;
    expect(perfil.correo).toBe('laura.nueva@unbosque.edu.co');
  });

  it('PATCH /api/me: Escenario 2 · responde 401 si la contraseña actual es incorrecta al cambiar correo', async () => {
    const { db } = crearD1DeAutenticacion([crearUsuarioGuardado()]);
    const resLogin = await iniciarSesion(db, 'laura@mail.com', 'balon2026');
    const cookie = cookieDe(resLogin);

    const res = await pedir(db, '/api/me', {
      metodo: 'PATCH',
      cuerpo: { correo: 'laura.nueva@unbosque.edu.co', contrasenaActual: 'clave-erronea' },
      cookie,
    });
    expect(res.status).toBe(401);

    const error = (await res.json()) as ErrorApi;
    expect(error.codigo).toBe('CREDENCIALES_INCORRECTAS');
    expect(error.mensaje).toBe('La contraseña actual no es correcta');
  });

  it('PATCH /api/me: Escenario 3 · responde 409 si el nuevo correo ya pertenece a otra cuenta', async () => {
    const { db } = crearD1DeAutenticacion([
      crearUsuarioGuardado({ id: 'usuario-1', correo: 'laura@mail.com' }),
      crearUsuarioGuardado({ id: 'usuario-2', correo: 'carlos@mail.com' }),
    ]);
    const resLogin = await iniciarSesion(db, 'laura@mail.com', 'balon2026');
    const cookie = cookieDe(resLogin);

    const res = await pedir(db, '/api/me', {
      metodo: 'PATCH',
      cuerpo: { correo: 'carlos@mail.com', contrasenaActual: 'balon2026' },
      cookie,
    });
    expect(res.status).toBe(409);

    const error = (await res.json()) as ErrorApi;
    expect(error.codigo).toBe('CORREO_YA_REGISTRADO');
    expect(error.mensaje).toBe('Este correo ya está registrado');
  });

  it('PATCH /api/me: Escenario 6 · ignora campos id o rol ajenos y mantiene los del usuario de la sesión', async () => {
    const { db } = crearD1DeAutenticacion([crearUsuarioGuardado()]);
    const resLogin = await iniciarSesion(db, 'laura@mail.com', 'balon2026');
    const cookie = cookieDe(resLogin);

    const res = await pedir(db, '/api/me', {
      metodo: 'PATCH',
      cuerpo: {
        id: 'id-hacker',
        rol: 'admin',
        nombreCompleto: 'Laura Modificada',
      },
      cookie,
    });
    expect(res.status).toBe(200);

    const perfil = (await res.json()) as PerfilUsuario;
    expect(perfil.id).toBe('usuario-laura');
    expect(perfil.rol).toBe('jugador');
    expect(perfil.nombreCompleto).toBe('Laura Modificada');
  });

  it('POST /api/me/contrasena: Escenario 4 · cambia la contraseña e invalida otras sesiones', async () => {
    const { db, sesiones } = crearD1DeAutenticacion([crearUsuarioGuardado()]);
    const resLogin = await iniciarSesion(db, 'laura@mail.com', 'balon2026');
    const cookie = cookieDe(resLogin);

    // Creamos otra sesión previa simulada
    sesiones.push({
      usuario_id: 'usuario-laura',
      hash_token: 'otra-sesion-en-movil',
      expira_en: '2026-10-12T00:00:00Z',
    });
    expect(sesiones).toHaveLength(2);

    const res = await pedir(db, '/api/me/contrasena', {
      metodo: 'POST',
      cuerpo: {
        contrasenaActual: 'balon2026',
        nuevaContrasena: 'NuevaClave2026*',
        confirmarContrasena: 'NuevaClave2026*',
      },
      cookie,
    });
    expect(res.status).toBe(200);

    const data = (await res.json()) as RespuestaCambioContrasena;
    expect(data.mensaje).toBe('Contraseña actualizada');

    // La otra sesión quedó eliminada
    expect(sesiones.some((s) => s.hash_token === 'otra-sesion-en-movil')).toBe(false);
    // Pero la sesión actual sigue viva
    expect(sesiones).toHaveLength(1);

    // Puede iniciar sesión con la nueva clave
    const nuevoLogin = await iniciarSesion(db, 'laura@mail.com', 'NuevaClave2026*');
    expect(nuevoLogin.status).toBe(200);
  });

  it('POST /api/me/contraseña (con eñe): funciona como alias de /api/me/contrasena', async () => {
    const { db } = crearD1DeAutenticacion([crearUsuarioGuardado()]);
    const resLogin = await iniciarSesion(db, 'laura@mail.com', 'balon2026');
    const cookie = cookieDe(resLogin);

    const res = await pedir(db, '/api/me/contrase%C3%B1a', {
      metodo: 'POST',
      cuerpo: {
        contrasenaActual: 'balon2026',
        nuevaContrasena: 'NuevaClave2026*',
        confirmarContrasena: 'NuevaClave2026*',
      },
      cookie,
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as RespuestaCambioContrasena;
    expect(data.mensaje).toBe('Contraseña actualizada');
  });
});
