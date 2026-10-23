export interface NuevoTokenRecuperacion {
  id: string;
  usuarioId: string;
  tokenHash: string;
  expiraEn: string;
  creadoEn: string;
}

export interface TokenRecuperacionConUsuario {
  id: string;
  usuarioId: string;
  tokenHash: string;
  expiraEn: string;
  usado: boolean;
  creadoEn: string;
  usuario: {
    id: string;
    correo: string;
    activo: boolean;
    rol: string;
  };
}

interface FilaTokenRecuperacion {
  id: string;
  usuario_id: string;
  token_hash: string;
  expira_en: string;
  usado: number;
  creado_en: string;
  u_id: string;
  u_correo: string;
  u_activo: number;
  u_rol: string;
}

export interface TokensRecuperacionRepository {
  guardar(token: NuevoTokenRecuperacion): Promise<void>;
  buscarPorHash(tokenHash: string): Promise<TokenRecuperacionConUsuario | null>;
  restablecerContrasenaYRevocarSesiones(
    usuarioId: string,
    tokenId: string,
    hashContrasena: string,
    fechaActual: string,
  ): Promise<void>;
}

export function crearTokensRecuperacionRepository(db: D1Database): TokensRecuperacionRepository {
  return {
    async guardar(token) {
      await db
        .prepare(
          `INSERT INTO tokens_recuperacion_contrasena
             (id, usuario_id, token_hash, expira_en, usado, creado_en)
           VALUES (?, ?, ?, ?, 0, ?)`,
        )
        .bind(token.id, token.usuarioId, token.tokenHash, token.expiraEn, token.creadoEn)
        .run();
    },

    async buscarPorHash(tokenHash) {
      const fila = await db
        .prepare(
          `SELECT t.id, t.usuario_id, t.token_hash, t.expira_en, t.usado, t.creado_en,
                  u.id AS u_id, u.correo AS u_correo, u.activo AS u_activo, u.rol AS u_rol
             FROM tokens_recuperacion_contrasena t
             JOIN usuarios u ON u.id = t.usuario_id
            WHERE t.token_hash = ?
            LIMIT 1`,
        )
        .bind(tokenHash)
        .first<FilaTokenRecuperacion>();

      if (!fila) return null;

      return {
        id: fila.id,
        usuarioId: fila.usuario_id,
        tokenHash: fila.token_hash,
        expiraEn: fila.expira_en,
        usado: fila.usado === 1,
        creadoEn: fila.creado_en,
        usuario: {
          id: fila.u_id,
          correo: fila.u_correo,
          activo: fila.u_activo === 1,
          rol: fila.u_rol,
        },
      };
    },

    async restablecerContrasenaYRevocarSesiones(usuarioId, tokenId, hashContrasena, fechaActual) {
      // D1 batch atómico: actualiza usuario, marca token usado y revoca sesiones en una sola transacción
      await db.batch([
        db
          .prepare(
            'UPDATE usuarios SET hash_contrasena = ?, actualizado_en = ?, debe_cambiar_contrasena = 0 WHERE id = ?',
          )
          .bind(hashContrasena, fechaActual, usuarioId),
        db
          .prepare('UPDATE tokens_recuperacion_contrasena SET usado = 1 WHERE id = ?')
          .bind(tokenId),
        db.prepare('DELETE FROM sesiones WHERE usuario_id = ?').bind(usuarioId),
      ]);
    },
  };
}
