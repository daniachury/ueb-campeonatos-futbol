-- Migración 0007 · Tablas sedes y canchas para lugares de partidos (KAN-34).
-- Épica E8 · Programación y fixture.

CREATE TABLE IF NOT EXISTS sedes (
  id              TEXT PRIMARY KEY,
  nombre          TEXT NOT NULL UNIQUE COLLATE NOCASE CHECK (length(trim(nombre)) >= 3 AND length(trim(nombre)) <= 80),
  direccion       TEXT NOT NULL CHECK (length(trim(direccion)) >= 5 AND length(trim(direccion)) <= 150),
  ciudad          TEXT NOT NULL DEFAULT 'Bogotá' CHECK (length(trim(ciudad)) >= 2 AND length(trim(ciudad)) <= 60),
  indicaciones    TEXT CHECK (indicaciones IS NULL OR length(indicaciones) <= 300),
  creado_en       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  actualizado_en  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS ix_sedes_nombre ON sedes (nombre COLLATE NOCASE);

CREATE TABLE IF NOT EXISTS canchas (
  id              TEXT PRIMARY KEY,
  sede_id         TEXT NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
  nombre          TEXT NOT NULL COLLATE NOCASE CHECK (length(trim(nombre)) >= 1 AND length(trim(nombre)) <= 30),
  superficie      TEXT CHECK (superficie IN ('Natural', 'Sintética', 'Otra') OR superficie IS NULL),
  activa          INTEGER NOT NULL DEFAULT 1 CHECK (activa IN (0, 1)),
  creado_en       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  actualizado_en  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (sede_id, nombre COLLATE NOCASE)
);

CREATE INDEX IF NOT EXISTS ix_canchas_sede ON canchas (sede_id);

ALTER TABLE partidos ADD COLUMN cancha_id TEXT REFERENCES canchas(id) ON DELETE RESTRICT;
CREATE INDEX ix_partidos_cancha ON partidos (cancha_id);
