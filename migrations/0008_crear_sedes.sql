CREATE TABLE sedes (
  id TEXT PRIMARY KEY NOT NULL,
  nombre TEXT NOT NULL UNIQUE COLLATE NOCASE,
  direccion TEXT NOT NULL,
  creado_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE canchas (
  id TEXT PRIMARY KEY NOT NULL,
  sede_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  creado_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (sede_id, nombre),
  FOREIGN KEY (sede_id) REFERENCES sedes(id) ON DELETE CASCADE
);
