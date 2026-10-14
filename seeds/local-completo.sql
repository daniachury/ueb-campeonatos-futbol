DELETE FROM partidos;
DELETE FROM fechas;
DELETE FROM inscripciones;
DELETE FROM solicitudes_equipo;
DELETE FROM equipo_jugadores;
DELETE FROM equipos;
DELETE FROM canchas;
DELETE FROM sedes;
DELETE FROM torneos;
DELETE FROM usuarios;

-- 1. Usuarios administradores y jugadores base
INSERT INTO usuarios (id, nombre_completo, correo, telefono, hash_contrasena, rol, activo, debe_cambiar_contrasena, creado_en, actualizado_en) VALUES
('admin-local', 'Miguel Alvarado', 'admin@unbosque.edu.co', '3001234567', 'balon2026', 'admin', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('jugador-1', 'Carlos Rojas', 'carlos@mail.com', '3000000001', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('jugador-2', 'Laura Gomez', 'laura@mail.com', '3000000002', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('jugador-3', 'Andres Molina', 'andres@mail.com', '3000000003', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('jugador-4', 'Ana Torres', 'ana@mail.com', '3000000004', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('jugador-5', 'Juan Perez', 'juan@mail.com', '3000000005', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('jugador-6', 'Sofia Diaz', 'sofia@mail.com', '3000000006', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('jugador-7', 'Daniel Martinez', 'daniel@mail.com', '3000000007', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('jugador-8', 'Valentina Castro', 'valentina@mail.com', '3000000008', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('jugador-aspirante-1', 'Esteban Ospina', 'esteban.ospina@unbosque.edu.co', '3009990001', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('jugador-aspirante-2', 'Camila Benítez', 'camila.benitez@unbosque.edu.co', '3009990002', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 2. Plantilla Bosque FC (11 jugadores)
INSERT INTO usuarios (id, nombre_completo, correo, telefono, hash_contrasena, rol, activo, debe_cambiar_contrasena, creado_en, actualizado_en) VALUES
('usr-bosque-01', 'Santiago Rincón', 'santiago.rincon@unbosque.edu.co', '3104000001', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-bosque-02', 'Mateo Cárdenas', 'mateo.cardenas@unbosque.edu.co', '3104000002', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-bosque-03', 'Julián Pardo', 'julian.pardo@unbosque.edu.co', '3104000003', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-bosque-04', 'Andrés Beltrán', 'andres.beltran@unbosque.edu.co', '3104000004', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-bosque-05', 'Felipe Quintero', 'felipe.quintero@unbosque.edu.co', '3104000005', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-bosque-06', 'Tomás Arango', 'tomas.arango@unbosque.edu.co', '3104000006', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-bosque-07', 'Nicolás Vélez', 'nicolas.velez@unbosque.edu.co', '3104000007', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-bosque-08', 'David Montoya', 'david.montoya@unbosque.edu.co', '3104000008', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-bosque-09', 'Samuel Ospina', 'samuel.ospina@unbosque.edu.co', '3104000009', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-bosque-10', 'Emilio Galeano', 'emilio.galeano@unbosque.edu.co', '3104000010', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-bosque-11', 'Martín Zuluaga', 'martin.zuluaga@unbosque.edu.co', '3104000011', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3. Plantilla Deportivo Fénix (11 jugadoras)
INSERT INTO usuarios (id, nombre_completo, correo, telefono, hash_contrasena, rol, activo, debe_cambiar_contrasena, creado_en, actualizado_en) VALUES
('usr-fenix-01', 'Valentina Rojas', 'valentina.rojas@unbosque.edu.co', '3104000012', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-fenix-02', 'Camila Duarte', 'camila.duarte@unbosque.edu.co', '3104000013', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-fenix-03', 'Daniela Pineda', 'daniela.pineda@unbosque.edu.co', '3104000014', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-fenix-04', 'Laura Herrera', 'laura.herrera@unbosque.edu.co', '3104000015', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-fenix-05', 'Mariana Salcedo', 'mariana.salcedo@unbosque.edu.co', '3104000016', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-fenix-06', 'Sofía Bermúdez', 'sofia.bermudez@unbosque.edu.co', '3104000017', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-fenix-07', 'Isabella Correa', 'isabella.correa@unbosque.edu.co', '3104000018', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-fenix-08', 'Gabriela Patiño', 'gabriela.patino@unbosque.edu.co', '3104000019', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-fenix-09', 'Juliana Acosta', 'juliana.acosta@unbosque.edu.co', '3104000020', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-fenix-10', 'Paula Mejía', 'paula.mejia@unbosque.edu.co', '3104000021', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-fenix-11', 'Natalia Cifuentes', 'natalia.cifuentes@unbosque.edu.co', '3104000022', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4. Plantilla Real Cedritos (11 jugadores)
INSERT INTO usuarios (id, nombre_completo, correo, telefono, hash_contrasena, rol, activo, debe_cambiar_contrasena, creado_en, actualizado_en) VALUES
('usr-cedritos-01', 'Sebastián Torres', 'sebastian.torres@unbosque.edu.co', '3104000023', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-cedritos-02', 'Alejandro Navarro', 'alejandro.navarro@unbosque.edu.co', '3104000024', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-cedritos-03', 'Diego Cortés', 'diego.cortes@unbosque.edu.co', '3104000025', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-cedritos-04', 'Juan Esteban Silva', 'juan.silva@unbosque.edu.co', '3104000026', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-cedritos-05', 'Miguel Ángel Rueda', 'miguel.rueda@unbosque.edu.co', '3104000027', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-cedritos-06', 'Cristian Barrera', 'cristian.barrera@unbosque.edu.co', '3104000028', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-cedritos-07', 'Kevin Ortega', 'kevin.ortega@unbosque.edu.co', '3104000029', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-cedritos-08', 'Brayan Castaño', 'brayan.castano@unbosque.edu.co', '3104000030', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-cedritos-09', 'Jhon Fredy Molina', 'jhon.molina@unbosque.edu.co', '3104000031', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-cedritos-10', 'Óscar Peña', 'oscar.pena@unbosque.edu.co', '3104000032', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-cedritos-11', 'Iván Restrepo', 'ivan.restrepo@unbosque.edu.co', '3104000033', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 5. Plantilla Unión Andina (11 jugadoras)
INSERT INTO usuarios (id, nombre_completo, correo, telefono, hash_contrasena, rol, activo, debe_cambiar_contrasena, creado_en, actualizado_en) VALUES
('usr-andina-01', 'Carolina Guzmán', 'carolina.guzman@unbosque.edu.co', '3104000034', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-andina-02', 'Andrea Villamil', 'andrea.villamil@unbosque.edu.co', '3104000035', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-andina-03', 'Manuela Franco', 'manuela.franco@unbosque.edu.co', '3104000036', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-andina-04', 'Lorena Amaya', 'lorena.amaya@unbosque.edu.co', '3104000037', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-andina-05', 'Diana Carvajal', 'diana.carvajal@unbosque.edu.co', '3104000038', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-andina-06', 'Tatiana Rivera', 'tatiana.rivera@unbosque.edu.co', '3104000039', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-andina-07', 'Catalina Suárez', 'catalina.suarez@unbosque.edu.co', '3104000040', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-andina-08', 'Luisa Fernanda Prieto', 'luisa.prieto@unbosque.edu.co', '3104000041', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-andina-09', 'Ximena Lozano', 'ximena.lozano@unbosque.edu.co', '3104000042', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-andina-10', 'Angélica Moreno', 'angelica.moreno@unbosque.edu.co', '3104000043', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-andina-11', 'Sara Becerra', 'sara.becerra@unbosque.edu.co', '3104000044', 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 6. Torneos en diferentes estados
INSERT INTO torneos (id, nombre, descripcion, fecha_inicio, cupo, estado) VALUES
('torneo-local-1', 'Copa El Bosque 2026', 'Torneo de apertura con fixture y tabla en desarrollo.', '2026-11-07', 8, 'EN_CURSO'),
('torneo-local-2', 'Copa Bienestar Universitario', 'Torneo abierto para inscripciones de todas las facultades.', '2026-12-05', 8, 'INSCRIPCIONES_ABIERTAS'),
('torneo-local-3', 'Torneo Interfacultades Primavera', 'Torneo preparatorio en fase de borrador.', '2027-02-15', 8, 'BORRADOR'),
('torneo-local-4', 'Liga Universitaria 2025', 'Edición anterior completada con éxito.', '2025-11-20', 8, 'FINALIZADO');

-- 7. Equipos registrados con capitanes
INSERT INTO equipos (id, nombre, color, capitan_id, activo) VALUES
('equipo-local-1', 'Real Madrid C.F.', 'Blanco', 'jugador-1', 1),
('equipo-local-2', 'Bosque FC', 'Verde', 'usr-bosque-01', 1),
('equipo-local-3', 'Deportivo Fénix', 'Naranja', 'usr-fenix-01', 1),
('equipo-local-4', 'Real Cedritos', 'Azul', 'usr-cedritos-01', 1),
('equipo-local-5', 'Unión Andina', 'Blanco', 'usr-andina-01', 1);

-- 8. Asignación de integrantes a los equipos
INSERT INTO equipo_jugadores (equipo_id, usuario_id) VALUES
('equipo-local-1', 'jugador-1'), ('equipo-local-1', 'jugador-2'), ('equipo-local-1', 'jugador-3'),
('equipo-local-1', 'jugador-4'), ('equipo-local-1', 'jugador-5'), ('equipo-local-1', 'jugador-6'),
('equipo-local-1', 'jugador-7'), ('equipo-local-1', 'jugador-8'),

('equipo-local-2', 'usr-bosque-01'), ('equipo-local-2', 'usr-bosque-02'), ('equipo-local-2', 'usr-bosque-03'),
('equipo-local-2', 'usr-bosque-04'), ('equipo-local-2', 'usr-bosque-05'), ('equipo-local-2', 'usr-bosque-06'),
('equipo-local-2', 'usr-bosque-07'), ('equipo-local-2', 'usr-bosque-08'), ('equipo-local-2', 'usr-bosque-09'),
('equipo-local-2', 'usr-bosque-10'), ('equipo-local-2', 'usr-bosque-11'),

('equipo-local-3', 'usr-fenix-01'), ('equipo-local-3', 'usr-fenix-02'), ('equipo-local-3', 'usr-fenix-03'),
('equipo-local-3', 'usr-fenix-04'), ('equipo-local-3', 'usr-fenix-05'), ('equipo-local-3', 'usr-fenix-06'),
('equipo-local-3', 'usr-fenix-07'), ('equipo-local-3', 'usr-fenix-08'), ('equipo-local-3', 'usr-fenix-09'),
('equipo-local-3', 'usr-fenix-10'), ('equipo-local-3', 'usr-fenix-11'),

('equipo-local-4', 'usr-cedritos-01'), ('equipo-local-4', 'usr-cedritos-02'), ('equipo-local-4', 'usr-cedritos-03'),
('equipo-local-4', 'usr-cedritos-04'), ('equipo-local-4', 'usr-cedritos-05'), ('equipo-local-4', 'usr-cedritos-06'),
('equipo-local-4', 'usr-cedritos-07'), ('equipo-local-4', 'usr-cedritos-08'), ('equipo-local-4', 'usr-cedritos-09'),
('equipo-local-4', 'usr-cedritos-10'), ('equipo-local-4', 'usr-cedritos-11'),

('equipo-local-5', 'usr-andina-01'), ('equipo-local-5', 'usr-andina-02'), ('equipo-local-5', 'usr-andina-03'),
('equipo-local-5', 'usr-andina-04'), ('equipo-local-5', 'usr-andina-05'), ('equipo-local-5', 'usr-andina-06'),
('equipo-local-5', 'usr-andina-07'), ('equipo-local-5', 'usr-andina-08'), ('equipo-local-5', 'usr-andina-09'),
('equipo-local-5', 'usr-andina-10'), ('equipo-local-5', 'usr-andina-11');

-- 9. Sedes y canchas
INSERT INTO sedes (id, nombre, direccion, ciudad) VALUES
('sede-local-1', 'Campus El Bosque', 'Avenida 127 # 12-20', 'Bogotá'),
('sede-local-2', 'Complejo Deportivo La Floresta', 'Carrera 45 # 80-15', 'Bogotá');

INSERT INTO canchas (id, sede_id, nombre, superficie) VALUES
('cancha-local-1', 'sede-local-1', 'Cancha Principal', 'Sintética'),
('cancha-local-2', 'sede-local-1', 'Cancha Auxiliar', 'Natural'),
('cancha-local-3', 'sede-local-2', 'Cancha Norte', 'Sintética');

-- 10. Inscripciones
INSERT INTO inscripciones (id, torneo_id, equipo_id, estado, solicitada_por, aprobada_por) VALUES
('inscripcion-local-1', 'torneo-local-1', 'equipo-local-2', 'APROBADO', 'usr-bosque-01', 'admin-local'),
('inscripcion-local-2', 'torneo-local-1', 'equipo-local-3', 'APROBADO', 'usr-fenix-01', 'admin-local'),
('inscripcion-local-3', 'torneo-local-1', 'equipo-local-4', 'APROBADO', 'usr-cedritos-01', 'admin-local'),
('inscripcion-local-4', 'torneo-local-1', 'equipo-local-5', 'APROBADO', 'usr-andina-01', 'admin-local'),
('inscripcion-local-5', 'torneo-local-2', 'equipo-local-1', 'PENDIENTE', 'jugador-1', NULL),
('inscripcion-local-6', 'torneo-local-2', 'equipo-local-2', 'PENDIENTE', 'usr-bosque-01', NULL);

-- 11. Fechas y partidos programados
INSERT INTO fechas (id, torneo_id, numero) VALUES
('fecha-local-1', 'torneo-local-1', 1),
('fecha-local-2', 'torneo-local-1', 2),
('fecha-local-3', 'torneo-local-1', 3);

INSERT INTO partidos (id, fecha_id, torneo_id, local_id, visitante_id, estado, goles_local, goles_visitante, fecha_hora, cancha, cancha_id) VALUES
('partido-local-1', 'fecha-local-1', 'torneo-local-1', 'equipo-local-2', 'equipo-local-3', 'JUGADO', 2, 1, '2026-11-08T09:00:00', 'Cancha Principal', 'cancha-local-1'),
('partido-local-2', 'fecha-local-2', 'torneo-local-1', 'equipo-local-4', 'equipo-local-5', 'JUGADO', 1, 1, '2026-11-15T09:00:00', 'Cancha Auxiliar', 'cancha-local-2'),
('partido-local-3', 'fecha-local-3', 'torneo-local-1', 'equipo-local-2', 'equipo-local-4', 'PROGRAMADO', NULL, NULL, '2026-11-22T11:00:00', 'Cancha Norte', 'cancha-local-3');

-- 12. Solicitudes de incorporación a equipos (para gestión del capitán)
INSERT INTO solicitudes_equipo (id, equipo_id, usuario_id, estado) VALUES
('solicitud-local-1', 'equipo-local-1', 'jugador-aspirante-1', 'PENDIENTE'),
('solicitud-local-2', 'equipo-local-1', 'jugador-aspirante-2', 'PENDIENTE');

