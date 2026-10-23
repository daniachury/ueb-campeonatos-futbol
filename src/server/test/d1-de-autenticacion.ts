import { crearD1Falsa } from './d1-falsa';

export interface UsuarioGuardado {
  id: string;
  nombre_completo: string;
  correo: string;
  telefono: string;
  hash_contrasena: string;
  rol: 'jugador' | 'admin';
  activo: number;
  debe_cambiar_contrasena: number;
  creado_en: string;
  actualizado_en: string;
}

export interface AuditoriaGuardada {
  id: string;
  admin_creador_id: string;
  usuario_id: string;
  accion: 'CREAR_ADMIN' | 'PROMOVER_JUGADOR';
  creado_en: string;
}

interface SesionGuardada {
  usuario_id: string;
  hash_token: string;
  expira_en: string;
}

interface IntentosGuardados {
  fallos_seguidos: number;
  bloqueado_hasta: string | null;
}

interface TokenRecuperacionGuardado {
  id: string;
  usuario_id: string;
  token_hash: string;
  expira_en: string;
  usado: number;
  creado_en: string;
}

/**
 * D1 falsa con memoria para las pruebas de integración de autenticación (KAN-16, KAN-17 y KAN-18).
 * Entiende las consultas de los repositorios de usuarios, intentos, sesiones, auditoría y equipos.
 */
