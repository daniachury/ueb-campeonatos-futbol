import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '../../core/env';
import { errores } from '../../core/errors';
import { siFallaLaValidacion } from '../../core/validacion';

const crearEquipoSchema = z.object({ nombre: z.string().trim().min(3).max(60), color: z.string().trim().min(3).max(30) });
const editarEquipoSchema = crearEquipoSchema;

/**
 * Épicas E4 (equipos) y E5 (plantillas). Montadas en /api/equipos (exigen sesión).
 * Pendientes:
 * - UEB-Proyect-11 (KAN-24) · Crear equipo (el creador queda como capitán)
 * - UEB-Proyect-14 (KAN-27) · Unirme a un equipo
 * - UEB-Proyect-15 (KAN-28) · Regla: un jugador no puede estar en dos equipos del mismo torneo
 *   → función pura en equipos/domain/, reutilizada también por el módulo de inscripciones
 * - UEB-Proyect-16 (KAN-29) · Salir de un equipo con traspaso de capitanía
 */
export const equiposRoutes = new Hono<AppEnv>()
  .get('/disponibles', async (c) => {
    const usuario = c.get('usuario');
    if (!usuario) throw errores.noAutenticado();
    const { results } = await c.env.DB.prepare('SELECT e.id, e.nombre, e.color, COUNT(i.usuario_id) AS cantidadIntegrantes FROM equipos e LEFT JOIN equipo_integrantes i ON i.equipo_id = e.id WHERE e.id NOT IN (SELECT equipo_id FROM equipo_integrantes WHERE usuario_id = ?) GROUP BY e.id, e.nombre, e.color ORDER BY e.nombre').bind(usuario.id).all();
    return c.json({ datos: results });
  })
  .get('/', async (c) => {
    const usuario = c.get('usuario');
    if (!usuario) throw errores.noAutenticado();
    const { results } = await c.env.DB.prepare(`SELECT e.id, e.nombre, e.color, e.capitan_id AS capitanId FROM equipos e JOIN equipo_integrantes i ON i.equipo_id = e.id WHERE i.usuario_id = ? ORDER BY e.nombre`).bind(usuario.id).all();
    return c.json({ datos: results });
  })
  .get('/:id/integrantes', async (c) => {
    const { results } = await c.env.DB.prepare('SELECT u.id, u.nombre_completo AS nombreCompleto, u.correo FROM equipo_integrantes i JOIN usuarios u ON u.id = i.usuario_id WHERE i.equipo_id = ? ORDER BY i.creado_en').bind(c.req.param('id')).all();
    return c.json({ datos: results });
  })
  .post('/', zValidator('json', crearEquipoSchema, siFallaLaValidacion), async (c) => {
  const usuario = c.get('usuario');
  if (!usuario) throw errores.noAutenticado();
  if (usuario.rol !== 'jugador') throw errores.sinPermiso();
  const datos = c.req.valid('json');
  const id = crypto.randomUUID();
  try {
    await c.env.DB.batch([
      c.env.DB.prepare('INSERT INTO equipos (id, nombre, color, capitan_id) VALUES (?, ?, ?, ?)').bind(id, datos.nombre, datos.color, usuario.id),
      c.env.DB.prepare('INSERT INTO equipo_integrantes (equipo_id, usuario_id) VALUES (?, ?)').bind(id, usuario.id),
    ]);
  } catch (error) {
    if (error instanceof Error && /unique/i.test(error.message)) throw errores.conflicto('NOMBRE_EQUIPO_DUPLICADO', 'Ya existe un equipo con ese nombre');
    throw error;
  }
  return c.json({ datos: { id, nombre: datos.nombre, color: datos.color, capitanId: usuario.id } }, 201);
  })
  .post('/:id/integrantes', async (c) => {
    const usuario = c.get('usuario');
    if (!usuario) throw errores.noAutenticado();
    if (usuario.rol !== 'jugador') throw errores.sinPermiso();
    try {
      await c.env.DB.prepare('INSERT INTO equipo_integrantes (equipo_id, usuario_id) VALUES (?, ?)').bind(c.req.param('id'), usuario.id).run();
    } catch (error) {
      if (error instanceof Error && /unique/i.test(error.message)) throw errores.conflicto('YA_ES_INTEGRANTE', 'Ya haces parte de este equipo');
      if (error instanceof Error && /foreign key/i.test(error.message)) throw errores.noEncontrado('Equipo');
      throw error;
    }
    return c.json({ datos: { equipoId: c.req.param('id'), usuarioId: usuario.id } }, 201);
  })
  .delete('/:id/integrantes', async (c) => {
    const usuario = c.get('usuario');
    if (!usuario) throw errores.noAutenticado();
    const equipo = await c.env.DB.prepare('SELECT id, capitan_id AS capitanId FROM equipos WHERE id = ?').bind(c.req.param('id')).first<{ id: string; capitanId: string }>();
    if (!equipo) throw errores.noEncontrado('Equipo');
    const integrantes = await c.env.DB.prepare('SELECT usuario_id AS usuarioId FROM equipo_integrantes WHERE equipo_id = ? ORDER BY creado_en, usuario_id').bind(equipo.id).all<{ usuarioId: string }>();
    if (!integrantes.results.some((integrante) => integrante.usuarioId === usuario.id)) throw errores.sinPermiso();
    const siguienteCapitan = integrantes.results.find((integrante) => integrante.usuarioId !== usuario.id);
    if (!siguienteCapitan) {
      await c.env.DB.prepare('DELETE FROM equipos WHERE id = ?').bind(equipo.id).run();
    } else {
      await c.env.DB.batch([
        c.env.DB.prepare('UPDATE equipos SET capitan_id = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?').bind(equipo.capitanId === usuario.id ? siguienteCapitan.usuarioId : equipo.capitanId, equipo.id),
        c.env.DB.prepare('DELETE FROM equipo_integrantes WHERE equipo_id = ? AND usuario_id = ?').bind(equipo.id, usuario.id),
      ]);
    }
    return c.body(null, 204);
  })
  .put('/:id', zValidator('json', editarEquipoSchema, siFallaLaValidacion), async (c) => {
    const usuario = c.get('usuario');
    if (!usuario) throw errores.noAutenticado();
    if (usuario.rol !== 'jugador') throw errores.sinPermiso();
    const datos = c.req.valid('json');
    const equipo = await c.env.DB.prepare('SELECT id FROM equipos WHERE id = ? AND capitan_id = ?').bind(c.req.param('id'), usuario.id).first();
    if (!equipo) throw errores.noEncontrado('Equipo');
    try {
      await c.env.DB.prepare('UPDATE equipos SET nombre = ?, color = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?').bind(datos.nombre, datos.color, c.req.param('id')).run();
    } catch (error) {
      if (error instanceof Error && /unique/i.test(error.message)) throw errores.conflicto('NOMBRE_EQUIPO_DUPLICADO', 'Ya existe un equipo con ese nombre');
      throw error;
    }
    return c.json({ datos: { id: c.req.param('id'), ...datos } });
  });

