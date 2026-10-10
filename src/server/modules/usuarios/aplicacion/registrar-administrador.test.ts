import { describe, expect, it } from 'vitest';
import { ContrasenaCifrada } from '../dominio/objeto-valor/contrasena-cifrada';
import type { ContrasenaPlana } from '../dominio/objeto-valor/contrasena-plana';
import { CorreoElectronico } from '../dominio/objeto-valor/correo-electronico';
import { NombreCompleto } from '../dominio/objeto-valor/nombre-completo';
import { Telefono } from '../dominio/objeto-valor/telefono';
import { ROLES } from '../dominio/rol';
import { Usuario } from '../dominio/usuario';
import { ErrorCorreoEsJugador } from './errores/error-correo-es-jugador';
import { ErrorCorreoYaEsAdmin } from './errores/error-correo-ya-es-admin';
import type { CifradorDeContrasenas } from './puertos/cifrador-de-contrasenas';
import type {
  RegistroDeAuditoria,
  RepositorioDeAuditoria,
} from './puertos/repositorio-de-auditoria';
import type { RepositorioDeUsuarios } from './puertos/repositorio-de-usuarios';
import { RegistrarAdministrador, type SolicitudRegistroAdmin } from './registrar-administrador';

const ADMIN_CREADOR_ID = 'admin-principal-001';
const FECHA_REGISTRO = new Date('2026-10-10T12:00:00Z');

class RepositorioDeUsuariosEnMemoria implements RepositorioDeUsuarios {
  readonly usuarios: Usuario[] = [];

  async existeConCorreo(correo: CorreoElectronico): Promise<boolean> {
    return this.usuarios.some((u) => u.correo.esIgualA(correo));
  }

  async buscarPorCorreo(correo: CorreoElectronico): Promise<Usuario | null> {
    return this.usuarios.find((u) => u.correo.esIgualA(correo)) ?? null;
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    return this.usuarios.find((u) => u.id === id) ?? null;
  }

  async guardar(usuario: Usuario): Promise<void> {
    this.usuarios.push(usuario);
  }

  async actualizarContrasena(): Promise<void> {}
  async actualizarRol(): Promise<void> {}
  async actualizarDebeCambiarContrasena(): Promise<void> {}
}

class RepositorioDeAuditoriaEnMemoria implements RepositorioDeAuditoria {
  readonly registros: RegistroDeAuditoria[] = [];

  async registrar(registro: RegistroDeAuditoria): Promise<void> {
    this.registros.push(registro);
  }
}

class CifradorDePrueba implements CifradorDeContrasenas {
  readonly contrasenasCifradas: string[] = [];

  async cifrar(contrasena: ContrasenaPlana): Promise<ContrasenaCifrada> {
    this.contrasenasCifradas.push(contrasena.revelarParaCifrar());
    return ContrasenaCifrada.desdeHash(`hash_${contrasena.revelarParaCifrar()}`);
  }

  async coincide(): Promise<boolean> {
    return false;
  }

  necesitaActualizarse(): boolean {
    return false;
  }
}

function prepararCasoDeUso() {
  const repositorioDeUsuarios = new RepositorioDeUsuariosEnMemoria();
  const repositorioDeAuditoria = new RepositorioDeAuditoriaEnMemoria();
  const cifradorDeContrasenas = new CifradorDePrueba();
  let idContador = 100;

  const casoDeUso = new RegistrarAdministrador({
    repositorioDeUsuarios,
    repositorioDeAuditoria,
    cifradorDeContrasenas,
    generadorDeIdentificadores: { generar: () => `id-${++idContador}` },
    reloj: { ahora: () => FECHA_REGISTRO },
  });

  return {
    casoDeUso,
    repositorioDeUsuarios,
    repositorioDeAuditoria,
    cifradorDeContrasenas,
  };
}

