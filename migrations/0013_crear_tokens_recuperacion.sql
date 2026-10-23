-- Migración 0013 · Tokens de recuperación de contraseña (KAN-50).
-- Inmutable: 0001_ a 0012_ permanecen intactas.

CREATE TABLE tokens_recuperacion_contrasena (
  id         TEXT PRIMARY KEY NOT NULL,                                   -- crypto.randomUUID()
  usuario_id TEXT NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,                                        -- SHA-256 en hexadecimal
  expira_en  TEXT NOT NULL,                                               -- ISO 8601 en UTC (60 minutos)
  usado      INTEGER NOT NULL DEFAULT 0 CHECK (usado IN (0, 1)),
  creado_en  TEXT NOT NULL                                                -- ISO 8601 en UTC
);

CREATE INDEX ix_tokens_recuperacion_usuario ON tokens_recuperacion_contrasena (usuario_id);
CREATE INDEX ix_tokens_recuperacion_hash ON tokens_recuperacion_contrasena (token_hash);
