import { CifradorPbkdf2 } from '../src/server/modules/usuarios/infraestructura/cifrador-pbkdf2';
import { ContrasenaPlana } from '../src/server/modules/usuarios/dominio/objeto-valor/contrasena-plana';
import { GeneradorDeUuid } from '../src/server/modules/usuarios/infraestructura/generador-de-uuid';
import { RelojDelSistema } from '../src/server/modules/usuarios/infraestructura/reloj-del-sistema';

export interface ParametrosSemillaAdmin {
  nombre?: string;
  correo?: string;
  telefono?: string;
}

export interface ResultadoSemillaAdmin {
  creado: boolean;
  mensaje: string;
  adminId?: string;
  contrasenaTemporal?: string;
}

/**
 * Genera una contraseña temporal segura de 12 caracteres (letras mayúsculas, minúsculas y números).
 */
function generarContrasenaTemporal(): string {
  const caracteres = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const longitud = 12;
  const bytes = new Uint8Array(longitud);
  crypto.getRandomValues(bytes);
  let resultado = '';
  for (let i = 0; i < longitud; i++) {
    resultado += caracteres[bytes[i]! % caracteres.length];
  }
  return resultado;
}

/**
 * Semilla idempotente del primer administrador (KAN-18 · Escenario 6).
 * Si ya existe algún admin en la tabla usuarios, omite la creación.
 */
export async function sembrarPrimerAdministrador(
  db: D1Database,
  parametros: ParametrosSemillaAdmin = {},
): Promise<ResultadoSemillaAdmin> {
  const nombre = parametros.nombre || process.env.ADMIN_NOMBRE || 'Administrador Liga Bosque';
  const correo = (parametros.correo || process.env.ADMIN_CORREO || 'admin@unbosque.edu.co')
    .trim()
    .toLowerCase();
  const telefono = parametros.telefono || process.env.ADMIN_TELEFONO || '3001234567';

  // Verificar si ya existe al menos un admin
  const conteo = await db
    .prepare("SELECT COUNT(*) AS total FROM usuarios WHERE rol = 'admin'")
    .first<{ total: number }>();

  if (conteo && conteo.total > 0) {
    return {
      creado: false,
      mensaje: 'Ya existe un administrador. Semilla omitida.',
    };
  }

  const contrasenaTemporal = generarContrasenaTemporal();
  const cifrador = new CifradorPbkdf2();
  const contrasenaCifrada = await cifrador.cifrar(
    ContrasenaPlana.desdeContrasenaVerificada(contrasenaTemporal),
  );
  const generadorId = new GeneradorDeUuid();
  const id = generadorId.generar();
  const reloj = new RelojDelSistema();
  const ahora = reloj.ahora().toISOString();

  await db
    .prepare(
      `INSERT INTO usuarios
         (id, nombre_completo, correo, telefono, hash_contrasena, rol, activo, debe_cambiar_contrasena, creado_en, actualizado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      nombre,
      correo,
      telefono,
      contrasenaCifrada.obtenerHashParaGuardar(),
      'admin',
      1,
      1,
      ahora,
      ahora,
    )
    .run();

  return {
    creado: true,
    mensaje: `Admin creado. Contraseña temporal: ${contrasenaTemporal}`,
    adminId: id,
    contrasenaTemporal,
  };
}