export function crearD1DeAutenticacion(usuariosIniciales: UsuarioGuardado[] = []) {
  const usuarios = [...usuariosIniciales];
  const sesiones: SesionGuardada[] = [];
  const intentos = new Map<string, IntentosGuardados>();
  const auditoria: AuditoriaGuardada[] = [];
  const equiposEnTorneo = new Set<string>(); // usuario_ids con torneo EN_CURSO
  const tokensRecuperacion: TokenRecuperacionGuardado[] = [];

  const buscarUsuarioPorCorreo = (correo: unknown) =>
    usuarios.find((usuario) => usuario.correo === String(correo).toLowerCase());

  const buscarUsuarioPorId = (id: unknown) => usuarios.find((usuario) => usuario.id === String(id));

  const { db, consultas } = crearD1Falsa((sql, parametros) => {
    const [primero, segundo, tercero, cuarto] = parametros;

    if (sql.includes('COUNT(*) AS total FROM usuarios WHERE rol')) {
      const total = usuarios.filter((u) => u.rol === 'admin').length;
      return [{ total }];
    }

    if (sql.includes('FROM usuarios')) {
      if (sql.includes('WHERE id') || sql.includes('WHERE id=?')) {
        const usuario = buscarUsuarioPorId(primero);
        return usuario ? [usuario] : [];
      }
      const usuario = buscarUsuarioPorCorreo(primero);
      return usuario ? [usuario] : [];
    }

    if (sql.includes('INSERT INTO usuarios')) {
      if (parametros.length >= 10) {
        const [id, nombre, correo, telefono, hash, rol, activo, debeCambiar, creado, actualizado] =
          parametros;
        usuarios.push({
          id: String(id),
          nombre_completo: String(nombre),
          correo: String(correo),
          telefono: String(telefono),
          hash_contrasena: String(hash),
          rol: rol as UsuarioGuardado['rol'],
          activo: Number(activo),
          debe_cambiar_contrasena: Number(debeCambiar),
          creado_en: String(creado),
          actualizado_en: String(actualizado),
        });
      } else {
        const [id, nombre, correo, telefono, hash, rol, activo, creado, actualizado] = parametros;
        usuarios.push({
          id: String(id),
          nombre_completo: String(nombre),
          correo: String(correo),
          telefono: String(telefono),
          hash_contrasena: String(hash),
          rol: rol as UsuarioGuardado['rol'],
          activo: Number(activo),
          debe_cambiar_contrasena: 0,
          creado_en: String(creado),
          actualizado_en: String(actualizado),
        });
      }
      return [];
    }
    if (sql.includes('UPDATE usuarios') && sql.includes('hash_contrasena = ?')) {
      const usuario = usuarios.find((guardado) => guardado.id === tercero);
      if (usuario) {
        usuario.hash_contrasena = String(primero);
        usuario.actualizado_en = String(segundo);
        if (sql.includes('debe_cambiar_contrasena = 0')) {
          usuario.debe_cambiar_contrasena = 0;
        }
      }
      return [];
    }

    if (sql.includes('UPDATE usuarios SET rol =')) {
      const usuario = usuarios.find((guardado) => guardado.id === tercero);
      if (usuario) {
        usuario.rol = primero as UsuarioGuardado['rol'];
        usuario.actualizado_en = String(segundo);
      }
      return [];
    }

    if (sql.includes('UPDATE usuarios SET debe_cambiar_contrasena =')) {
      const usuario = usuarios.find((guardado) => guardado.id === tercero);
      if (usuario) {
        usuario.debe_cambiar_contrasena = Number(primero);
        usuario.actualizado_en = String(segundo);
      }
      return [];
    }

    if (sql.includes('INSERT INTO auditoria_admins')) {
      const [id, creadorId, usuarioId, accion, creadoEn] = parametros;
      auditoria.push({
        id: String(id),
        admin_creador_id: String(creadorId),
        usuario_id: String(usuarioId),
        accion: accion as AuditoriaGuardada['accion'],
        creado_en: String(creadoEn),
      });
      return [];
    }

    if (sql.includes('FROM equipo_jugadores ej') && sql.includes("t.estado = 'EN_CURSO'")) {
      const tieneTorneo = equiposEnTorneo.has(String(primero));
      return tieneTorneo ? [{ existe: 1 }] : [];
    }

    if (sql.includes('SELECT e.id FROM equipos e WHERE e.capitan_id')) {
      return [];
    }

    if (sql.includes('UPDATE equipos SET')) {
      return [];
    }

    if (sql.includes('DELETE FROM equipo_jugadores')) {
      return [];
    }

    if (sql.includes('UPDATE usuarios SET') && !sql.includes('hash_contrasena')) {
      const idUsuario = parametros[parametros.length - 1];
      const usuario = usuarios.find((guardado) => guardado.id === idUsuario);
      if (usuario) {
        const correoParam = parametros.find(
          (p): p is string => typeof p === 'string' && p.includes('@'),
        );
        if (
          correoParam &&
          usuarios.some(
            (u) => u.id !== idUsuario && u.correo.toLowerCase() === correoParam.toLowerCase(),
          )
        ) {
          throw new Error('UNIQUE constraint failed: usuarios.correo');
        }

        if (sql.includes('nombre_completo = ?')) {
          usuario.nombre_completo = String(parametros[0]);
        }
        if (sql.includes('telefono = ?')) {
          const tel = parametros.find((p) => typeof p === 'string' && /^\+?\d{7,15}$/.test(p));
          if (tel) usuario.telefono = String(tel);
        }
        if (correoParam) {
          usuario.correo = correoParam.toLowerCase();
        }
        usuario.actualizado_en = new Date().toISOString();
      }
      return [];
    }
    if (sql.includes('DELETE FROM intentos_inicio_sesion')) {
      intentos.delete(String(primero));
      return [];
    }

    if (sql.includes('FROM intentos_inicio_sesion')) {
      const guardados = intentos.get(String(primero));
      return guardados ? [guardados] : [];
    }

    if (sql.includes('INSERT INTO intentos_inicio_sesion')) {
      intentos.set(String(primero), {
        fallos_seguidos: Number(segundo),
        bloqueado_hasta: tercero === null ? null : String(tercero),
      });
      return [];
    }

    if (sql.includes('INSERT INTO sesiones')) {
      sesiones.push({
        usuario_id: String(segundo),
        hash_token: String(tercero),
        expira_en: String(cuarto),
      });
      return [];
    }
    if (sql.includes('DELETE FROM sesiones WHERE usuario_id = ? AND hash_token != ?')) {
      const [usuarioId, hashTokenActual] = parametros;
      for (let i = sesiones.length - 1; i >= 0; i--) {
        if (sesiones[i].usuario_id === usuarioId && sesiones[i].hash_token !== hashTokenActual) {
          sesiones.splice(i, 1);
        }
      }
      return [];
    }
    if (sql.includes('DELETE FROM sesiones WHERE usuario_id = ?')) {
      for (let i = sesiones.length - 1; i >= 0; i--) {
        if (sesiones[i].usuario_id === primero) {
          sesiones.splice(i, 1);
        }
      }
      return [];
    }
    if (sql.includes('DELETE FROM sesiones')) {
      const posicion = sesiones.findIndex((guardada) => guardada.hash_token === primero);
      if (posicion >= 0) sesiones.splice(posicion, 1);
      return [];
    }

    if (sql.includes('FROM sesiones')) {
      const sesion = sesiones.find((guardada) => guardada.hash_token === primero);
      const usuario = usuarios.find((guardado) => guardado.id === sesion?.usuario_id);
      if (!sesion || !usuario) return [];
      return [{ ...usuario, usuario_id: usuario.id, expira_en: sesion.expira_en }];
    }

    if (sql.includes('INSERT INTO tokens_recuperacion_contrasena')) {
      const [id, usuarioId, tokenHash, expiraEn, creadoEn] = parametros;
      tokensRecuperacion.push({
        id: String(id),
        usuario_id: String(usuarioId),
        token_hash: String(tokenHash),
        expira_en: String(expiraEn),
        usado: 0,
        creado_en: String(creadoEn),
      });
      return [];
    }

    if (sql.includes('FROM tokens_recuperacion_contrasena')) {
      const token = tokensRecuperacion.find((t) => t.token_hash === primero);
      if (!token) return [];
      const usuario = usuarios.find((u) => u.id === token.usuario_id);
      if (!usuario) return [];
      return [
        {
          ...token,
          u_id: usuario.id,
          u_correo: usuario.correo,
          u_activo: usuario.activo,
          u_rol: usuario.rol,
        },
      ];
    }

    if (sql.includes('UPDATE tokens_recuperacion_contrasena SET usado = 1 WHERE id = ?')) {
      const token = tokensRecuperacion.find((t) => t.id === primero);
      if (token) {
        token.usado = 1;
      }
      return [];
    }

    return [];
  });

  /** Simula que pasaron las 24 horas de todas las sesiones (Escenario 7). */
  function vencerSesiones(): void {
    for (const sesion of sesiones) sesion.expira_en = new Date(Date.now() - 1000).toISOString();
  }

  return {
    db,
    consultas,
    usuarios,
    sesiones,
    tokensRecuperacion,
    intentos,
    auditoria,
    equiposEnTorneo,
    vencerSesiones,
  };
}

export function crearUsuarioGuardado(cambios: Partial<UsuarioGuardado> = {}): UsuarioGuardado {
  return {
    id: 'usuario-laura',
    nombre_completo: 'Laura Gómez',
    correo: 'laura@mail.com',
    telefono: '3001234567',
    hash_contrasena: 'balon2026',
    rol: 'jugador',
    activo: 1,
    debe_cambiar_contrasena: 0,
    creado_en: '2026-10-01T12:00:00.000Z',
    actualizado_en: '2026-10-01T12:00:00.000Z',
    ...cambios,
  };
}
