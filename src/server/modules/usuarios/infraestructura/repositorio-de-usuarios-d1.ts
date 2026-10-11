import { ErrorCorreoYaRegistrado } from '../aplicacion/errores/error-correo-ya-registrado';
import type { RepositorioDeUsuarios } from '../aplicacion/puertos/repositorio-de-usuarios';
import { ContrasenaCifrada } from '../dominio/objeto-valor/contrasena-cifrada';
import { CorreoElectronico } from '../dominio/objeto-valor/correo-electronico';
import { NombreCompleto } from '../dominio/objeto-valor/nombre-completo';
import { Telefono } from '../dominio/objeto-valor/telefono';
import type { Rol } from '../dominio/rol';
import { Usuario } from '../dominio/usuario';

/** Fila de la tabla usuarios, con los nombres de columna de SQL. */
interface FilaDeUsuario {
  id: string;
  nombre_completo: string;
  correo: string;
  telefono: string;
  hash_contrasena: string;
  rol: Rol;
  activo: number;
  creado_en: string;
  actualizado_en: string;
}

/** Texto que D1 (SQLite) incluye en el error cuando se repite un correo. */
const VIOLACION_DE_CORREO_UNICO = 'UNIQUE constraint failed: usuarios.correo';

/**
 * Adaptador del puerto RepositorioDeUsuarios sobre Cloudflare D1.
 * Es el único lugar del módulo que conoce SQL: traduce entre la entidad Usuario
 * (camelCase, objetos de valor) y las columnas de la tabla usuarios (snake_case, texto).
 */
export class RepositorioDeUsuariosD1 implements RepositorioDeUsuarios {
  readonly #baseDeDatos: D1Database;

  constructor(baseDeDatos: D1Database) {
    this.#baseDeDatos = baseDeDatos;
  }

  async existeConCorreo(correo: CorreoElectronico): Promise<boolean> {
    const filaEncontrada = await this.#baseDeDatos
      .prepare('SELECT 1 AS existe FROM usuarios WHERE correo = ? LIMIT 1')
      .bind(correo.valor)
      .first();

    return filaEncontrada !== null;
  }

  async buscarPorCorreo(correo: CorreoElectronico): Promise<Usuario | null> {
    const fila = await this.#baseDeDatos
      .prepare(
        `SELECT id, nombre_completo, correo, telefono, hash_contrasena, rol, activo, creado_en, actualizado_en
           FROM usuarios
          WHERE correo = ?
          LIMIT 1`,
      )
      .bind(correo.valor)
      .first<FilaDeUsuario>();

    return fila === null ? null : convertirFilaEnUsuario(fila);
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const fila = await this.#baseDeDatos
      .prepare(
        `SELECT id, nombre_completo, correo, telefono, hash_contrasena, rol, activo, creado_en, actualizado_en
           FROM usuarios
          WHERE id = ?
          LIMIT 1`,
      )
      .bind(id)
      .first<FilaDeUsuario>();

    return fila === null ? null : convertirFilaEnUsuario(fila);
  }

  async guardar(usuario: Usuario): Promise<void> {
    try {
      await this.#baseDeDatos
        .prepare(
          `INSERT INTO usuarios
             (id, nombre_completo, correo, telefono, hash_contrasena, rol, activo, creado_en, actualizado_en)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          usuario.id,
          usuario.nombreCompleto.valor,
          usuario.correo.valor,
          usuario.telefono.valor,
          usuario.contrasenaCifrada.obtenerHashParaGuardar(),
          usuario.rol,
          usuario.activo ? 1 : 0,
          usuario.creadoEn.toISOString(),
          usuario.actualizadoEn.toISOString(),
        )
        .run();
    } catch (error) {
      // Dos registros simultáneos con el mismo correo: la restricción UNIQUE deja pasar solo uno.
      if (error instanceof Error && error.message.includes(VIOLACION_DE_CORREO_UNICO)) {
        throw new ErrorCorreoYaRegistrado();
      }
      throw error;
    }
  }

  async actualizarContrasena(
    usuarioId: string,
    contrasenaCifrada: ContrasenaCifrada,
    fecha: Date,
  ): Promise<void> {
    await this.#baseDeDatos
      .prepare('UPDATE usuarios SET hash_contrasena = ?, actualizado_en = ? WHERE id = ?')
      .bind(contrasenaCifrada.obtenerHashParaGuardar(), fecha.toISOString(), usuarioId)
      .run();
  }

  async actualizarPerfil(
    usuarioId: string,
    datos: { nombreCompleto?: string; correo?: string; telefono?: string },
    fecha: Date,
  ): Promise<void> {
    const campos: string[] = [];
    const valores: (string | number)[] = [];

    if (datos.nombreCompleto !== undefined) {
      campos.push('nombre_completo = ?');
      valores.push(datos.nombreCompleto);
    }
    if (datos.correo !== undefined) {
      campos.push('correo = ?');
      valores.push(datos.correo);
    }
    if (datos.telefono !== undefined) {
      campos.push('telefono = ?');
      valores.push(datos.telefono);
    }

    if (campos.length === 0) return;

    campos.push('actualizado_en = ?');
    valores.push(fecha.toISOString());

    valores.push(usuarioId);

    try {
      await this.#baseDeDatos
        .prepare(`UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`)
        .bind(...valores)
        .run();
    } catch (error) {
      if (error instanceof Error && error.message.includes(VIOLACION_DE_CORREO_UNICO)) {
        throw new ErrorCorreoYaRegistrado();
      }
      throw error;
    }
  }
}

function convertirFilaEnUsuario(fila: FilaDeUsuario): Usuario {
  return Usuario.reconstituir({
    id: fila.id,
    nombreCompleto: NombreCompleto.crear(fila.nombre_completo),
    correo: CorreoElectronico.crear(fila.correo),
    telefono: Telefono.crear(fila.telefono),
    contrasenaCifrada: ContrasenaCifrada.desdeHash(fila.hash_contrasena),
    rol: fila.rol,
    activo: fila.activo === 1,
    creadoEn: new Date(fila.creado_en),
    actualizadoEn: new Date(fila.actualizado_en),
  });
}
