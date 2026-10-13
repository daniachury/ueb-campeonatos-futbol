-- SIN EFECTO (corrección del esquema, 12/10/2026).
-- Esta migración pertenecía a un segundo esquema que duplicaba tablas ya creadas por otra
-- migración con columnas distintas. El código usa el esquema original, así que aquí no se
-- crea nada. Se conserva el archivo para no cambiar los nombres ya registrados en d1_migrations.
-- Tablas reales: equipos y equipo_jugadores en 0005_crear_tablas_equipos_e_inscripciones.sql.
SELECT 1;
