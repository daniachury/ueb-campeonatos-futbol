CREATE TABLE IF NOT EXISTS inscripciones (
  id TEXT PRIMARY KEY NOT NULL,
  torneo_id TEXT NOT NULL,
  equipo_id TEXT NOT NULL,
  solicitante_id TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'SOLICITADA' CHECK (estado IN ('SOLICITADA', 'APROBADA', 'RECHAZADA', 'RETIRADA')),
  creado_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  actualizado_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (torneo_id, equipo_id),
  FOREIGN KEY (torneo_id) REFERENCES torneos(id) ON DELETE CASCADE,
  FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE,
  FOREIGN KEY (solicitante_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS ix_inscripciones_torneo ON inscripciones (torneo_id);
