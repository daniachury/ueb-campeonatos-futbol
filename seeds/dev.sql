-- Datos de ejemplo SOLO para desarrollo local:  npm run db:seed:local
-- Nunca ejecutar contra la base remota.

DELETE FROM torneos;
DELETE FROM sesiones;
DELETE FROM usuarios;

INSERT INTO usuarios (id, nombre_completo, correo, telefono, hash_contrasena, rol, activo, creado_en, actualizado_en)
VALUES ('dev-admin', 'Admin de prueba', 'admin@mail.com', '3000000000', 'balon2026', 'admin', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO torneos (id, nombre, descripcion, fecha_inicio, cupo, estado) VALUES
  ('demo-t1', 'Copa El Bosque 2026',  'Torneo de ejemplo con inscripciones abiertas', '2026-11-07', 8,  'INSCRIPCIONES_ABIERTAS'),
  ('demo-t2', 'Liga Interfacultades', 'Torneo de ejemplo en curso',                   '2026-09-19', 10, 'EN_CURSO'),
  ('demo-t3', 'Liga Intersemestral',  'Torneo de ejemplo ya terminado',               '2026-06-06', 6,  'FINALIZADO'),
  ('demo-t4', 'Torneo en borrador',   'No debe aparecer en el listado de jugadores',  '2026-12-05', 6,  'BORRADOR');