describe('RegistrarAdministrador (KAN-18 · Escenarios 1, 3 y 4)', () => {
  it('registra un nuevo administrador con contraseña temporal de 12 caracteres y auditoría (Escenario 1)', async () => {
    const { casoDeUso, repositorioDeUsuarios, repositorioDeAuditoria, cifradorDeContrasenas } =
      prepararCasoDeUso();

    const solicitud: SolicitudRegistroAdmin = {
      nombreCompleto: 'Carlos Mendoza',
      correo: 'carlos@unbosque.edu.co',
      telefono: '3109876543',
    };

    const resultado = await casoDeUso.ejecutar(solicitud, ADMIN_CREADOR_ID);

    expect(resultado.rol).toBe(ROLES.ADMINISTRADOR);
    expect(resultado.nombreCompleto).toBe('Carlos Mendoza');
    expect(resultado.correo).toBe('carlos@unbosque.edu.co');
    expect(resultado.telefono).toBe('3109876543');
    expect(resultado.contrasenaTemporal).toHaveLength(12);

    // Verificación en base de datos
    expect(repositorioDeUsuarios.usuarios).toHaveLength(1);
    const adminGuardado = repositorioDeUsuarios.usuarios[0]!;
    expect(adminGuardado.rol).toBe(ROLES.ADMINISTRADOR);
    expect(adminGuardado.debeCambiarContrasena).toBe(true);
    expect(adminGuardado.activo).toBe(true);

    // Verificación de auditoría
    expect(repositorioDeAuditoria.registros).toHaveLength(1);
    expect(repositorioDeAuditoria.registros[0]).toMatchObject({
      adminCreadorId: ADMIN_CREADOR_ID,
      usuarioId: resultado.id,
      accion: 'CREAR_ADMIN',
      creadoEn: FECHA_REGISTRO,
    });

    // Cifrador recibió la contraseña temporal
    expect(cifradorDeContrasenas.contrasenasCifradas[0]).toBe(resultado.contrasenaTemporal);
  });

  it('lanza ErrorCorreoEsJugador si el correo pertenece a un jugador existente (Escenario 3)', async () => {
    const { casoDeUso, repositorioDeUsuarios, repositorioDeAuditoria } = prepararCasoDeUso();

    const jugadorExistente = Usuario.registrarJugador({
      id: 'jugador-123',
      nombreCompleto: NombreCompleto.crear('Mateo Silva'),
      correo: CorreoElectronico.crear('mateo@unbosque.edu.co'),
      telefono: Telefono.crear('3151234567'),
      contrasenaCifrada: ContrasenaCifrada.desdeHash('hash_jugador'),
      fechaDeRegistro: new Date('2026-10-01'),
    });
    repositorioDeUsuarios.usuarios.push(jugadorExistente);

    const solicitud: SolicitudRegistroAdmin = {
      nombreCompleto: 'Mateo Silva',
      correo: 'mateo@unbosque.edu.co',
      telefono: '3151234567',
    };

    await expect(casoDeUso.ejecutar(solicitud, ADMIN_CREADOR_ID)).rejects.toThrowError(
      ErrorCorreoEsJugador,
    );

    try {
      await casoDeUso.ejecutar(solicitud, ADMIN_CREADOR_ID);
    } catch (error) {
      expect(error).toBeInstanceOf(ErrorCorreoEsJugador);
      const errorJugador = error as ErrorCorreoEsJugador;
      expect(errorJugador.jugadorId).toBe('jugador-123');
      expect(errorJugador.nombreJugador).toBe('Mateo Silva');
    }

    expect(repositorioDeAuditoria.registros).toHaveLength(0);
  });

  it('lanza ErrorCorreoYaEsAdmin si el correo ya pertenece a un administrador (Escenario 4)', async () => {
    const { casoDeUso, repositorioDeUsuarios, repositorioDeAuditoria } = prepararCasoDeUso();

    const adminExistente = Usuario.registrarAdministrador({
      id: 'admin-existente',
      nombreCompleto: NombreCompleto.crear('Diana Reyes'),
      correo: CorreoElectronico.crear('diana@unbosque.edu.co'),
      telefono: Telefono.crear('3201234567'),
      contrasenaCifrada: ContrasenaCifrada.desdeHash('hash_diana'),
      fechaDeRegistro: new Date('2026-10-05'),
    });
    repositorioDeUsuarios.usuarios.push(adminExistente);

    const solicitud: SolicitudRegistroAdmin = {
      nombreCompleto: 'Diana Reyes',
      correo: 'DIANA@unbosque.edu.co',
      telefono: '3201234567',
    };

    await expect(casoDeUso.ejecutar(solicitud, ADMIN_CREADOR_ID)).rejects.toThrowError(
      ErrorCorreoYaEsAdmin,
    );

    expect(repositorioDeAuditoria.registros).toHaveLength(0);
  });

  it('falla con validación de dominio si los campos son inválidos', async () => {
    const { casoDeUso } = prepararCasoDeUso();

    await expect(
      casoDeUso.ejecutar(
        {
          nombreCompleto: 'A', // Demasiado corto
          correo: 'correo@valido.com',
          telefono: '3001234567',
        },
        ADMIN_CREADOR_ID,
      ),
    ).rejects.toThrow();

    await expect(
      casoDeUso.ejecutar(
        {
          nombreCompleto: 'Nombre Valido',
          correo: 'correo-invalido',
          telefono: '3001234567',
        },
        ADMIN_CREADOR_ID,
      ),
    ).rejects.toThrow();
  });
});
