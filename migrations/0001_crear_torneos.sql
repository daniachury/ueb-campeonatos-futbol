-- Migración 0001 · Tabla base de torneos (épica E3).
-- Las migraciones se aplican en orden y nunca se editan después de aplicadas:
-- cada historia que cambie la base de datos agrega un archivo nuevo.

CREATE TABLE torneos (
  id             TEXT PRIMARY KEY,                      -- crypto.randomUUID()
  nombre         TEXT NOT NULL UNIQUE COLLATE NOCASE,   -- único sin distinguir mayúsculas
  descripcion    TEXT,
  modalidad      TEXT NOT NULL DEFAULT 'FUTBOL_11' CHECK (modalidad = 'FUTBOL_11'),
  formato        TEXT NOT NULL DEFAULT 'LIGA'      CHECK (formato = 'LIGA'),
  fecha_inicio   TEXT NOT NULL,                         -- ISO 8601: YYYY-MM-DD
  cupo           INTEGER NOT NULL CHECK (cupo BETWEEN 3 AND 20),
  estado         TEXT NOT NULL DEFAULT 'BORRADOR'
                 CHECK (estado IN ('BORRADOR', 'INSCRIPCIONES_ABIERTAS', 'EN_CURSO', 'FINALIZADO', 'CANCELADO')),
  creado_en      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  actualizado_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX ix_torneos_estado ON torneos (estado);
