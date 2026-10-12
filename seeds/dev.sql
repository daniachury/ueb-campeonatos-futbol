-- Datos de ejemplo SOLO para desarrollo local:  npm run db:seed:local
-- Nunca ejecutar contra la base remota.

DELETE FROM partidos;
DELETE FROM inscripciones;
DELETE FROM canchas;
DELETE FROM sedes;
DELETE FROM equipo_integrantes;
DELETE FROM equipos;
DELETE FROM torneos;
DELETE FROM sesiones;
DELETE FROM usuarios;

INSERT INTO usuarios (id, nombre_completo, correo, telefono, hash_contrasena, rol, activo, creado_en, actualizado_en)
VALUES ('dev-admin', 'Admin de prueba', 'admin@mail.com', '3000000000', 'balon2026', 'admin', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO usuarios (id, nombre_completo, correo, telefono, hash_contrasena, rol, activo, creado_en, actualizado_en) VALUES
  ('dev-jugador-1', 'Miguel Alvarado', 'miguel@mail.com', '3000000001', 'balon2026', 'jugador', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dev-jugador-2', 'Laura Gomez', 'laura@mail.com', '3000000002', 'balon2026', 'jugador', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dev-jugador-3', 'Carlos Rojas', 'carlos@mail.com', '3000000003', 'balon2026', 'jugador', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dev-jugador-4', 'Ana Torres', 'ana@mail.com', '3000000004', 'balon2026', 'jugador', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dev-jugador-5', 'Juan Perez', 'juan@mail.com', '3000000005', 'balon2026', 'jugador', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dev-jugador-6', 'Sofia Diaz', 'sofia@mail.com', '3000000006', 'balon2026', 'jugador', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dev-jugador-7', 'Daniel Martinez', 'daniel@mail.com', '3000000007', 'balon2026', 'jugador', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dev-jugador-8', 'Valentina Castro', 'valentina@mail.com', '3000000008', 'balon2026', 'jugador', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dev-jugador-9', 'Andres Molina', 'andres@mail.com', '3000000009', 'balon2026', 'jugador', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dev-jugador-10', 'Natalia Herrera', 'natalia@mail.com', '3000000010', 'balon2026', 'jugador', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dev-jugador-11', 'Sebastian Vargas', 'sebastian@mail.com', '3000000011', 'balon2026', 'jugador', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dev-jugador-12', 'Mariana Lopez', 'mariana@mail.com', '3000000012', 'balon2026', 'jugador', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dev-jugador-13', 'Felipe Ramirez', 'felipe@mail.com', '3000000013', 'balon2026', 'jugador', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dev-jugador-14', 'Camila Moreno', 'camila@mail.com', '3000000014', 'balon2026', 'jugador', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dev-jugador-15', 'Luis Gonzalez', 'luis@mail.com', '3000000015', 'balon2026', 'jugador', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dev-jugador-16', 'Paula Sanchez', 'paula@mail.com', '3000000016', 'balon2026', 'jugador', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dev-jugador-17', 'Jorge Silva', 'jorge@mail.com', '3000000017', 'balon2026', 'jugador', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dev-jugador-18', 'Laura Mendoza', 'laura2@mail.com', '3000000018', 'balon2026', 'jugador', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dev-jugador-19', 'Diego Cardenas', 'diego@mail.com', '3000000019', 'balon2026', 'jugador', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dev-jugador-20', 'Isabela Ruiz', 'isabela@mail.com', '3000000020', 'balon2026', 'jugador', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dev-jugador-21', 'Mateo Rios', 'mateo@mail.com', '3000000021', 'balon2026', 'jugador', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dev-jugador-22', 'Juliana Ortiz', 'juliana@mail.com', '3000000022', 'balon2026', 'jugador', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dev-jugador-23', 'Nicolas Leon', 'nicolas@mail.com', '3000000023', 'balon2026', 'jugador', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dev-jugador-24', 'Sara Pardo', 'sara@mail.com', '3000000024', 'balon2026', 'jugador', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO equipos (id, nombre, color, capitan_id) VALUES
  ('demo-e1', 'Real Madrid C.F.', 'Blanco', 'dev-jugador-1'),
  ('demo-e2', 'Bosque FC', 'Verde', 'dev-jugador-3'),
  ('demo-e3', 'Andes United', 'Azul', 'dev-jugador-5');

INSERT INTO equipos (id, nombre, color, capitan_id) VALUES
  ('demo-e4', 'Los Cedros', 'Rojo', 'dev-jugador-7'),
  ('demo-e5', 'La 12 FC', 'Amarillo', 'dev-jugador-9'),
  ('demo-e6', 'Guayacanes', 'Naranja', 'dev-jugador-11'),
  ('demo-e7', 'Santa Barbara', 'Morado', 'dev-jugador-13'),
  ('demo-e8', 'Los Andes', 'Gris', 'dev-jugador-8'),
  ('demo-e9', 'Tigres del Norte', 'Negro', 'dev-jugador-15'),
  ('demo-e10', 'Cafeteros FC', 'Cafe', 'dev-jugador-17'),
  ('demo-e11', 'La Sabana', 'Celeste', 'dev-jugador-19'),
  ('demo-e12', 'Halcones', 'Vinotinto', 'dev-jugador-21'),
  ('demo-e13', 'Universidad FC', 'Blanco y azul', 'dev-jugador-23');

INSERT INTO equipo_integrantes (equipo_id, usuario_id) VALUES
  ('demo-e1', 'dev-jugador-1'), ('demo-e1', 'dev-jugador-2'),
  ('demo-e2', 'dev-jugador-3'), ('demo-e2', 'dev-jugador-4'),
  ('demo-e3', 'dev-jugador-5'), ('demo-e3', 'dev-jugador-6');

INSERT INTO equipo_integrantes (equipo_id, usuario_id) VALUES
  ('demo-e4', 'dev-jugador-7'), ('demo-e4', 'dev-jugador-10'),
  ('demo-e5', 'dev-jugador-9'), ('demo-e5', 'dev-jugador-12'),
  ('demo-e6', 'dev-jugador-11'), ('demo-e6', 'dev-jugador-14'),
  ('demo-e7', 'dev-jugador-13'), ('demo-e8', 'dev-jugador-8');

INSERT INTO equipo_integrantes (equipo_id, usuario_id) VALUES
  ('demo-e9', 'dev-jugador-15'), ('demo-e9', 'dev-jugador-16'),
  ('demo-e10', 'dev-jugador-17'), ('demo-e10', 'dev-jugador-18'),
  ('demo-e11', 'dev-jugador-19'), ('demo-e11', 'dev-jugador-20'),
  ('demo-e12', 'dev-jugador-21'), ('demo-e12', 'dev-jugador-22'),
  ('demo-e13', 'dev-jugador-23'), ('demo-e13', 'dev-jugador-24');

INSERT INTO torneos (id, nombre, descripcion, fecha_inicio, cupo, estado) VALUES
  ('demo-t1', 'Copa El Bosque 2026',  'Torneo de ejemplo con inscripciones abiertas', '2026-11-07', 8,  'INSCRIPCIONES_ABIERTAS'),
  ('demo-t2', 'Liga Interfacultades', 'Torneo de ejemplo en curso',                   '2026-09-19', 10, 'EN_CURSO'),
  ('demo-t3', 'Liga Intersemestral',  'Torneo de ejemplo ya terminado',               '2026-06-06', 6,  'FINALIZADO'),
  ('demo-t4', 'Torneo en borrador',   'No debe aparecer en el listado de jugadores',  '2026-12-05', 6,  'BORRADOR');

INSERT INTO torneos (id, nombre, descripcion, fecha_inicio, cupo, estado) VALUES
  ('demo-t5', 'Copa de Bienestar Universitario', 'Torneo amistoso entre facultades', '2026-10-25', 8, 'INSCRIPCIONES_ABIERTAS'),
  ('demo-t6', 'Copa de Fin de Año', 'Cierre deportivo del semestre', '2026-12-12', 10, 'BORRADOR');

INSERT INTO sedes (id, nombre, direccion) VALUES
  ('demo-sede-1', 'Campus El Bosque', 'Avenida 127 # 12-20'),
  ('demo-sede-2', 'Complejo La Floresta', 'Carrera 45 # 80-15');

INSERT INTO canchas (id, sede_id, nombre) VALUES
  ('demo-cancha-1', 'demo-sede-1', 'Cancha principal'),
  ('demo-cancha-2', 'demo-sede-1', 'Cancha auxiliar'),
  ('demo-cancha-3', 'demo-sede-2', 'Cancha norte');

INSERT INTO inscripciones (id, torneo_id, equipo_id, solicitante_id, estado) VALUES
  ('demo-i1', 'demo-t1', 'demo-e1', 'dev-jugador-1', 'APROBADA'),
  ('demo-i2', 'demo-t1', 'demo-e2', 'dev-jugador-3', 'APROBADA'),
  ('demo-i3', 'demo-t1', 'demo-e3', 'dev-jugador-5', 'SOLICITADA');

INSERT INTO inscripciones (id, torneo_id, equipo_id, solicitante_id, estado) VALUES
  ('demo-i4', 'demo-t1', 'demo-e4', 'dev-jugador-7', 'APROBADA'),
  ('demo-i5', 'demo-t1', 'demo-e5', 'dev-jugador-9', 'APROBADA'),
  ('demo-i6', 'demo-t5', 'demo-e6', 'dev-jugador-11', 'APROBADA'),
  ('demo-i7', 'demo-t5', 'demo-e7', 'dev-jugador-13', 'SOLICITADA'),
  ('demo-i8', 'demo-t5', 'demo-e8', 'dev-jugador-8', 'RECHAZADA');

INSERT INTO partidos (id, torneo_id, equipo_local_id, equipo_visitante_id, jornada, sede_id, cancha_id, fecha, hora, goles_local, goles_visitante, estado) VALUES
  ('demo-p1', 'demo-t1', 'demo-e1', 'demo-e2', 1, 'demo-sede-1', 'demo-cancha-1', '2026-11-08', '09:00', 2, 1, 'JUGADO'),
  ('demo-p2', 'demo-t1', 'demo-e2', 'demo-e3', 2, 'demo-sede-1', 'demo-cancha-2', '2026-11-15', '09:00', 1, 1, 'JUGADO'),
  ('demo-p3', 'demo-t1', 'demo-e3', 'demo-e1', 3, 'demo-sede-2', 'demo-cancha-3', '2026-11-22', '11:00', NULL, NULL, 'PENDIENTE');

INSERT INTO partidos (id, torneo_id, equipo_local_id, equipo_visitante_id, jornada, sede_id, cancha_id, fecha, hora, goles_local, goles_visitante, estado) VALUES
  ('demo-p4', 'demo-t1', 'demo-e4', 'demo-e5', 1, 'demo-sede-2', 'demo-cancha-3', '2026-11-08', '11:00', 3, 2, 'JUGADO'),
  ('demo-p5', 'demo-t5', 'demo-e6', 'demo-e7', 1, 'demo-sede-1', 'demo-cancha-1', '2026-10-26', '15:00', NULL, NULL, 'PENDIENTE');
