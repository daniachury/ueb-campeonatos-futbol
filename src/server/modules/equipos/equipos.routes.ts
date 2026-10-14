import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '../../core/env';
import { errores } from '../../core/errors';
import { siFallaLaValidacion } from '../../core/validacion';

const jugadorInicialSchema = z.object({
  nombreCompleto: z.string().trim().min(3).max(80),
  correo: z.string().trim().email(),
  telefono: z.string().trim().optional(),
});

const crearEquipoSchema = z.object({
  nombre: z.string().trim().min(3).max(60),
  color: z.string().trim().min(3).max(30),
  jugadores: z.array(jugadorInicialSchema).optional(),
});

const editarEquipoSchema = z.object({
  nombre: z.string().trim().min(3).max(60),
  color: z.string().trim().min(3).max(30),
});

const agregarJugadorSchema = z.object({
  nombreCompleto: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres').max(80),
  correo: z.string().trim().email('Ingresa un correo electrónico válido'),
  telefono: z.string().trim().optional(),
});

async function obtenerOCrearJugador(
  db: AppEnv['Bindings']['DB'],
  datos: { nombreCompleto: string; correo: string; telefono?: string },
): Promise<{ id: string; nombreCompleto: string; correo: string }> {
  const correoLimpio = datos.correo.trim().toLowerCase();
  const existente = await db
    .prepare('SELECT id, nombre_completo AS nombreCompleto, correo FROM usuarios WHERE LOWER(correo) = ?')
    .bind(correoLimpio)
    .first<{ id: string; nombreCompleto: string; correo: string }>();

  if (existente) {
    return existente;
  }

  const nuevoId = crypto.randomUUID();
  const telefono = datos.telefono?.trim() || '3000000000';
  await db
    .prepare(
      `INSERT INTO usuarios (id, nombre_completo, correo, telefono, hash_contrasena, rol, activo, debe_cambiar_contrasena, creado_en, actualizado_en)
       VALUES (?, ?, ?, ?, 'balon2026', 'jugador', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    )
    .bind(nuevoId, datos.nombreCompleto.trim(), correoLimpio, telefono)
    .run();

  return { id: nuevoId, nombreCompleto: datos.nombreCompleto.trim(), correo: correoLimpio };
}

async function verificarEsCapitanOAdmin(
  db: AppEnv['Bindings']['DB'],
  equipoId: string,
  usuario: { id: string; rol: string },
): Promise<{ id: string; capitanId: string | null; nombre: string }> {
  const equipo = await db
    .prepare('SELECT id, capitan_id AS capitanId, nombre FROM equipos WHERE id = ?')
    .bind(equipoId)
    .first<{ id: string; capitanId: string | null; nombre: string }>();

  if (!equipo) throw errores.noEncontrado('Equipo');
  if (usuario.rol !== 'admin' && equipo.capitanId !== usuario.id) {
    throw errores.sinPermiso();
  }
  return equipo;
}

/**
 * Épicas E4 (equipos) y E5 (plantillas). Montadas en /api/equipos (exigen sesión).
 */
export const equiposRoutes = new Hono<AppEnv>()
  .get('/disponibles', async (c) => {
    const usuario = c.get('usuario');
    if (!usuario) throw errores.noAutenticado();
    const { results } = await c.env.DB.prepare('SELECT e.id, e.nombre, e.color, COUNT(i.usuario_id) AS cantidadIntegrantes FROM equipos e LEFT JOIN equipo_jugadores i ON i.equipo_id = e.id WHERE e.id NOT IN (SELECT equipo_id FROM equipo_jugadores WHERE usuario_id = ?) GROUP BY e.id, e.nombre, e.color ORDER BY e.nombre').bind(usuario.id).all();
    return c.json({ datos: results });
  })
  .get('/', async (c) => {
    const usuario = c.get('usuario');
    if (!usuario) throw errores.noAutenticado();
    const { results } = await c.env.DB.prepare(`SELECT e.id, e.nombre, e.color, e.capitan_id AS capitanId FROM equipos e JOIN equipo_jugadores i ON i.equipo_id = e.id WHERE i.usuario_id = ? ORDER BY e.nombre`).bind(usuario.id).all();
    return c.json({ datos: results });
  })
  .get('/:id/integrantes', async (c) => {
    const { results } = await c.env.DB.prepare('SELECT u.id, u.nombre_completo AS nombreCompleto, u.correo FROM equipo_jugadores i JOIN usuarios u ON u.id = i.usuario_id WHERE i.equipo_id = ? ORDER BY i.fecha_ingreso').bind(c.req.param('id')).all();
    return c.json({ datos: results });
  })
  .get('/:id/solicitudes', async (c) => {
    const usuario = c.get('usuario');
    if (!usuario) throw errores.noAutenticado();
    await verificarEsCapitanOAdmin(c.env.DB, c.req.param('id'), usuario);

    const { results } = await c.env.DB.prepare(
      `SELECT s.id, s.equipo_id AS equipoId, s.usuario_id AS usuarioId,
              u.nombre_completo AS nombreCompleto, u.correo, s.estado, s.creada_en AS creadaEn
       FROM solicitudes_equipo s
       JOIN usuarios u ON u.id = s.usuario_id
       WHERE s.equipo_id = ? AND s.estado = 'PENDIENTE'
       ORDER BY s.creada_en ASC`,
    ).bind(c.req.param('id')).all();

    return c.json({ datos: results });
  })
  .post('/:id/solicitudes', async (c) => {
    const usuario = c.get('usuario');
    if (!usuario) throw errores.noAutenticado();
    if (usuario.rol !== 'jugador') throw errores.sinPermiso();

    const equipo = await c.env.DB.prepare('SELECT id, nombre FROM equipos WHERE id = ?').bind(c.req.param('id')).first<{ id: string; nombre: string }>();
    if (!equipo) throw errores.noEncontrado('Equipo');

    const yaEsIntegrante = await c.env.DB.prepare('SELECT 1 FROM equipo_jugadores WHERE equipo_id = ? AND usuario_id = ?').bind(equipo.id, usuario.id).first();
    if (yaEsIntegrante) {
      throw errores.conflicto('YA_ES_INTEGRANTE', 'Ya haces parte de este equipo');
    }

    const solicitudPendiente = await c.env.DB.prepare("SELECT id FROM solicitudes_equipo WHERE equipo_id = ? AND usuario_id = ? AND estado = 'PENDIENTE'").bind(equipo.id, usuario.id).first();
    if (solicitudPendiente) {
      throw errores.conflicto('SOLICITUD_PENDIENTE', 'Ya tienes una solicitud pendiente para unirte a este equipo');
    }

    const id = crypto.randomUUID();
    await c.env.DB.prepare("INSERT INTO solicitudes_equipo (id, equipo_id, usuario_id, estado) VALUES (?, ?, ?, 'PENDIENTE')").bind(id, equipo.id, usuario.id).run();

    return c.json({ datos: { id, equipoId: equipo.id, usuarioId: usuario.id, estado: 'PENDIENTE' } }, 201);
  })
  .post('/:id/solicitudes/:solicitudId/aprobar', async (c) => {
    const usuario = c.get('usuario');
    if (!usuario) throw errores.noAutenticado();
    await verificarEsCapitanOAdmin(c.env.DB, c.req.param('id'), usuario);

    const solicitud = await c.env.DB.prepare('SELECT id, usuario_id AS usuarioId, estado FROM solicitudes_equipo WHERE id = ? AND equipo_id = ?').bind(c.req.param('solicitudId'), c.req.param('id')).first<{ id: string; usuarioId: string; estado: string }>();
    if (!solicitud) throw errores.noEncontrado('Solicitud');
    if (solicitud.estado !== 'PENDIENTE') {
      throw errores.conflicto('SOLICITUD_NO_PENDIENTE', 'La solicitud ya fue procesada anteriormente');
    }

    await c.env.DB.batch([
      c.env.DB.prepare("UPDATE solicitudes_equipo SET estado = 'APROBADO', actualizada_en = CURRENT_TIMESTAMP WHERE id = ?").bind(solicitud.id),
      c.env.DB.prepare('INSERT OR IGNORE INTO equipo_jugadores (equipo_id, usuario_id) VALUES (?, ?)').bind(c.req.param('id'), solicitud.usuarioId),
    ]);

    return c.json({ datos: { ok: true, mensaje: 'Solicitud aprobada y jugador incorporado al equipo' } });
  })
  .post('/:id/solicitudes/:solicitudId/rechazar', async (c) => {
    const usuario = c.get('usuario');
    if (!usuario) throw errores.noAutenticado();
    await verificarEsCapitanOAdmin(c.env.DB, c.req.param('id'), usuario);

    const solicitud = await c.env.DB.prepare('SELECT id, estado FROM solicitudes_equipo WHERE id = ? AND equipo_id = ?').bind(c.req.param('solicitudId'), c.req.param('id')).first<{ id: string; estado: string }>();
    if (!solicitud) throw errores.noEncontrado('Solicitud');
    if (solicitud.estado !== 'PENDIENTE') {
      throw errores.conflicto('SOLICITUD_NO_PENDIENTE', 'La solicitud ya fue procesada anteriormente');
    }

    await c.env.DB.prepare("UPDATE solicitudes_equipo SET estado = 'RECHAZADO', actualizada_en = CURRENT_TIMESTAMP WHERE id = ?").bind(solicitud.id).run();

    return c.json({ datos: { ok: true, mensaje: 'Solicitud rechazada' } });
  })
  .post('/:id/jugadores', zValidator('json', agregarJugadorSchema, siFallaLaValidacion), async (c) => {
    const usuario = c.get('usuario');
    if (!usuario) throw errores.noAutenticado();
    await verificarEsCapitanOAdmin(c.env.DB, c.req.param('id'), usuario);

    const datos = c.req.valid('json');
    const jugador = await obtenerOCrearJugador(c.env.DB, datos);

    const yaEsMiembro = await c.env.DB.prepare('SELECT 1 FROM equipo_jugadores WHERE equipo_id = ? AND usuario_id = ?').bind(c.req.param('id'), jugador.id).first();
    if (yaEsMiembro) {
      throw errores.conflicto('YA_ES_INTEGRANTE', 'Este jugador ya hace parte del equipo');
    }

    await c.env.DB.batch([
      c.env.DB.prepare('INSERT INTO equipo_jugadores (equipo_id, usuario_id) VALUES (?, ?)').bind(c.req.param('id'), jugador.id),
      c.env.DB.prepare("UPDATE solicitudes_equipo SET estado = 'APROBADO', actualizada_en = CURRENT_TIMESTAMP WHERE equipo_id = ? AND usuario_id = ? AND estado = 'PENDIENTE'").bind(c.req.param('id'), jugador.id),
    ]);

    return c.json({ datos: jugador }, 201);
  })
  .delete('/:id/jugadores/:usuarioId', async (c) => {
    const usuario = c.get('usuario');
    if (!usuario) throw errores.noAutenticado();
    const equipo = await verificarEsCapitanOAdmin(c.env.DB, c.req.param('id'), usuario);

    if (c.req.param('usuarioId') === equipo.capitanId) {
      throw errores.conflicto('CAPITAN_NO_SE_PUEDE_RETIRAR', 'El capitán no puede ser retirado de la plantilla');
    }

    const integrante = await c.env.DB.prepare('SELECT 1 FROM equipo_jugadores WHERE equipo_id = ? AND usuario_id = ?').bind(c.req.param('id'), c.req.param('usuarioId')).first();
    if (!integrante) throw errores.noEncontrado('Integrante');

    await c.env.DB.prepare('DELETE FROM equipo_jugadores WHERE equipo_id = ? AND usuario_id = ?').bind(c.req.param('id'), c.req.param('usuarioId')).run();

    return c.body(null, 204);
  })
  .post('/', zValidator('json', crearEquipoSchema, siFallaLaValidacion), async (c) => {
    const usuario = c.get('usuario');
    if (!usuario) throw errores.noAutenticado();
    if (usuario.rol !== 'jugador') throw errores.sinPermiso();
    const datos = c.req.valid('json');
    const id = crypto.randomUUID();
    try {
      const queries = [
        c.env.DB.prepare('INSERT INTO equipos (id, nombre, color, capitan_id) VALUES (?, ?, ?, ?)').bind(id, datos.nombre, datos.color, usuario.id),
        c.env.DB.prepare('INSERT INTO equipo_jugadores (equipo_id, usuario_id) VALUES (?, ?)').bind(id, usuario.id),
      ];

      if (datos.jugadores && datos.jugadores.length > 0) {
        for (const j of datos.jugadores) {
          const jg = await obtenerOCrearJugador(c.env.DB, j);
          queries.push(
            c.env.DB.prepare('INSERT OR IGNORE INTO equipo_jugadores (equipo_id, usuario_id) VALUES (?, ?)').bind(id, jg.id),
          );
        }
      }

      await c.env.DB.batch(queries);
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
    const equipo = await c.env.DB.prepare('SELECT id, capitan_id AS capitanId FROM equipos WHERE id = ?').bind(c.req.param('id')).first<{ id: string; capitanId: string | null }>();
    if (!equipo) throw errores.noEncontrado('Equipo');

    try {
      if (!equipo.capitanId) {
        await c.env.DB.batch([
          c.env.DB.prepare('INSERT INTO equipo_jugadores (equipo_id, usuario_id) VALUES (?, ?)').bind(c.req.param('id'), usuario.id),
          c.env.DB.prepare('UPDATE equipos SET capitan_id = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?').bind(usuario.id, c.req.param('id')),
        ]);
      } else {
        await c.env.DB.prepare('INSERT INTO equipo_jugadores (equipo_id, usuario_id) VALUES (?, ?)').bind(c.req.param('id'), usuario.id).run();
      }
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
    const integrantes = await c.env.DB.prepare('SELECT usuario_id AS usuarioId FROM equipo_jugadores WHERE equipo_id = ? ORDER BY fecha_ingreso, usuario_id').bind(equipo.id).all<{ usuarioId: string }>();
    if (!integrantes.results.some((integrante) => integrante.usuarioId === usuario.id)) throw errores.sinPermiso();
    const siguienteCapitan = integrantes.results.find((integrante) => integrante.usuarioId !== usuario.id);
    if (!siguienteCapitan) {
      await c.env.DB.prepare('DELETE FROM equipos WHERE id = ?').bind(equipo.id).run();
    } else {
      await c.env.DB.batch([
        c.env.DB.prepare('UPDATE equipos SET capitan_id = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?').bind(equipo.capitanId === usuario.id ? siguienteCapitan.usuarioId : equipo.capitanId, equipo.id),
        c.env.DB.prepare('DELETE FROM equipo_jugadores WHERE equipo_id = ? AND usuario_id = ?').bind(equipo.id, usuario.id),
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
    const { results } = await c.env.DB.prepare(`SELECT e.id, e.nombre, e.color, u.nombre_completo AS capitanNombre, COUNT(i.usuario_id) AS cantidadIntegrantes FROM equipos e JOIN usuarios u ON u.id = e.capitan_id LEFT JOIN equipo_jugadores i ON i.equipo_id = e.id GROUP BY e.id, e.nombre, e.color, u.nombre_completo ORDER BY e.nombre`).all();
    return c.json({ datos: results });
  })
  .get('/:id/integrantes', async (c) => {
    const { results } = await c.env.DB.prepare('SELECT u.id, u.nombre_completo AS nombreCompleto, u.correo FROM equipo_jugadores i JOIN usuarios u ON u.id = i.usuario_id WHERE i.equipo_id = ? ORDER BY i.fecha_ingreso').bind(c.req.param('id')).all();
    return c.json({ datos: results });
  })
  .post('/', zValidator('json', z.object({
    nombre: z.string().trim().min(3).max(60),
    color: z.string().trim().min(3).max(30),
    capitanId: z.string().optional().nullable(),
  }), siFallaLaValidacion), async (c) => {
    const datos = c.req.valid('json');
    const id = crypto.randomUUID();
    const capitanId = datos.capitanId ? datos.capitanId.trim() : null;

    if (capitanId) {
      const usuario = await c.env.DB.prepare('SELECT id, rol FROM usuarios WHERE id = ?').bind(capitanId).first<{ id: string; rol: string }>();
      if (!usuario || usuario.rol !== 'jugador') {
        throw errores.validacion([{ campo: 'capitanId', mensaje: 'Selecciona un jugador válido' }]);
      }
    }

    try {
      const queries = [
        c.env.DB.prepare('INSERT INTO equipos (id, nombre, color, capitan_id) VALUES (?, ?, ?, ?)').bind(id, datos.nombre, datos.color, capitanId),
      ];
      if (capitanId) {
        queries.push(
          c.env.DB.prepare('INSERT INTO equipo_jugadores (equipo_id, usuario_id) VALUES (?, ?)').bind(id, capitanId),
        );
      }
      await c.env.DB.batch(queries);
    } catch (error) {
      if (error instanceof Error && /unique/i.test(error.message)) {
        throw errores.conflicto('NOMBRE_EQUIPO_DUPLICADO', 'Ya existe un equipo con ese nombre');
      }
      throw error;
    }

    return c.json({ datos: { id, nombre: datos.nombre, color: datos.color, capitanId } }, 201);
  })
  .put('/:id', zValidator('json', z.object({
    nombre: z.string().trim().min(3).max(60).optional(),
    color: z.string().trim().min(3).max(30).optional(),
    capitanId: z.string().optional().nullable(),
  }), siFallaLaValidacion), async (c) => {
    const datos = c.req.valid('json');
    const equipo = await c.env.DB.prepare('SELECT id FROM equipos WHERE id = ?').bind(c.req.param('id')).first();
    if (!equipo) throw errores.noEncontrado('Equipo');

    const asignaciones: string[] = [];
    const valores: (string | null)[] = [];
    if (datos.nombre) {
      asignaciones.push('nombre = ?');
      valores.push(datos.nombre);
    }
    if (datos.color) {
      asignaciones.push('color = ?');
      valores.push(datos.color);
    }
    if (datos.capitanId !== undefined) {
      asignaciones.push('capitan_id = ?');
      valores.push(datos.capitanId);
    }

    if (asignaciones.length > 0) {
      asignaciones.push('actualizado_en = CURRENT_TIMESTAMP');
      valores.push(c.req.param('id'));
      try {
        await c.env.DB.prepare(`UPDATE equipos SET ${asignaciones.join(', ')} WHERE id = ?`).bind(...valores).run();
      } catch (error) {
        if (error instanceof Error && /unique/i.test(error.message)) {
          throw errores.conflicto('NOMBRE_EQUIPO_DUPLICADO', 'Ya existe un equipo con ese nombre');
        }
        throw error;
      }
    }
    return c.json({ datos: { id: c.req.param('id'), ...datos } });
  })
  .delete('/:id', async (c) => {
    const resultado = await c.env.DB.prepare('DELETE FROM equipos WHERE id = ?').bind(c.req.param('id')).run();
    if (!resultado.success || resultado.meta.changes === 0) throw errores.noEncontrado('Equipo');
    return c.body(null, 204);
  })
  .delete('/:id/integrantes/:usuarioId', async (c) => {
    const integrante = await c.env.DB.prepare('SELECT equipo_id AS equipoId FROM equipo_jugadores WHERE equipo_id = ? AND usuario_id = ?').bind(c.req.param('id'), c.req.param('usuarioId')).first();
    if (!integrante) throw errores.noEncontrado('Integrante');
    const equipo = await c.env.DB.prepare('SELECT capitan_id AS capitanId FROM equipos WHERE id = ?').bind(c.req.param('id')).first<{ capitanId: string }>();
    if (equipo?.capitanId === c.req.param('usuarioId')) throw errores.conflicto('CAPITAN_NO_SE_PUEDE_RETIRAR', 'El capitán debe salir o transferir la capitanía');
    await c.env.DB.prepare('DELETE FROM equipo_jugadores WHERE equipo_id = ? AND usuario_id = ?').bind(c.req.param('id'), c.req.param('usuarioId')).run();
    return c.body(null, 204);
  });
