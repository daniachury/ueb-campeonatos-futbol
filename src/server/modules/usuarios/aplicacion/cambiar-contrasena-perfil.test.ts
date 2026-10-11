import { describe, expect, it } from 'vitest';
import type {
  NuevaSesion,
  SesionConUsuario,
  SesionesRepository,
} from '../../auth/sesiones.repository';
import { ContrasenaCifrada } from '../dominio/objeto-valor/contrasena-cifrada';
import { ContrasenaPlana } from '../dominio/objeto-valor/contrasena-plana';
import { CorreoElectronico } from '../dominio/objeto-valor/correo-electronico';
import { NombreCompleto } from '../dominio/objeto-valor/nombre-completo';
import { Telefono } from '../dominio/objeto-valor/telefono';
import { Usuario } from '../dominio/usuario';
import { CifradorPbkdf2 } from '../infraestructura/cifrador-pbkdf2';
import { CambiarContrasenaPerfil } from './cambiar-contrasena-perfil';
import { ErrorContrasenaActualIncorrecta } from './errores/error-contrasena-actual-incorrecta';
import type { RepositorioDeUsuarios } from './puertos/repositorio-de-usuarios';

class RepositorioDeUsuariosEnMemoria implements RepositorioDeUsuarios {
  usuarios: Usuario[] = [];

  async existeConCorreo(correo: CorreoElectronico): Promise<boolean> {
    return this.usuarios.some((u) => u.correo.valor === correo.valor);
  }

  async buscarPorCorreo(correo: CorreoElectronico): Promise<Usuario | null> {
    return this.usuarios.find((u) => u.correo.valor === correo.valor) ?? null;
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    return this.usuarios.find((u) => u.id === id) ?? null;
  }

  async guardar(usuario: Usuario): Promise<void> {
    this.usuarios.push(usuario);
  }

  async actualizarRol(): Promise<void> {}

  async actualizarDebeCambiarContrasena(): Promise<void> {}

  async actualizarContrasena(
    usuarioId: string,
    contrasenaCifrada: ContrasenaCifrada,
    fecha: Date,
  ): Promise<void> {
    this.usuarios = this.usuarios.map((u) => {
      if (u.id !== usuarioId) return u;
      return Usuario.reconstituir({
        id: u.id,
        nombreCompleto: u.nombreCompleto,
        correo: u.correo,
        telefono: u.telefono,
        contrasenaCifrada,
        rol: u.rol,
        activo: u.activo,
        debeCambiarContrasena: u.debeCambiarContrasena,
        creadoEn: u.creadoEn,
        actualizadoEn: fecha,
      });
    });
  }

  async actualizarPerfil(): Promise<void> {}
}

class SesionesRepositoryEnMemoria implements SesionesRepository {
  sesiones: NuevaSesion[] = [];

  async crear(sesion: NuevaSesion): Promise<void> {
    this.sesiones.push(sesion);
  }

  async buscarPorHashDelToken(): Promise<SesionConUsuario | null> {
    return null;
  }

  async eliminarPorHashDelToken(hashToken: string): Promise<void> {
    this.sesiones = this.sesiones.filter((s) => s.hashToken !== hashToken);
  }

  async eliminarOtrasSesionesDelUsuario(usuarioId: string, hashTokenActual: string): Promise<void> {
    this.sesiones = this.sesiones.filter(
      (s) => s.usuarioId !== usuarioId || s.hashToken === hashTokenActual,
    );
  }
}

describe('CambiarContrasenaPerfil (KAN-19 · UEB-Proyect-06)', () => {
  const cifrador = new CifradorPbkdf2();
  const reloj = { ahora: () => new Date('2026-10-10T12:00:00Z') };

  async function crearEscenario() {
    const repoUsuarios = new RepositorioDeUsuariosEnMemoria();
    const repoSesiones = new SesionesRepositoryEnMemoria();

    const hash = await cifrador.cifrar(ContrasenaPlana.crear('ClaveVieja2026*'));
    const usuario = Usuario.registrarJugador({
      id: 'usr-1',
      nombreCompleto: NombreCompleto.crear('Carlos Jugador'),
      correo: CorreoElectronico.crear('carlos@unbosque.edu.co'),
      telefono: Telefono.crear('3101234567'),
      contrasenaCifrada: hash,
      fechaDeRegistro: new Date('2026-10-01T10:00:00Z'),
    });
    await repoUsuarios.guardar(usuario);

    // Creamos 3 sesiones del usuario: una actual y dos de otros dispositivos
    await repoSesiones.crear({
      id: 'ses-1',
      usuarioId: 'usr-1',
      hashToken: 'hash-sesion-actual',
      expiraEn: '2026-10-11T12:00:00Z',
      creadoEn: '2026-10-10T10:00:00Z',
    });
    await repoSesiones.crear({
      id: 'ses-2',
      usuarioId: 'usr-1',
      hashToken: 'hash-sesion-otra-1',
      expiraEn: '2026-10-11T12:00:00Z',
      creadoEn: '2026-10-10T10:00:00Z',
    });
    await repoSesiones.crear({
      id: 'ses-3',
      usuarioId: 'usr-1',
      hashToken: 'hash-sesion-otra-2',
      expiraEn: '2026-10-11T12:00:00Z',
      creadoEn: '2026-10-10T10:00:00Z',
    });

    const casoDeUso = new CambiarContrasenaPerfil({
      repositorioDeUsuarios: repoUsuarios,
      sesionesRepository: repoSesiones,
      cifradorDeContrasenas: cifrador,
      reloj,
    });

    return { repoUsuarios, repoSesiones, casoDeUso, usuario };
  }

  it('Escenario 4: cambia la contraseña e invalida todas las demás sesiones excepto la actual', async () => {
    const { casoDeUso, repoSesiones, repoUsuarios } = await crearEscenario();

    const resultado = await casoDeUso.ejecutar(
      'usr-1',
      {
        contrasenaActual: 'ClaveVieja2026*',
        nuevaContrasena: 'NuevaClave2026*',
        confirmarContrasena: 'NuevaClave2026*',
      },
      'hash-sesion-actual',
    );

    expect(resultado.mensaje).toBe('Contraseña actualizada');

    // Verifica que solo quedó la sesión actual
    expect(repoSesiones.sesiones).toHaveLength(1);
    expect(repoSesiones.sesiones[0].hashToken).toBe('hash-sesion-actual');

    // Verifica que la nueva clave quedó guardada y funciona
    const usuarioActualizado = await repoUsuarios.buscarPorId('usr-1');
    const coincide = await cifrador.coincide(
      'NuevaClave2026*',
      usuarioActualizado!.contrasenaCifrada,
    );
    expect(coincide).toBe(true);
  });

  it('Escenario 4: rechaza si la contraseña actual no es correcta', async () => {
    const { casoDeUso, repoSesiones } = await crearEscenario();

    await expect(
      casoDeUso.ejecutar(
        'usr-1',
        {
          contrasenaActual: 'ClaveIncorrecta*',
          nuevaContrasena: 'NuevaClave2026*',
          confirmarContrasena: 'NuevaClave2026*',
        },
        'hash-sesion-actual',
      ),
    ).rejects.toThrow(ErrorContrasenaActualIncorrecta);

    // No se invalidó ninguna sesión
    expect(repoSesiones.sesiones).toHaveLength(3);
  });
});
