import type { Rol } from '@shared/constants';

/** Fila nueva de la tabla sesiones. Fechas en ISO 8601 (UTC). */
export interface NuevaSesion {
  id: string;
  usuarioId: string;
  hashToken: string;
  expiraEn: string;
  creadoEn: string;
}

/** Sesión guardada junto con los datos públicos de su usuario. */
export interface SesionConUsuario {
  expiraEn: string;
  usuario: {
    id: string;
    nombreCompleto: string;
    correo: string;
    telefono: string;
    rol: Rol;
    activo: boolean;
    debeCambiarContrasena?: boolean;
  };
}

/**
 * Acceso a datos de sesiones. Es la única capa que conoce SQL y D1.
 * Se busca y se borra por el hash del token: el token mismo nunca toca la base.
 */
export interface SesionesRepository {
  crear(sesion: NuevaSesion): Promise<void>;
  buscarPorHashDelToken(hashToken: string): Promise<SesionConUsuario | null>;
  eliminarPorHashDelToken(hashToken: string): Promise<void>;
  eliminarOtrasSesionesDelUsuario(usuarioId: string, hashTokenActual: string): Promise<void>;
}

interface FilaDeSesion {
  expira_en: string;
  usuario_id: string;
  nombre_completo: string;
  correo: string;
  telefono: string;
  rol: Rol;
  activo: number;
  debe_cambiar_contrasena?: number;
}

export function crearSesionesRepository(db: D1Database): SesionesRepository {
  return {
    async crear(sesion) {
      await db
        .prepare(
          `INSERT INTO sesiones (id, usuario_id, hash_token, expira_en, creado_en)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(sesion.id, sesion.usuarioId, sesion.hashToken, sesion.expiraEn, sesion.creadoEn)
        .run();
    },

    async buscarPorHashDelToken(hashToken) {
      const fila = await db
        .prepare(
          `SELECT s.expira_en, u.id AS usuario_id, u.nombre_completo, u.correo, u.telefono, u.rol, u.activo, u.debe_cambiar_contrasena
             FROM sesiones s
             JOIN usuarios u ON u.id = s.usuario_id
            WHERE s.hash_token = ?`,
        )
        .bind(hashToken)
        .first<FilaDeSesion>();

      if (fila === null) return null;
      return {
        expiraEn: fila.expira_en,
        usuario: {
          id: fila.usuario_id,
          nombreCompleto: fila.nombre_completo,
          correo: fila.correo,
          telefono: fila.telefono,
          rol: fila.rol,
          activo: fila.activo === 1,
          debeCambiarContrasena: fila.debe_cambiar_contrasena === 1,
        },
      };
    },

    async eliminarPorHashDelToken(hashToken) {
      await db.prepare('DELETE FROM sesiones WHERE hash_token = ?').bind(hashToken).run();
    },

    async eliminarOtrasSesionesDelUsuario(usuarioId, hashTokenActual) {
      await db
        .prepare('DELETE FROM sesiones WHERE usuario_id = ? AND hash_token != ?')
        .bind(usuarioId, hashTokenActual)
        .run();
    },
  };
}
