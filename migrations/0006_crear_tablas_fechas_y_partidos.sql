-- Migración 0006 · Tablas fechas y partidos para sorteo de torneos (KAN-33).
-- Sorteo todos contra todos (round-robin) para torneos de fútbol.

CREATE TABLE fechas (
  id                  TEXT PRIMARY KEY,
  torneo_id           TEXT NOT NULL REFERENCES torneos(id) ON DELETE CASCADE,
  numero              INTEGER NOT NULL CHECK (numero >= 1),
  equipo_descansa_id  TEXT REFERENCES equipos(id) ON DELETE SET NULL,
  creado_en           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (torneo_id, numero)
);

CREATE INDEX ix_fechas_torneo ON fechas (torneo_id, numero);

CREATE TABLE partidos (
  id              TEXT PRIMARY KEY,
  fecha_id        TEXT NOT NULL REFERENCES fechas(id) ON DELETE CASCADE,
  torneo_id       TEXT NOT NULL REFERENCES torneos(id) ON DELETE CASCADE,
  local_id        TEXT NOT NULL REFERENCES equipos(id) ON DELETE RESTRICT,
  visitante_id    TEXT NOT NULL REFERENCES equipos(id) ON DELETE RESTRICT,
  estado          TEXT NOT NULL DEFAULT 'POR_PROGRAMAR'
                  CHECK (estado IN ('POR_PROGRAMAR', 'PROGRAMADO', 'JUGADO', 'CANCELADO')),
  goles_local     INTEGER CHECK (goles_local IS NULL OR goles_local >= 0),
  goles_visitante INTEGER CHECK (goles_visitante IS NULL OR goles_visitante >= 0),
  fecha_hora      TEXT,
  cancha          TEXT,
  creado_en       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  actualizado_en  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (local_id <> visitante_id)
);

CREATE INDEX ix_partidos_torneo ON partidos (torneo_id);
CREATE INDEX ix_partidos_fecha ON partidos (fecha_id);
