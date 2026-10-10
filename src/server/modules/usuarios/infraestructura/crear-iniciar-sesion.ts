import { IniciarSesion } from '../aplicacion/iniciar-sesion';
import { CifradorProvisionalEnTextoPlano } from './cifrador-provisional-en-texto-plano';
import { RegistroDeIntentosFallidosD1 } from './registro-de-intentos-fallidos-d1';
import { RelojDelSistema } from './reloj-del-sistema';
import { RepositorioDeUsuariosD1 } from './repositorio-de-usuarios-d1';

/** Raíz de composición del caso de uso Iniciar sesión (KAN-17). */
export function crearIniciarSesion(baseDeDatos: D1Database): IniciarSesion {
  const reloj = new RelojDelSistema();
  return new IniciarSesion({
    repositorioDeUsuarios: new RepositorioDeUsuariosD1(baseDeDatos),
    cifradorDeContrasenas: new CifradorProvisionalEnTextoPlano(),
    registroDeIntentosFallidos: new RegistroDeIntentosFallidosD1(baseDeDatos, reloj),
    reloj,
  });
}
