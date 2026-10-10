import { crearD1Falsa } from './d1-falsa';

export interface UsuarioGuardado {
  id: string;
  nombre_completo: string;
  correo: string;
  telefono: string;
  hash_contrasena: string;
  rol: 'jugador' | 'admin';
  activo: number;
  creado_en: string;
  actualizado_en: string;
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

/**
 * D1 falsa con memoria para las pruebas de integración de autenticación (KAN-16 y KAN-17).
 * Entiende solo las consultas de los repositorios de usuarios, intentos y sesiones.
 */
export function crearD1DeAutenticacion(usuariosIniciales: UsuarioGuardado[] = []) {
  const usuarios = [...usuariosIniciales];
  const sesiones: SesionGuardada[] = [];
  const intentos = new Map<string, IntentosGuardados>();
  const buscarUsuario = (correo: unknown) =>
    usuarios.find((usuario) => usuario.correo === String(correo).toLowerCase());

  const { db, consultas } = crearD1Falsa((sql, parametros) => {
    const [primero, segundo, tercero, cuarto] = parametros;

    if (sql.includes('FROM usuarios WHERE correo') || sql.includes('FROM usuarios\n')) {
      const usuario = buscarUsuario(primero);
      return usuario ? [usuario] : [];
    }
    if (sql.includes('INSERT INTO usuarios')) {
      const [id, nombre, correo, telefono, hash, rol, activo, creado, actualizado] = parametros;
      usuarios.push({
        id: String(id),
        nombre_completo: String(nombre),
        correo: String(correo),
        telefono: String(telefono),
        hash_contrasena: String(hash),
        rol: rol as UsuarioGuardado['rol'],
        activo: Number(activo),
        creado_en: String(creado),
        actualizado_en: String(actualizado),
      });
      return [];
    }
    if (sql.includes('UPDATE usuarios SET hash_contrasena')) {
      const usuario = usuarios.find((guardado) => guardado.id === tercero);
      if (usuario) {
        usuario.hash_contrasena = String(primero);
        usuario.actualizado_en = String(segundo);
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
    return [];
  });

  /** Simula que pasaron las 24 horas de todas las sesiones (Escenario 7). */
  function vencerSesiones(): void {
    for (const sesion of sesiones) sesion.expira_en = new Date(Date.now() - 1000).toISOString();
  }

  return { db, consultas, usuarios, sesiones, intentos, vencerSesiones };
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
    creado_en: '2026-10-01T12:00:00.000Z',
    actualizado_en: '2026-10-01T12:00:00.000Z',
    ...cambios,
  };
}
