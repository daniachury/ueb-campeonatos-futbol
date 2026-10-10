-- Migración 0002 · Tabla de usuarios (UEB-Proyect-03 · KAN-16, épica E2).
-- Las columnas son las de la tarea [BD] de la historia; los nombres siguen el dominio
-- (nombre_completo) y se escriben en snake_case.

CREATE TABLE usuarios (
  id              TEXT    PRIMARY KEY NOT NULL,              -- crypto.randomUUID()
  nombre_completo TEXT    NOT NULL,
  correo          TEXT    NOT NULL UNIQUE COLLATE NOCASE,    -- Escenario 2: garantía final de unicidad
  telefono        TEXT    NOT NULL,
  -- TODO(KAN-16 · Escenario 5): hoy guarda la contraseña en texto plano (adaptador provisional).
  -- Cuando se elija el algoritmo de hash, esta columna guardará solo el hash.
  hash_contrasena TEXT    NOT NULL,
  rol             TEXT    NOT NULL DEFAULT 'jugador' CHECK (rol IN ('jugador', 'admin')),
  activo          INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
  creado_en       TEXT    NOT NULL,                          -- ISO 8601 en UTC
  actualizado_en  TEXT    NOT NULL
);
