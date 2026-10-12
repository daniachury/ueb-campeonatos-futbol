import { describe, expect, it } from 'vitest';
import { crearD1Falsa, crearD1QueFalla } from '../../../test/d1-falsa';
import { ErrorCorreoYaRegistrado } from '../aplicacion/errores/error-correo-ya-registrado';
import { ContrasenaCifrada } from '../dominio/objeto-valor/contrasena-cifrada';
import { CorreoElectronico } from '../dominio/objeto-valor/correo-electronico';
import { NombreCompleto } from '../dominio/objeto-valor/nombre-completo';
import { Telefono } from '../dominio/objeto-valor/telefono';
import { Usuario } from '../dominio/usuario';
import { RepositorioDeUsuariosD1 } from './repositorio-de-usuarios-d1';

const FECHA_DE_REGISTRO = new Date('2026-10-09T14:00:00.000Z');

function crearJugadoraLaura(): Usuario {
  return Usuario.registrarJugador({
    id: 'jugador-001',
    nombreCompleto: NombreCompleto.crear('Laura Gómez'),
    correo: CorreoElectronico.crear('laura@mail.com'),
    telefono: Telefono.crear('3001234567'),
    contrasenaCifrada: ContrasenaCifrada.desdeHash('valor-guardado'),
    fechaDeRegistro: FECHA_DE_REGISTRO,
  });
}

/** D1 que rechaza el INSERT como lo hace SQLite cuando el correo ya existe. */
function crearD1ConCorreoRepetido(): D1Database {
  return {
    prepare: () => ({
      bind: () => ({
        run: async () => {
          throw new Error('D1_ERROR: UNIQUE constraint failed: usuarios.correo: SQLITE_CONSTRAINT');
        },
      }),
    }),
  } as unknown as D1Database;
}

describe('RepositorioDeUsuariosD1', () => {
  it('consulta el correo ya normalizado y responde si existe', async () => {
    const { db, consultas } = crearD1Falsa(() => [{ existe: 1 }]);
    const repositorio = new RepositorioDeUsuariosD1(db);

    const existe = await repositorio.existeConCorreo(CorreoElectronico.crear('LAURA@mail.com'));

    expect(existe).toBe(true);
    expect(consultas[0]?.parametros).toEqual(['laura@mail.com']);
  });

  it('responde false cuando no hay filas', async () => {
    const repositorio = new RepositorioDeUsuariosD1(crearD1Falsa(() => []).db);

    const existe = await repositorio.existeConCorreo(CorreoElectronico.crear('nadie@mail.com'));

    expect(existe).toBe(false);
  });

  it('guarda el usuario con las columnas de la tabla: activo como 1 y fechas en ISO 8601', async () => {
    const { db, consultas } = crearD1Falsa();
    const repositorio = new RepositorioDeUsuariosD1(db);

    await repositorio.guardar(crearJugadoraLaura());

    expect(consultas[0]?.sql).toContain('INSERT INTO usuarios');
    expect(consultas[0]?.parametros).toEqual([
      'jugador-001',
      'Laura Gómez',
      'laura@mail.com',
      '3001234567',
      'valor-guardado',
      'jugador',
      1,
      0,
      '2026-10-09T14:00:00.000Z',
      '2026-10-09T14:00:00.000Z',
    ]);
  });

  it('busca un usuario por su identificador (buscarPorId)', async () => {
    const { db } = crearD1Falsa(() => [
      {
        id: 'user-123',
        nombre_completo: 'Laura Gómez',
        correo: 'laura@mail.com',
        telefono: '3001234567',
        hash_contrasena: 'hash-123',
        rol: 'admin',
        activo: 1,
        debe_cambiar_contrasena: 1,
        creado_en: '2026-10-09T14:00:00.000Z',
        actualizado_en: '2026-10-09T14:00:00.000Z',
      },
    ]);
    const repositorio = new RepositorioDeUsuariosD1(db);

    const usuario = await repositorio.buscarPorId('user-123');

    expect(usuario).not.toBeNull();
    expect(usuario?.id).toBe('user-123');
    expect(usuario?.esAdministrador()).toBe(true);
    expect(usuario?.debeCambiarContrasena).toBe(true);
  });

  it('actualiza el rol de un usuario (actualizarRol)', async () => {
    const { db, consultas } = crearD1Falsa();
    const repositorio = new RepositorioDeUsuariosD1(db);

    await repositorio.actualizarRol('user-123', 'admin', FECHA_DE_REGISTRO);

    expect(consultas[0]?.sql).toContain('UPDATE usuarios SET rol = ?');
    expect(consultas[0]?.parametros).toEqual(['admin', '2026-10-09T14:00:00.000Z', 'user-123']);
  });

  it('actualiza la bandera debe_cambiar_contrasena', async () => {
    const { db, consultas } = crearD1Falsa();
    const repositorio = new RepositorioDeUsuariosD1(db);

    await repositorio.actualizarDebeCambiarContrasena('user-123', false, FECHA_DE_REGISTRO);

    expect(consultas[0]?.sql).toContain('UPDATE usuarios SET debe_cambiar_contrasena = ?');
    expect(consultas[0]?.parametros).toEqual([0, '2026-10-09T14:00:00.000Z', 'user-123']);
  });

  it('traduce la violación del correo único en ErrorCorreoYaRegistrado (Escenario 2)', async () => {
    const repositorio = new RepositorioDeUsuariosD1(crearD1ConCorreoRepetido());

    await expect(repositorio.guardar(crearJugadoraLaura())).rejects.toThrow(
      ErrorCorreoYaRegistrado,
    );
  });

  it('deja pasar cualquier otro error de la base de datos', async () => {
    const repositorio = new RepositorioDeUsuariosD1(crearD1QueFalla('D1 no disponible'));

    await expect(repositorio.guardar(crearJugadoraLaura())).rejects.toThrow('D1 no disponible');
  });
});
