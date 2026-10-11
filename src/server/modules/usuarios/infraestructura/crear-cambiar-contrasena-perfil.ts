import { crearSesionesRepository } from '../../auth/sesiones.repository';
import { CambiarContrasenaPerfil } from '../aplicacion/cambiar-contrasena-perfil';
import { CifradorPbkdf2 } from './cifrador-pbkdf2';
import { RelojDelSistema } from './reloj-del-sistema';
import { RepositorioDeUsuariosD1 } from './repositorio-de-usuarios-d1';

export function crearCambiarContrasenaPerfil(db: D1Database): CambiarContrasenaPerfil {
  return new CambiarContrasenaPerfil({
    repositorioDeUsuarios: new RepositorioDeUsuariosD1(db),
    sesionesRepository: crearSesionesRepository(db),
    cifradorDeContrasenas: new CifradorPbkdf2(),
    reloj: new RelojDelSistema(),
  });
}
