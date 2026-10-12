CREATE TABLE partidos (
  id TEXT PRIMARY KEY NOT NULL,
  torneo_id TEXT NOT NULL,
  equipo_local_id TEXT NOT NULL,
  equipo_visitante_id TEXT NOT NULL,
  jornada INTEGER NOT NULL,
  estado TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'JUGADO')),
  FOREIGN KEY (torneo_id) REFERENCES torneos(id) ON DELETE CASCADE,
  FOREIGN KEY (equipo_local_id) REFERENCES equipos(id),
  FOREIGN KEY (equipo_visitante_id) REFERENCES equipos(id)
);

CREATE INDEX ix_partidos_torneo ON partidos (torneo_id);
