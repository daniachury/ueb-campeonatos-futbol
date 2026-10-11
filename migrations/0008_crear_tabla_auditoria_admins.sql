-- Migración 0008 · Auditoría de administradores (UEB-Proyect-05 · KAN-18).
-- Registra quién creó a quién y cuándo (Escenario 1: la acción queda registrada).
-- accion='CREAR_ADMIN'    → se usó POST /admin/usuarios
-- accion='PROMOVER_JUGADOR' → se usó POST /admin/usuarios/:id/promover

CREATE TABLE auditoria_admins (
  id                TEXT NOT NULL PRIMARY KEY,
  admin_creador_id  TEXT NOT NULL REFERENCES usuarios(id),
  usuario_id        TEXT NOT NULL REFERENCES usuarios(id),
  accion            TEXT NOT NULL CHECK (accion IN ('CREAR_ADMIN', 'PROMOVER_JUGADOR')),
  creado_en         TEXT NOT NULL  -- ISO 8601 en UTC
);
