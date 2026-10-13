-- Dataset de demostración: Copa Liga Bosque 2026 (4 equipos, 2 sedes, fixture programado).
--
-- Seguro para producción y para cargarlo varias veces: identificadores fijos con el prefijo
-- 'demo-lb26-' e INSERT OR IGNORE. No borra ni modifica datos existentes; si un registro ya
-- existe, se conserva tal cual.
--
--   Producción:  npx wrangler d1 execute DB --remote --file=seeds/demo.sql
--   Local:       npx wrangler d1 execute DB --local  --file=seeds/demo.sql
--
-- Las 44 cuentas son jugadores (ninguna es administrador). Comparten una contraseña de
-- demostración que no está en este archivo: aquí solo va su hash PBKDF2.

INSERT OR IGNORE INTO usuarios
  (id, nombre_completo, correo, telefono, hash_contrasena, rol, activo, debe_cambiar_contrasena, creado_en, actualizado_en)
VALUES
  ('demo-lb26-jugador-bosque-01', 'Santiago Rincón', 'santiago.rincon.bosque@demo.ligabosque.test', '3104000000', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-bosque-02', 'Mateo Cárdenas', 'mateo.cardenas.bosque@demo.ligabosque.test', '3104000001', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-bosque-03', 'Julián Pardo', 'julian.pardo.bosque@demo.ligabosque.test', '3104000002', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-bosque-04', 'Andrés Beltrán', 'andres.beltran.bosque@demo.ligabosque.test', '3104000003', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-bosque-05', 'Felipe Quintero', 'felipe.quintero.bosque@demo.ligabosque.test', '3104000004', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-bosque-06', 'Tomás Arango', 'tomas.arango.bosque@demo.ligabosque.test', '3104000005', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-bosque-07', 'Nicolás Vélez', 'nicolas.velez.bosque@demo.ligabosque.test', '3104000006', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-bosque-08', 'David Montoya', 'david.montoya.bosque@demo.ligabosque.test', '3104000007', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-bosque-09', 'Samuel Ospina', 'samuel.ospina.bosque@demo.ligabosque.test', '3104000008', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-bosque-10', 'Emilio Galeano', 'emilio.galeano.bosque@demo.ligabosque.test', '3104000009', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-bosque-11', 'Martín Zuluaga', 'martin.zuluaga.bosque@demo.ligabosque.test', '3104000010', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-fenix-01', 'Valentina Rojas', 'valentina.rojas.fenix@demo.ligabosque.test', '3104000011', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-fenix-02', 'Camila Duarte', 'camila.duarte.fenix@demo.ligabosque.test', '3104000012', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-fenix-03', 'Daniela Pineda', 'daniela.pineda.fenix@demo.ligabosque.test', '3104000013', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-fenix-04', 'Laura Herrera', 'laura.herrera.fenix@demo.ligabosque.test', '3104000014', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-fenix-05', 'Mariana Salcedo', 'mariana.salcedo.fenix@demo.ligabosque.test', '3104000015', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-fenix-06', 'Sofía Bermúdez', 'sofia.bermudez.fenix@demo.ligabosque.test', '3104000016', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-fenix-07', 'Isabella Correa', 'isabella.correa.fenix@demo.ligabosque.test', '3104000017', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-fenix-08', 'Gabriela Patiño', 'gabriela.patino.fenix@demo.ligabosque.test', '3104000018', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-fenix-09', 'Juliana Acosta', 'juliana.acosta.fenix@demo.ligabosque.test', '3104000019', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-fenix-10', 'Paula Mejía', 'paula.mejia.fenix@demo.ligabosque.test', '3104000020', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-fenix-11', 'Natalia Cifuentes', 'natalia.cifuentes.fenix@demo.ligabosque.test', '3104000021', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-cedritos-01', 'Sebastián Torres', 'sebastian.torres.cedritos@demo.ligabosque.test', '3104000022', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-cedritos-02', 'Alejandro Navarro', 'alejandro.navarro.cedritos@demo.ligabosque.test', '3104000023', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-cedritos-03', 'Diego Cortés', 'diego.cortes.cedritos@demo.ligabosque.test', '3104000024', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-cedritos-04', 'Juan Esteban Silva', 'juan.silva.cedritos@demo.ligabosque.test', '3104000025', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-cedritos-05', 'Miguel Ángel Rueda', 'miguel.rueda.cedritos@demo.ligabosque.test', '3104000026', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-cedritos-06', 'Cristian Barrera', 'cristian.barrera.cedritos@demo.ligabosque.test', '3104000027', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-cedritos-07', 'Kevin Ortega', 'kevin.ortega.cedritos@demo.ligabosque.test', '3104000028', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-cedritos-08', 'Brayan Castaño', 'brayan.castano.cedritos@demo.ligabosque.test', '3104000029', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-cedritos-09', 'Jhon Fredy Molina', 'jhon.molina.cedritos@demo.ligabosque.test', '3104000030', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-cedritos-10', 'Óscar Peña', 'oscar.pena.cedritos@demo.ligabosque.test', '3104000031', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-cedritos-11', 'Iván Restrepo', 'ivan.restrepo.cedritos@demo.ligabosque.test', '3104000032', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-andina-01', 'Carolina Guzmán', 'carolina.guzman.andina@demo.ligabosque.test', '3104000033', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-andina-02', 'Andrea Villamil', 'andrea.villamil.andina@demo.ligabosque.test', '3104000034', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-andina-03', 'Manuela Franco', 'manuela.franco.andina@demo.ligabosque.test', '3104000035', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-andina-04', 'Lorena Amaya', 'lorena.amaya.andina@demo.ligabosque.test', '3104000036', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-andina-05', 'Diana Carvajal', 'diana.carvajal.andina@demo.ligabosque.test', '3104000037', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-andina-06', 'Tatiana Rivera', 'tatiana.rivera.andina@demo.ligabosque.test', '3104000038', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-andina-07', 'Catalina Suárez', 'catalina.suarez.andina@demo.ligabosque.test', '3104000039', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-andina-08', 'Luisa Fernanda Prieto', 'luisa.prieto.andina@demo.ligabosque.test', '3104000040', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-andina-09', 'Ximena Lozano', 'ximena.lozano.andina@demo.ligabosque.test', '3104000041', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-andina-10', 'Angélica Moreno', 'angelica.moreno.andina@demo.ligabosque.test', '3104000042', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-jugador-andina-11', 'Sara Becerra', 'sara.becerra.andina@demo.ligabosque.test', '3104000043', 'pbkdf2_sha256$100000$/YOcXyBKB9hnYKLIxhpSuw==$g69Q8BlnDIYw9YNDV3F+xP8qL3K3VSxEsxeJ2MYiAIY=', 'jugador', 1, 0, '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z');

INSERT OR IGNORE INTO equipos (id, nombre, color, capitan_id, activo) VALUES
  ('demo-lb26-equipo-bosque', 'Bosque FC', 'Verde', 'demo-lb26-jugador-bosque-01', 1),
  ('demo-lb26-equipo-fenix', 'Deportivo Fénix', 'Naranja', 'demo-lb26-jugador-fenix-01', 1),
  ('demo-lb26-equipo-cedritos', 'Real Cedritos', 'Azul', 'demo-lb26-jugador-cedritos-01', 1),
  ('demo-lb26-equipo-andina', 'Unión Andina', 'Blanco', 'demo-lb26-jugador-andina-01', 1);

INSERT OR IGNORE INTO equipo_jugadores (equipo_id, usuario_id) VALUES
  ('demo-lb26-equipo-bosque', 'demo-lb26-jugador-bosque-01'),
  ('demo-lb26-equipo-bosque', 'demo-lb26-jugador-bosque-02'),
  ('demo-lb26-equipo-bosque', 'demo-lb26-jugador-bosque-03'),
  ('demo-lb26-equipo-bosque', 'demo-lb26-jugador-bosque-04'),
  ('demo-lb26-equipo-bosque', 'demo-lb26-jugador-bosque-05'),
  ('demo-lb26-equipo-bosque', 'demo-lb26-jugador-bosque-06'),
  ('demo-lb26-equipo-bosque', 'demo-lb26-jugador-bosque-07'),
  ('demo-lb26-equipo-bosque', 'demo-lb26-jugador-bosque-08'),
  ('demo-lb26-equipo-bosque', 'demo-lb26-jugador-bosque-09'),
  ('demo-lb26-equipo-bosque', 'demo-lb26-jugador-bosque-10'),
  ('demo-lb26-equipo-bosque', 'demo-lb26-jugador-bosque-11'),
  ('demo-lb26-equipo-fenix', 'demo-lb26-jugador-fenix-01'),
  ('demo-lb26-equipo-fenix', 'demo-lb26-jugador-fenix-02'),
  ('demo-lb26-equipo-fenix', 'demo-lb26-jugador-fenix-03'),
  ('demo-lb26-equipo-fenix', 'demo-lb26-jugador-fenix-04'),
  ('demo-lb26-equipo-fenix', 'demo-lb26-jugador-fenix-05'),
  ('demo-lb26-equipo-fenix', 'demo-lb26-jugador-fenix-06'),
  ('demo-lb26-equipo-fenix', 'demo-lb26-jugador-fenix-07'),
  ('demo-lb26-equipo-fenix', 'demo-lb26-jugador-fenix-08'),
  ('demo-lb26-equipo-fenix', 'demo-lb26-jugador-fenix-09'),
  ('demo-lb26-equipo-fenix', 'demo-lb26-jugador-fenix-10'),
  ('demo-lb26-equipo-fenix', 'demo-lb26-jugador-fenix-11'),
  ('demo-lb26-equipo-cedritos', 'demo-lb26-jugador-cedritos-01'),
  ('demo-lb26-equipo-cedritos', 'demo-lb26-jugador-cedritos-02'),
  ('demo-lb26-equipo-cedritos', 'demo-lb26-jugador-cedritos-03'),
  ('demo-lb26-equipo-cedritos', 'demo-lb26-jugador-cedritos-04'),
  ('demo-lb26-equipo-cedritos', 'demo-lb26-jugador-cedritos-05'),
  ('demo-lb26-equipo-cedritos', 'demo-lb26-jugador-cedritos-06'),
  ('demo-lb26-equipo-cedritos', 'demo-lb26-jugador-cedritos-07'),
  ('demo-lb26-equipo-cedritos', 'demo-lb26-jugador-cedritos-08'),
  ('demo-lb26-equipo-cedritos', 'demo-lb26-jugador-cedritos-09'),
  ('demo-lb26-equipo-cedritos', 'demo-lb26-jugador-cedritos-10'),
  ('demo-lb26-equipo-cedritos', 'demo-lb26-jugador-cedritos-11'),
  ('demo-lb26-equipo-andina', 'demo-lb26-jugador-andina-01'),
  ('demo-lb26-equipo-andina', 'demo-lb26-jugador-andina-02'),
  ('demo-lb26-equipo-andina', 'demo-lb26-jugador-andina-03'),
  ('demo-lb26-equipo-andina', 'demo-lb26-jugador-andina-04'),
  ('demo-lb26-equipo-andina', 'demo-lb26-jugador-andina-05'),
  ('demo-lb26-equipo-andina', 'demo-lb26-jugador-andina-06'),
  ('demo-lb26-equipo-andina', 'demo-lb26-jugador-andina-07'),
  ('demo-lb26-equipo-andina', 'demo-lb26-jugador-andina-08'),
  ('demo-lb26-equipo-andina', 'demo-lb26-jugador-andina-09'),
  ('demo-lb26-equipo-andina', 'demo-lb26-jugador-andina-10'),
  ('demo-lb26-equipo-andina', 'demo-lb26-jugador-andina-11');

INSERT OR IGNORE INTO torneos (id, nombre, descripcion, modalidad, formato, fecha_inicio, cupo, estado) VALUES
  ('demo-lb26-torneo', 'Copa Liga Bosque 2026', 'Campeonato de demostración: 4 equipos, todos contra todos, sedes Campus El Bosque y Norte.', 'FUTBOL_11', 'LIGA', '2026-10-17', 8, 'EN_CURSO');

INSERT OR IGNORE INTO inscripciones (id, torneo_id, equipo_id, estado, solicitada_por) VALUES
  ('demo-lb26-inscripcion-bosque', 'demo-lb26-torneo', 'demo-lb26-equipo-bosque', 'APROBADO', 'demo-lb26-jugador-bosque-01'),
  ('demo-lb26-inscripcion-fenix', 'demo-lb26-torneo', 'demo-lb26-equipo-fenix', 'APROBADO', 'demo-lb26-jugador-fenix-01'),
  ('demo-lb26-inscripcion-cedritos', 'demo-lb26-torneo', 'demo-lb26-equipo-cedritos', 'APROBADO', 'demo-lb26-jugador-cedritos-01'),
  ('demo-lb26-inscripcion-andina', 'demo-lb26-torneo', 'demo-lb26-equipo-andina', 'APROBADO', 'demo-lb26-jugador-andina-01');

INSERT OR IGNORE INTO sedes (id, nombre, direccion, ciudad, indicaciones) VALUES
  ('demo-lb26-sede-bosque', 'Campus Universidad El Bosque', 'Av. Cra 9 # 131A-02', 'Bogotá', 'Ingreso por la portería norte; canchas detrás del bloque deportivo.'),
  ('demo-lb26-sede-norte', 'Sede Deportiva Norte', 'Calle 170 # 54-30', 'Bogotá', 'Parqueadero gratuito para jugadores inscritos.');

INSERT OR IGNORE INTO canchas (id, sede_id, nombre, superficie, activa) VALUES
  ('demo-lb26-cancha-bosque-1', 'demo-lb26-sede-bosque', 'Cancha 1', 'Sintética', 1),
  ('demo-lb26-cancha-bosque-2', 'demo-lb26-sede-bosque', 'Cancha 2', 'Natural', 1),
  ('demo-lb26-cancha-norte-1', 'demo-lb26-sede-norte', 'Cancha Principal', 'Sintética', 1);

INSERT OR IGNORE INTO fechas (id, torneo_id, numero, equipo_descansa_id, creado_en) VALUES
  ('demo-lb26-fecha-1', 'demo-lb26-torneo', 1, NULL, '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-fecha-2', 'demo-lb26-torneo', 2, NULL, '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-fecha-3', 'demo-lb26-torneo', 3, NULL, '2026-10-12T12:00:00.000Z');

INSERT OR IGNORE INTO partidos
  (id, fecha_id, torneo_id, local_id, visitante_id, estado, fecha_hora, cancha, cancha_id, creado_en, actualizado_en)
VALUES
  ('demo-lb26-partido-1-1', 'demo-lb26-fecha-1', 'demo-lb26-torneo', 'demo-lb26-equipo-bosque', 'demo-lb26-equipo-fenix', 'PROGRAMADO', '2026-10-17T13:00:00.000Z', 'Campus Universidad El Bosque - Cancha 1', 'demo-lb26-cancha-bosque-1', '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-partido-1-2', 'demo-lb26-fecha-1', 'demo-lb26-torneo', 'demo-lb26-equipo-cedritos', 'demo-lb26-equipo-andina', 'PROGRAMADO', '2026-10-17T15:30:00.000Z', 'Campus Universidad El Bosque - Cancha 2', 'demo-lb26-cancha-bosque-2', '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-partido-2-1', 'demo-lb26-fecha-2', 'demo-lb26-torneo', 'demo-lb26-equipo-bosque', 'demo-lb26-equipo-cedritos', 'PROGRAMADO', '2026-10-24T13:00:00.000Z', 'Sede Deportiva Norte - Cancha Principal', 'demo-lb26-cancha-norte-1', '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-partido-2-2', 'demo-lb26-fecha-2', 'demo-lb26-torneo', 'demo-lb26-equipo-andina', 'demo-lb26-equipo-fenix', 'PROGRAMADO', '2026-10-24T15:30:00.000Z', 'Campus Universidad El Bosque - Cancha 1', 'demo-lb26-cancha-bosque-1', '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-partido-3-1', 'demo-lb26-fecha-3', 'demo-lb26-torneo', 'demo-lb26-equipo-andina', 'demo-lb26-equipo-bosque', 'PROGRAMADO', '2026-10-31T13:00:00.000Z', 'Campus Universidad El Bosque - Cancha 2', 'demo-lb26-cancha-bosque-2', '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z'),
  ('demo-lb26-partido-3-2', 'demo-lb26-fecha-3', 'demo-lb26-torneo', 'demo-lb26-equipo-fenix', 'demo-lb26-equipo-cedritos', 'PROGRAMADO', '2026-10-31T15:30:00.000Z', 'Sede Deportiva Norte - Cancha Principal', 'demo-lb26-cancha-norte-1', '2026-10-12T12:00:00.000Z', '2026-10-12T12:00:00.000Z');
