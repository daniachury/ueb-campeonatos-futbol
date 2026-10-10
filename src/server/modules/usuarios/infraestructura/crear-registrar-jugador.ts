import { RegistrarJugador } from '../aplicacion/registrar-jugador';
import { CifradorPbkdf2 } from './cifrador-pbkdf2';
import { GeneradorDeUuid } from './generador-de-uuid';
import { RelojDelSistema } from './reloj-del-sistema';
import { RepositorioDeUsuariosD1 } from './repositorio-de-usuarios-d1';

/**
 * Raíz de composición del caso de uso: el ÚNICO lugar que decide qué adaptadores usa.
 */
export function crearRegistrarJugador(baseDeDatos: D1Database): RegistrarJugador {
  return new RegistrarJugador({
    repositorioDeUsuarios: new RepositorioDeUsuariosD1(baseDeDatos),
    cifradorDeContrasenas: new CifradorPbkdf2(),
    generadorDeIdentificadores: new GeneradorDeUuid(),
    reloj: new RelojDelSistema(),
  });
}
