CREATE VIEW IF NOT EXISTS equipo_integrantes AS
SELECT equipo_id, usuario_id, fecha_ingreso AS creado_en
FROM equipo_jugadores;
