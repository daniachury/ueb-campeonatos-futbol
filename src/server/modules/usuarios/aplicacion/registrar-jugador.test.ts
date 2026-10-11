import { describe, expect, it } from 'vitest';
import type { SolicitudRegistroJugador } from '../../../../shared/usuarios/esquema-registro-jugador';
import { ContrasenaCifrada } from '../dominio/objeto-valor/contrasena-cifrada';
import type { ContrasenaPlana } from '../dominio/objeto-valor/contrasena-plana';
import type { CorreoElectronico } from '../dominio/objeto-valor/correo-electronico';
import { ROLES } from '../dominio/rol';
import type { Usuario } from '../dominio/usuario';
import { ErrorCorreoYaRegistrado } from './errores/error-correo-ya-registrado';
import type { CifradorDeContrasenas } from './puertos/cifrador-de-contrasenas';
import type { RepositorioDeUsuarios } from './puertos/repositorio-de-usuarios';
import { RegistrarJugador } from './registrar-jugador';

const ID_DE_PRUEBA = 'jugador-001';
const HASH_DE_PRUEBA = '$2b$10$hashDePruebaQueNuncaDebeSalirEnUnaRespuesta';
const FECHA_DE_REGISTRO = new Date('2026-10-09T09:00:00-05:00');

const SOLICITUD_DE_LAURA: SolicitudRegistroJugador = {
  nombreCompleto: 'Laura Gómez',
  correo: 'laura@mail.com',
  telefono: '3001234567',
  contrasena: 'clave123',
};

/** Doble de prueba: una "base de datos" que vive en un arreglo. */
class RepositorioDeUsuariosEnMemoria implements RepositorioDeUsuarios {
  readonly usuariosGuardados: Usuario[] = [];

  async existeConCorreo(correo: CorreoElectronico): Promise<boolean> {
    return this.usuariosGuardados.some((usuario) => usuario.correo.esIgualA(correo));
  }

  async buscarPorCorreo(): Promise<Usuario | null> {
    return null;
  }

  async guardar(usuario: Usuario): Promise<void> {
    this.usuariosGuardados.push(usuario);
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    return this.usuariosGuardados.find((usuario) => usuario.id === id) ?? null;
  }

  async actualizarContrasena(): Promise<void> {}

  async actualizarPerfil(): Promise<void> {}

  async actualizarRol(): Promise<void> {}

  async actualizarDebeCambiarContrasena(): Promise<void> {}
}

/** Doble de prueba: anota qué recibió y devuelve siempre el mismo hash. */
class CifradorDePrueba implements CifradorDeContrasenas {
  readonly contrasenasRecibidas: string[] = [];

  async cifrar(contrasena: ContrasenaPlana): Promise<ContrasenaCifrada> {
    this.contrasenasRecibidas.push(contrasena.revelarParaCifrar());
    return ContrasenaCifrada.desdeHash(HASH_DE_PRUEBA);
  }

  async coincide(): Promise<boolean> {
    return false;
  }

  necesitaActualizarse(): boolean {
    return false;
  }
}

function prepararRegistro() {
  const repositorioDeUsuarios = new RepositorioDeUsuariosEnMemoria();
  const cifradorDeContrasenas = new CifradorDePrueba();
  const registrarJugador = new RegistrarJugador({
    repositorioDeUsuarios,
    cifradorDeContrasenas,
    generadorDeIdentificadores: { generar: () => ID_DE_PRUEBA },
    reloj: { ahora: () => FECHA_DE_REGISTRO },
  });

  return { registrarJugador, repositorioDeUsuarios, cifradorDeContrasenas };
}

describe('RegistrarJugador', () => {
  it('registra a Laura como jugadora, activa y con el correo normalizado (Escenario 1)', async () => {
    const { registrarJugador, repositorioDeUsuarios } = prepararRegistro();

    const jugador = await registrarJugador.ejecutar({
      ...SOLICITUD_DE_LAURA,
      correo: 'Laura@Mail.com ',
    });

    expect(jugador).toEqual({
      id: ID_DE_PRUEBA,
      nombreCompleto: 'Laura Gómez',
      correo: 'laura@mail.com',
      telefono: '3001234567',
      rol: 'jugador',
    });
    const [usuarioGuardado] = repositorioDeUsuarios.usuariosGuardados;
    expect(usuarioGuardado?.activo).toBe(true);
    expect(usuarioGuardado?.creadoEn).toEqual(FECHA_DE_REGISTRO);
  });

  it('rechaza un correo ya registrado aunque cambien las mayúsculas (Escenario 2)', async () => {
    const { registrarJugador, repositorioDeUsuarios, cifradorDeContrasenas } = prepararRegistro();
    await registrarJugador.ejecutar(SOLICITUD_DE_LAURA);

    const segundoIntento = registrarJugador.ejecutar({
      ...SOLICITUD_DE_LAURA,
      correo: 'LAURA@mail.com',
    });

    await expect(segundoIntento).rejects.toThrow(ErrorCorreoYaRegistrado);
    expect(repositorioDeUsuarios.usuariosGuardados).toHaveLength(1);
    expect(cifradorDeContrasenas.contrasenasRecibidas).toHaveLength(1);
  });

  it('ignora un rol de administrador colado en la solicitud (Escenario 4)', async () => {
    const { registrarJugador, repositorioDeUsuarios } = prepararRegistro();
    const solicitudManipulada = { ...SOLICITUD_DE_LAURA, rol: ROLES.ADMINISTRADOR };

    const jugador = await registrarJugador.ejecutar(solicitudManipulada);

    expect(jugador.rol).toBe('jugador');
    expect(repositorioDeUsuarios.usuariosGuardados[0]?.rol).toBe(ROLES.JUGADOR);
  });

  it('guarda lo que entrega el cifrador y no lo devuelve (Escenario 5)', async () => {
    const { registrarJugador, repositorioDeUsuarios, cifradorDeContrasenas } = prepararRegistro();

    const jugador = await registrarJugador.ejecutar(SOLICITUD_DE_LAURA);

    expect(cifradorDeContrasenas.contrasenasRecibidas).toEqual(['clave123']);
    expect(
      repositorioDeUsuarios.usuariosGuardados[0]?.contrasenaCifrada.obtenerHashParaGuardar(),
    ).toBe(HASH_DE_PRUEBA);
    const respuestaComoJson = JSON.stringify(jugador);
    expect(respuestaComoJson).not.toContain('clave123');
    expect(respuestaComoJson).not.toContain(HASH_DE_PRUEBA);
  });

  it('valida los datos antes de cifrar o guardar nada', async () => {
    const { registrarJugador, repositorioDeUsuarios, cifradorDeContrasenas } = prepararRegistro();

    const intentoInvalido = registrarJugador.ejecutar({
      ...SOLICITUD_DE_LAURA,
      telefono: '300abc',
    });

    await expect(intentoInvalido).rejects.toThrow('Ingresa un teléfono válido (7 a 15 dígitos)');
    expect(cifradorDeContrasenas.contrasenasRecibidas).toHaveLength(0);
    expect(repositorioDeUsuarios.usuariosGuardados).toHaveLength(0);
  });
});
