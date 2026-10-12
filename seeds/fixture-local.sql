INSERT OR IGNORE INTO usuarios (id,nombre_completo,correo,telefono,hash_contrasena,rol,activo,creado_en,actualizado_en) VALUES
('jugador-9','Mateo Rios','mateo@mail.com','3000000009','balon2026','jugador',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('jugador-10','Juliana Ortiz','juliana@mail.com','3000000010','balon2026','jugador',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('jugador-11','Nicolas Leon','nicolas@mail.com','3000000011','balon2026','jugador',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('jugador-12','Sara Pardo','sara@mail.com','3000000012','balon2026','jugador',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO equipos (id,nombre,color,capitan_id) VALUES
('equipo-local-5','Guayacanes','Naranja','jugador-9'),
('equipo-local-6','Santa Barbara','Morado','jugador-10'),
('equipo-local-7','Halcones','Vinotinto','jugador-11'),
('equipo-local-8','Universidad FC','Azul','jugador-12');

INSERT OR IGNORE INTO equipo_jugadores (equipo_id,usuario_id) VALUES
('equipo-local-5','jugador-9'),('equipo-local-6','jugador-10'),('equipo-local-7','jugador-11'),('equipo-local-8','jugador-12');

INSERT OR IGNORE INTO inscripciones (id,torneo_id,equipo_id,estado,solicitada_por,aprobada_por) VALUES
('inscripcion-local-6','torneo-local-1','equipo-local-5','APROBADO','jugador-9','admin-local'),
('inscripcion-local-7','torneo-local-1','equipo-local-6','APROBADO','jugador-10','admin-local'),
('inscripcion-local-8','torneo-local-1','equipo-local-7','APROBADO','jugador-11','admin-local'),
('inscripcion-local-9','torneo-local-1','equipo-local-8','APROBADO','jugador-12','admin-local');

INSERT OR IGNORE INTO fechas (id,torneo_id,numero) VALUES
('fecha-local-4','torneo-local-1',4),('fecha-local-5','torneo-local-1',5),('fecha-local-6','torneo-local-1',6),('fecha-local-7','torneo-local-1',7);

INSERT OR IGNORE INTO partidos (id,fecha_id,torneo_id,local_id,visitante_id,estado,goles_local,goles_visitante,fecha_hora,cancha,cancha_id) VALUES
('partido-local-4','fecha-local-4','torneo-local-1','equipo-local-1','equipo-local-3','JUGADO',3,0,'2026-11-29T09:00:00','Cancha principal','cancha-local-1'),
('partido-local-5','fecha-local-4','torneo-local-1','equipo-local-4','equipo-local-5','JUGADO',1,2,'2026-11-29T11:00:00','Cancha auxiliar','cancha-local-2'),
('partido-local-6','fecha-local-5','torneo-local-1','equipo-local-6','equipo-local-7','JUGADO',2,2,'2026-12-06T09:00:00','Cancha norte','cancha-local-3'),
('partido-local-7','fecha-local-5','torneo-local-1','equipo-local-8','equipo-local-2','JUGADO',0,1,'2026-12-06T11:00:00','Cancha principal','cancha-local-1'),
('partido-local-8','fecha-local-6','torneo-local-1','equipo-local-1','equipo-local-4','PROGRAMADO',NULL,NULL,'2026-12-13T09:00:00','Cancha auxiliar','cancha-local-2'),
('partido-local-9','fecha-local-7','torneo-local-1','equipo-local-5','equipo-local-6','PROGRAMADO',NULL,NULL,'2026-12-13T11:00:00','Cancha norte','cancha-local-3');
