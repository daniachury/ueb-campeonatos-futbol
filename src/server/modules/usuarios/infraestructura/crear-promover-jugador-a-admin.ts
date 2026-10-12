import { PromoverJugadorAAdmin } from '../aplicacion/promover-jugador-a-admin';
import { GeneradorDeUuid } from './generador-de-uuid';
import { RelojDelSistema } from './reloj-del-sistema';
import { RepositorioDeAuditoriaD1 } from './repositorio-de-auditoria-d1';
import { RepositorioDeEquiposParaPromoverD1 } from './repositorio-de-equipos-para-promover-d1';
import { RepositorioDeUsuariosD1 } from './repositorio-de-usuarios-d1';

/** Raíz de composición del caso de uso PromoverJugadorAAdmin. */
export function crearPromoverJugadorAAdmin(baseDeDatos: D1Database): PromoverJugadorAAdmin {
  return new PromoverJugadorAAdmin({
    repositorioDeUsuarios: new RepositorioDeUsuariosD1(baseDeDatos),
    repositorioDeAuditoria: new RepositorioDeAuditoriaD1(baseDeDatos),
    repositorioDeEquipos: new RepositorioDeEquiposParaPromoverD1(baseDeDatos),
    generadorDeIdentificadores: new GeneradorDeUuid(),
    reloj: new RelojDelSistema(),
  });
}
