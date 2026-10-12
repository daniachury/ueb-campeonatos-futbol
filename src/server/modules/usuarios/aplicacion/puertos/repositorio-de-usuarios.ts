import type { ContrasenaCifrada } from '../../dominio/objeto-valor/contrasena-cifrada';
import type { CorreoElectronico } from '../../dominio/objeto-valor/correo-electronico';
import type { Usuario } from '../../dominio/usuario';

/**
 * Puerto: lo que el caso de uso necesita de la base de datos, sin decir cuál es.
 * Lo cumple RepositorioDeUsuariosD1 (infraestructura).
 */
export interface RepositorioDeUsuarios {
  existeConCorreo(correo: CorreoElectronico): Promise<boolean>;
  /** KAN-17: el usuario con ese correo (sin distinguir mayúsculas), o null si no existe. */
  buscarPorCorreo(correo: CorreoElectronico): Promise<Usuario | null>;
  /** Si el correo ya existe (dos registros al mismo tiempo), lanza ErrorCorreoYaRegistrado. */
  guardar(usuario: Usuario): Promise<void>;
  /** Reemplaza la contraseña guardada, por ejemplo al pasar una cuenta antigua a hash. */
  actualizarContrasena(
    usuarioId: string,
    contrasenaCifrada: ContrasenaCifrada,
    fecha: Date,
  ): Promise<void>;
}
