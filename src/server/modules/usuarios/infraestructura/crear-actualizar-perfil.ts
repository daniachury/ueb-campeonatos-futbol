import { ActualizarPerfil } from '../aplicacion/actualizar-perfil';
import { CifradorPbkdf2 } from './cifrador-pbkdf2';
import { RelojDelSistema } from './reloj-del-sistema';
import { RepositorioDeUsuariosD1 } from './repositorio-de-usuarios-d1';

export function crearActualizarPerfil(db: D1Database): ActualizarPerfil {
  return new ActualizarPerfil({
    repositorioDeUsuarios: new RepositorioDeUsuariosD1(db),
    cifradorDeContrasenas: new CifradorPbkdf2(),
    reloj: new RelojDelSistema(),
  });
}
