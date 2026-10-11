-- Migración 0007 · Bandera de cambio obligatorio de contraseña (UEB-Proyect-05 · KAN-18).
-- Los administradores creados por otro admin nacen con esta bandera en 1.
-- El primer ingreso los lleva a "Cambia tu contraseña" hasta que la cambien.
-- Los jugadores existentes nacen con 0 (comportamiento previo sin cambios).

ALTER TABLE usuarios
  ADD COLUMN debe_cambiar_contrasena INTEGER NOT NULL DEFAULT 0
    CHECK (debe_cambiar_contrasena IN (0, 1));
