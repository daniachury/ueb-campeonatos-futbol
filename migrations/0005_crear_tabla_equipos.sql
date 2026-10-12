CREATE TABLE IF NOT EXISTS equipos (
  id TEXT PRIMARY KEY NOT NULL,
  nombre TEXT NOT NULL,
  color TEXT NOT NULL,
  capitan_id TEXT NOT NULL,
  creado_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  actualizado_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (nombre COLLATE NOCASE),
  FOREIGN KEY (capitan_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS equipo_integrantes (
  equipo_id TEXT NOT NULL,
  usuario_id TEXT NOT NULL,
  creado_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (equipo_id, usuario_id),
  FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