/**
 * Montadas en /api/admin/equipos (exigen rol admin).
 * Pendientes:
 * - UEB-Proyect-12 (KAN-25) · Editar equipos
 * - UEB-Proyect-13 (KAN-26) · Eliminar equipos
 * - UEB-Proyect-17 (KAN-30) · Retirar jugadores de un equipo
 */
export const equiposAdminRoutes = new Hono<AppEnv>()
  .get('/', async (c) => {
    const { results } = await c.env.DB.prepare(`SELECT e.id, e.nombre, e.color, u.nombre_completo AS capitanNombre, COUNT(i.usuario_id) AS cantidadIntegrantes FROM equipos e JOIN usuarios u ON u.id = e.capitan_id LEFT JOIN equipo_integrantes i ON i.equipo_id = e.id GROUP BY e.id, e.nombre, e.color, u.nombre_completo ORDER BY e.nombre`).all();
    return c.json({ datos: results });
  })
  .get('/:id/integrantes', async (c) => {
    const { results } = await c.env.DB.prepare('SELECT u.id, u.nombre_completo AS nombreCompleto, u.correo FROM equipo_integrantes i JOIN usuarios u ON u.id = i.usuario_id WHERE i.equipo_id = ? ORDER BY i.creado_en').bind(c.req.param('id')).all();
    return c.json({ datos: results });
  })
  .delete('/:id', async (c) => {
    const resultado = await c.env.DB.prepare('DELETE FROM equipos WHERE id = ?').bind(c.req.param('id')).run();
    if (!resultado.success || resultado.meta.changes === 0) throw errores.noEncontrado('Equipo');
    return c.body(null, 204);
  })
  .delete('/:id/integrantes/:usuarioId', async (c) => {
    const integrante = await c.env.DB.prepare('SELECT equipo_id AS equipoId FROM equipo_integrantes WHERE equipo_id = ? AND usuario_id = ?').bind(c.req.param('id'), c.req.param('usuarioId')).first();
    if (!integrante) throw errores.noEncontrado('Integrante');
    const equipo = await c.env.DB.prepare('SELECT capitan_id AS capitanId FROM equipos WHERE id = ?').bind(c.req.param('id')).first<{ capitanId: string }>();
    if (equipo?.capitanId === c.req.param('usuarioId')) throw errores.conflicto('CAPITAN_NO_SE_PUEDE_RETIRAR', 'El capitán debe salir o transferir la capitanía');
    await c.env.DB.prepare('DELETE FROM equipo_integrantes WHERE equipo_id = ? AND usuario_id = ?').bind(c.req.param('id'), c.req.param('usuarioId')).run();
    return c.body(null, 204);
  });
