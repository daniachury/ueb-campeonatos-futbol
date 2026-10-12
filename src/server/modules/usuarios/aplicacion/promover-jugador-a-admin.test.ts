import { describe, expect, it } from 'vitest';
import { ContrasenaCifrada } from '../dominio/objeto-valor/contrasena-cifrada';
import { CorreoElectronico } from '../dominio/objeto-valor/correo-electronico';
import { NombreCompleto } from '../dominio/objeto-valor/nombre-completo';
import { Telefono } from '../dominio/objeto-valor/telefono';
import { ROLES } from '../dominio/rol';
import { Usuario } from '../dominio/usuario';
import { ErrorCorreoYaEsAdmin } from './errores/error-correo-ya-es-admin';
import { ErrorJugadorEnTorneoEnCurso } from './errores/error-jugador-en-torneo-en-curso';
import { ErrorJugadorNoEncontrado } from './errores/error-jugador-no-encontrado';
import {
  PromoverJugadorAAdmin,
  type RepositorioDeEquiposParaPromover,
} from './promover-jugador-a-admin';
import type {
  RegistroDeAuditoria,
  RepositorioDeAuditoria,
} from './puertos/repositorio-de-auditoria';
import type { RepositorioDeUsuarios } from './puertos/repositorio-de-usuarios';

const ADMIN_CREADOR_ID = 'admin-creador-001';
const FECHA_PROMOCION = new Date('2026-10-10T14:00:00Z');

class RepositorioDeUsuariosEnMemoria implements RepositorioDeUsuarios {
  readonly usuarios: Map<string, Usuario> = new Map();
  readonly rolesActualizados: Array<{ id: string; rol: string; fecha: Date }> = [];

  async existeConCorreo(): Promise<boolean> {
    return false;
  }

  async buscarPorCorreo(): Promise<Usuario | null> {
    return null;
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    return this.usuarios.get(id) ?? null;
  }

  async guardar(usuario: Usuario): Promise<void> {
    this.usuarios.set(usuario.id, usuario);
  }

  async actualizarPerfil(): Promise<void> {}

  async actualizarContrasena(): Promise<void> {}

  async actualizarRol(
    id: string,
    rol: (typeof ROLES)[keyof typeof ROLES],
    fecha: Date,
  ): Promise<void> {
    this.rolesActualizados.push({ id, rol, fecha });
    const usuario = this.usuarios.get(id);
    if (usuario) {
      this.usuarios.set(id, usuario.promoverAAdministrador(fecha));
    }
  }

  async actualizarDebeCambiarContrasena(): Promise<void> {}
}

class RepositorioDeAuditoriaEnMemoria implements RepositorioDeAuditoria {
  readonly registros: RegistroDeAuditoria[] = [];

  async registrar(registro: RegistroDeAuditoria): Promise<void> {
    this.registros.push(registro);
  }
}

class RepositorioDeEquiposEnMemoria implements RepositorioDeEquiposParaPromover {
  jugadoresEnTorneo = new Set<string>();
  jugadoresRemovidos: string[] = [];

  async jugadorPerteneceAEquipoEnTorneoEnCurso(jugadorId: string): Promise<boolean> {
    return this.jugadoresEnTorneo.has(jugadorId);
  }

  async removerJugadorDeEquipos(jugadorId: string): Promise<void> {
    this.jugadoresRemovidos.push(jugadorId);
  }
}

function prepararPromocion() {
  const repositorioDeUsuarios = new RepositorioDeUsuariosEnMemoria();
  const repositorioDeAuditoria = new RepositorioDeAuditoriaEnMemoria();
  const repositorioDeEquipos = new RepositorioDeEquiposEnMemoria();

  const casoDeUso = new PromoverJugadorAAdmin({
    repositorioDeUsuarios,
    repositorioDeAuditoria,
    repositorioDeEquipos,
    generadorDeIdentificadores: { generar: () => 'audit-promo-001' },
    reloj: { ahora: () => FECHA_PROMOCION },
  });

  return {
    casoDeUso,
    repositorioDeUsuarios,
    repositorioDeAuditoria,
    repositorioDeEquipos,
  };
}

