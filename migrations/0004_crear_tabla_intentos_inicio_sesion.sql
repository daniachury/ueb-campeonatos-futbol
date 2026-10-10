-- Migración 0004 · Intentos fallidos de inicio de sesión (UEB-Proyect-04 · KAN-17, Escenario 4).
-- Una fila por correo, exista o no la cuenta: así el bloqueo no revela qué correos están registrados.

CREATE TABLE intentos_inicio_sesion (
  correo          TEXT    PRIMARY KEY NOT NULL COLLATE NOCASE,
  fallos_seguidos INTEGER NOT NULL DEFAULT 0 CHECK (fallos_seguidos >= 0),
  bloqueado_hasta TEXT,                                   -- ISO 8601 en UTC; NULL si no está bloqueado
  actualizado_en  TEXT    NOT NULL
);
