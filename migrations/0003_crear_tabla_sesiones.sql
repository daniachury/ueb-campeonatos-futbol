-- Migración 0003 · Sesiones de usuario (KAN-16 · Escenario 1 las crea; KAN-17 las valida).
-- Se guarda el hash SHA-256 del token, nunca el token: si la tabla se filtra,
-- nadie puede usar esas sesiones.

CREATE TABLE sesiones (
  id         TEXT PRIMARY KEY NOT NULL,                                   -- crypto.randomUUID()
  usuario_id TEXT NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  hash_token TEXT NOT NULL UNIQUE,
  expira_en  TEXT NOT NULL,                                               -- ISO 8601 en UTC
  creado_en  TEXT NOT NULL
);

CREATE INDEX ix_sesiones_usuario ON sesiones (usuario_id);