describe('PromoverJugadorAAdmin (KAN-18 · Escenario 3)', () => {
  it('promueve un jugador a admin, lo remueve de equipos y registra auditoría', async () => {
    const { casoDeUso, repositorioDeUsuarios, repositorioDeAuditoria, repositorioDeEquipos } =
      prepararPromocion();

    const jugador = Usuario.registrarJugador({
      id: 'jugador-a-promover',
      nombreCompleto: NombreCompleto.crear('Camilo Torres'),
      correo: CorreoElectronico.crear('camilo@unbosque.edu.co'),
      telefono: Telefono.crear('3112223344'),
      contrasenaCifrada: ContrasenaCifrada.desdeHash('hash_camilo'),
      fechaDeRegistro: new Date('2026-10-01'),
    });
    repositorioDeUsuarios.usuarios.set(jugador.id, jugador);

    const resultado = await casoDeUso.ejecutar('jugador-a-promover', ADMIN_CREADOR_ID);

    expect(resultado).toEqual({
      id: 'jugador-a-promover',
      nombreCompleto: 'Camilo Torres',
      correo: 'camilo@unbosque.edu.co',
      telefono: '3112223344',
      rol: ROLES.ADMINISTRADOR,
    });

    // Actualizó en el repositorio de usuarios
    expect(repositorioDeUsuarios.rolesActualizados).toEqual([
      { id: 'jugador-a-promover', rol: ROLES.ADMINISTRADOR, fecha: FECHA_PROMOCION },
    ]);

    // Removió al jugador de sus equipos
    expect(repositorioDeEquipos.jugadoresRemovidos).toContain('jugador-a-promover');

    // Registró en auditoría
    expect(repositorioDeAuditoria.registros).toHaveLength(1);
    expect(repositorioDeAuditoria.registros[0]).toEqual({
      id: 'audit-promo-001',
      adminCreadorId: ADMIN_CREADOR_ID,
      usuarioId: 'jugador-a-promover',
      accion: 'PROMOVER_JUGADOR',
      creadoEn: FECHA_PROMOCION,
    });
  });

  it('lanza ErrorJugadorNoEncontrado si el usuario no existe', async () => {
    const { casoDeUso } = prepararPromocion();

    await expect(casoDeUso.ejecutar('no-existe', ADMIN_CREADOR_ID)).rejects.toThrowError(
      ErrorJugadorNoEncontrado,
    );
  });

  it('lanza ErrorCorreoYaEsAdmin si el usuario ya es administrador', async () => {
    const { casoDeUso, repositorioDeUsuarios } = prepararPromocion();

    const admin = Usuario.registrarAdministrador({
      id: 'admin-ya-es',
      nombreCompleto: NombreCompleto.crear('Sofia Admin'),
      correo: CorreoElectronico.crear('sofia@unbosque.edu.co'),
      telefono: Telefono.crear('3101112233'),
      contrasenaCifrada: ContrasenaCifrada.desdeHash('hash_sofia'),
      fechaDeRegistro: new Date('2026-10-01'),
    });
    repositorioDeUsuarios.usuarios.set(admin.id, admin);

    await expect(casoDeUso.ejecutar('admin-ya-es', ADMIN_CREADOR_ID)).rejects.toThrowError(
      ErrorCorreoYaEsAdmin,
    );
  });

  it('lanza ErrorJugadorEnTorneoEnCurso si el jugador está en un torneo activo (Escenario 3)', async () => {
    const { casoDeUso, repositorioDeUsuarios, repositorioDeEquipos } = prepararPromocion();

    const jugador = Usuario.registrarJugador({
      id: 'jugador-en-torneo',
      nombreCompleto: NombreCompleto.crear('Andres Parra'),
      correo: CorreoElectronico.crear('andres@unbosque.edu.co'),
      telefono: Telefono.crear('3123456789'),
      contrasenaCifrada: ContrasenaCifrada.desdeHash('hash_andres'),
      fechaDeRegistro: new Date('2026-10-01'),
    });
    repositorioDeUsuarios.usuarios.set(jugador.id, jugador);
    repositorioDeEquipos.jugadoresEnTorneo.add(jugador.id);

    await expect(casoDeUso.ejecutar(jugador.id, ADMIN_CREADOR_ID)).rejects.toThrowError(
      ErrorJugadorEnTorneoEnCurso,
    );

    // No debe modificar rol ni auditar
    expect(repositorioDeUsuarios.rolesActualizados).toHaveLength(0);
    expect(repositorioDeEquipos.jugadoresRemovidos).toHaveLength(0);
  });
});
