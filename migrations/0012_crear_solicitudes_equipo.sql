-- Migración 0012 · Tabla de solicitudes de incorporación a equipos y gestión de plantillas por el capitán.

CREATE TABLE IF NOT EXISTS solicitudes_equipo (
  id              TEXT PRIMARY KEY NOT NULL,
  equipo_id       TEXT NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  usuario_id      TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  estado          TEXT NOT NULL DEFAULT 'PENDIENTE'
                  CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO')),
  creada_en       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  actualizada_en  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS ix_solicitudes_equipo_equipo ON solicitudes_equipo (equipo_id);
CREATE INDEX IF NOT EXISTS ix_solicitudes_equipo_usuario ON solicitudes_equipo (usuario_id);
CREATE UNIQUE INDEX IF NOT EXISTS ix_solicitud_equipo_activa ON solicitudes_equipo (equipo_id, usuario_id)
  WHERE estado = 'PENDIENTE';
