-- SIN EFECTO (corrección del esquema, 12/10/2026).
-- Esta migración pertenecía a un segundo esquema que duplicaba tablas ya creadas por otra
-- migración con columnas distintas. El código usa el esquema original, así que aquí no se
-- crea nada. Se conserva el archivo para no cambiar los nombres ya registrados en d1_migrations.
-- Tabla real: partidos (con fecha_hora, goles y estado) en 0006_crear_tablas_fechas_y_partidos.sql.
SELECT 1;
