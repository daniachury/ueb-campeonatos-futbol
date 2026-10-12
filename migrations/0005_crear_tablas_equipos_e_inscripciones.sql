-- Migración 0005 · Tablas de equipos e inscripciones (UEB-Proyect-19 · KAN-32, épica E6).

CREATE TABLE IF NOT EXISTS equipos (
  id              TEXT    PRIMARY KEY NOT NULL,              -- crypto.randomUUID()
  nombre          TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  color           TEXT,
  capitan_id      TEXT    REFERENCES usuarios(id),
  activo          INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
  creado_en       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  actualizado_en  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS equipo_jugadores (
  equipo_id     TEXT NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  usuario_id    TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha_ingreso TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (equipo_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS ix_equipo_jugadores_usuario ON equipo_jugadores (usuario_id);

CREATE TABLE IF NOT EXISTS inscripciones (
  id              TEXT PRIMARY KEY NOT NULL,                 -- crypto.randomUUID()
  torneo_id       TEXT NOT NULL REFERENCES torneos(id) ON DELETE CASCADE,
  equipo_id       TEXT NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  estado          TEXT NOT NULL DEFAULT 'PENDIENTE'
                  CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'RETIRADO', 'CANCELADO')),
  motivo          TEXT,
  solicitada_por  TEXT REFERENCES usuarios(id),
  aprobada_por    TEXT REFERENCES usuarios(id),
  creada_en       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  actualizada_en  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS ix_inscripciones_torneo ON inscripciones (torneo_id);
CREATE INDEX IF NOT EXISTS ix_inscripciones_equipo ON inscripciones (equipo_id);
CREATE INDEX IF NOT EXISTS ix_inscripciones_torneo_estado ON inscripciones (torneo_id, estado);
CREATE UNIQUE INDEX IF NOT EXISTS ix_inscripciones_activas ON inscripciones (torneo_id, equipo_id)
  WHERE estado IN ('PENDIENTE', 'APROBADO');
