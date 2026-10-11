import { RegistrarAdministrador } from '../aplicacion/registrar-administrador';
import { CifradorPbkdf2 } from './cifrador-pbkdf2';
import { GeneradorDeUuid } from './generador-de-uuid';
import { RelojDelSistema } from './reloj-del-sistema';
import { RepositorioDeAuditoriaD1 } from './repositorio-de-auditoria-d1';
import { RepositorioDeUsuariosD1 } from './repositorio-de-usuarios-d1';

/** Raíz de composición del caso de uso RegistrarAdministrador. */
export function crearRegistrarAdministrador(baseDeDatos: D1Database): RegistrarAdministrador {
  return new RegistrarAdministrador({
    repositorioDeUsuarios: new RepositorioDeUsuariosD1(baseDeDatos),
    repositorioDeAuditoria: new RepositorioDeAuditoriaD1(baseDeDatos),
    cifradorDeContrasenas: new CifradorPbkdf2(),
    generadorDeIdentificadores: new GeneradorDeUuid(),
    reloj: new RelojDelSistema(),
  });
}
