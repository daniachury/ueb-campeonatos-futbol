DELETE FROM partidos;
DELETE FROM fechas;
DELETE FROM inscripciones;
DELETE FROM equipo_jugadores;
DELETE FROM equipos;
DELETE FROM canchas;
DELETE FROM sedes;
DELETE FROM torneos;
DELETE FROM usuarios;

INSERT INTO usuarios (id,nombre_completo,correo,telefono,hash_contrasena,rol,activo,creado_en,actualizado_en) VALUES
('admin-local','Miguel Alvarado','admin@unbosque.edu.co','3001234567','balon2026','admin',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('jugador-1','Carlos Rojas','carlos@mail.com','3000000001','balon2026','jugador',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('jugador-2','Laura Gomez','laura@mail.com','3000000002','balon2026','jugador',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('jugador-3','Andres Molina','andres@mail.com','3000000003','balon2026','jugador',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('jugador-4','Ana Torres','ana@mail.com','3000000004','balon2026','jugador',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('jugador-5','Juan Perez','juan@mail.com','3000000005','balon2026','jugador',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('jugador-6','Sofia Diaz','sofia@mail.com','3000000006','balon2026','jugador',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('jugador-7','Daniel Martinez','daniel@mail.com','3000000007','balon2026','jugador',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('jugador-8','Valentina Castro','valentina@mail.com','3000000008','balon2026','jugador',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO torneos (id,nombre,descripcion,fecha_inicio,cupo,estado) VALUES
('torneo-local-1','Copa El Bosque 2026','Torneo de prueba con partidos y posiciones','2026-11-07',8,'EN_CURSO'),
('torneo-local-2','Copa Bienestar Universitario','Torneo abierto para inscripciones','2026-12-05',8,'INSCRIPCIONES_ABIERTAS'),
('torneo-local-3','Liga Interfacultades','Torneo de ejemplo finalizado','2026-09-19',8,'FINALIZADO');

INSERT INTO equipos (id,nombre,color,capitan_id) VALUES
('equipo-local-1','Real Madrid C.F.','Blanco','jugador-1'),
('equipo-local-2','Bosque FC','Verde','jugador-3'),
('equipo-local-3','Los Cedros','Rojo','jugador-5'),
('equipo-local-4','La 12 FC','Amarillo','jugador-7');

INSERT INTO equipo_jugadores (equipo_id,usuario_id) VALUES
('equipo-local-1','jugador-1'),('equipo-local-1','jugador-2'),
('equipo-local-2','jugador-3'),('equipo-local-2','jugador-4'),
('equipo-local-3','jugador-5'),('equipo-local-3','jugador-6'),
('equipo-local-4','jugador-7'),('equipo-local-4','jugador-8');

INSERT INTO sedes (id,nombre,direccion,ciudad) VALUES
('sede-local-1','Campus El Bosque','Avenida 127 # 12-20','Bogotá'),
('sede-local-2','Complejo La Floresta','Carrera 45 # 80-15','Bogotá');

INSERT INTO canchas (id,sede_id,nombre,superficie) VALUES
('cancha-local-1','sede-local-1','Cancha principal','Sintética'),
('cancha-local-2','sede-local-1','Cancha auxiliar','Natural'),
('cancha-local-3','sede-local-2','Cancha norte','Sintética');

INSERT INTO inscripciones (id,torneo_id,equipo_id,estado,solicitada_por,aprobada_por) VALUES
('inscripcion-local-1','torneo-local-1','equipo-local-1','APROBADO','jugador-1','admin-local'),
('inscripcion-local-2','torneo-local-1','equipo-local-2','APROBADO','jugador-3','admin-local'),
('inscripcion-local-3','torneo-local-1','equipo-local-3','APROBADO','jugador-5','admin-local'),
('inscripcion-local-4','torneo-local-1','equipo-local-4','PENDIENTE','jugador-7',NULL),
('inscripcion-local-5','torneo-local-2','equipo-local-1','PENDIENTE','jugador-1',NULL);

INSERT INTO fechas (id,torneo_id,numero) VALUES
('fecha-local-1','torneo-local-1',1),('fecha-local-2','torneo-local-1',2),('fecha-local-3','torneo-local-1',3);

INSERT INTO partidos (id,fecha_id,torneo_id,local_id,visitante_id,estado,goles_local,goles_visitante,fecha_hora,cancha,cancha_id) VALUES
('partido-local-1','fecha-local-1','torneo-local-1','equipo-local-1','equipo-local-2','JUGADO',2,1,'2026-11-08T09:00:00','Cancha principal','cancha-local-1'),
('partido-local-2','fecha-local-2','torneo-local-1','equipo-local-2','equipo-local-3','JUGADO',1,1,'2026-11-15T09:00:00','Cancha auxiliar','cancha-local-2'),
('partido-local-3','fecha-local-3','torneo-local-1','equipo-local-3','equipo-local-1','PROGRAMADO',NULL,NULL,'2026-11-22T11:00:00','Cancha norte','cancha-local-3');
