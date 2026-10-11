import { describe, expect, it } from 'vitest';
import { ContrasenaCifrada } from '../dominio/objeto-valor/contrasena-cifrada';
import { ContrasenaPlana } from '../dominio/objeto-valor/contrasena-plana';
import { CorreoElectronico } from '../dominio/objeto-valor/correo-electronico';
import { NombreCompleto } from '../dominio/objeto-valor/nombre-completo';
import { Telefono } from '../dominio/objeto-valor/telefono';
import { Usuario } from '../dominio/usuario';
import { CifradorPbkdf2 } from '../infraestructura/cifrador-pbkdf2';
import { ActualizarPerfil } from './actualizar-perfil';
import { ErrorContrasenaActualIncorrecta } from './errores/error-contrasena-actual-incorrecta';
import { ErrorCorreoYaRegistrado } from './errores/error-correo-ya-registrado';
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
    const usuario = await this.buscarPorId(usuarioId);
    if (usuario) {
      this.usuarios = this.usuarios.map((u) =>
        u.id === usuarioId
          ? Usuario.reconstituir({
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
            })
          : u,
      );
    }
  }

  async actualizarPerfil(
    usuarioId: string,
    datos: { nombreCompleto?: string; correo?: string; telefono?: string },
    fecha: Date,
  ): Promise<void> {
    this.usuarios = this.usuarios.map((u) => {
      if (u.id !== usuarioId) return u;
      return Usuario.reconstituir({
        id: u.id,
        nombreCompleto: datos.nombreCompleto
          ? NombreCompleto.crear(datos.nombreCompleto)
          : u.nombreCompleto,
        correo: datos.correo ? CorreoElectronico.crear(datos.correo) : u.correo,
        telefono: datos.telefono ? Telefono.crear(datos.telefono) : u.telefono,
        contrasenaCifrada: u.contrasenaCifrada,
        rol: u.rol,
        activo: u.activo,
        debeCambiarContrasena: u.debeCambiarContrasena,
        creadoEn: u.creadoEn,
        actualizadoEn: fecha,
      });
    });
  }
}

describe('ActualizarPerfil (KAN-19 · UEB-Proyect-06)', () => {
  const cifrador = new CifradorPbkdf2();
  const reloj = { ahora: () => new Date('2026-10-10T12:00:00Z') };

  async function crearEscenario() {
    const repo = new RepositorioDeUsuariosEnMemoria();
    const hash = await cifrador.cifrar(ContrasenaPlana.crear('ClaveSegura2026*'));
    const usuario = Usuario.registrarJugador({
      id: 'usr-1',
      nombreCompleto: NombreCompleto.crear('Carlos Jugador'),
      correo: CorreoElectronico.crear('carlos@unbosque.edu.co'),
      telefono: Telefono.crear('3101234567'),
      contrasenaCifrada: hash,
      fechaDeRegistro: new Date('2026-10-01T10:00:00Z'),
    });
    await repo.guardar(usuario);

    const casoDeUso = new ActualizarPerfil({
      repositorioDeUsuarios: repo,
      cifradorDeContrasenas: cifrador,
      reloj,
    });

    return { repo, casoDeUso, usuario };
  }

  it('Escenario 1: actualiza nombre y teléfono sin requerir contraseña actual', async () => {
    const { casoDeUso } = await crearEscenario();

    const resultado = await casoDeUso.ejecutar('usr-1', {
      nombreCompleto: 'Carlos Perez',
      telefono: '3109876543',
    });

    expect(resultado.nombreCompleto).toBe('Carlos Perez');
    expect(resultado.telefono).toBe('3109876543');
    expect(resultado.correo).toBe('carlos@unbosque.edu.co');
  });

  it('Escenario 2: actualiza el correo cuando la contraseña actual es correcta', async () => {
    const { casoDeUso } = await crearEscenario();

    const resultado = await casoDeUso.ejecutar('usr-1', {
      correo: 'carlos.nuevo@unbosque.edu.co',
      contrasenaActual: 'ClaveSegura2026*',
    });

    expect(resultado.correo).toBe('carlos.nuevo@unbosque.edu.co');
  });

  it('Escenario 2: rechaza con ErrorContrasenaActualIncorrecta si la clave actual es errónea', async () => {
    const { casoDeUso } = await crearEscenario();

    await expect(
      casoDeUso.ejecutar('usr-1', {
        correo: 'carlos.nuevo@unbosque.edu.co',
        contrasenaActual: 'ClaveIncorrecta*',
      }),
    ).rejects.toThrow(ErrorContrasenaActualIncorrecta);
  });

  it('Escenario 3: rechaza con ErrorCorreoYaRegistrado si el correo ya está en uso', async () => {
    const { repo, casoDeUso } = await crearEscenario();

    const hash = await cifrador.cifrar(ContrasenaPlana.crear('OtraClave123*'));
    const otro = Usuario.registrarJugador({
      id: 'usr-2',
      nombreCompleto: NombreCompleto.crear('Laura Gomez'),
      correo: CorreoElectronico.crear('laura@unbosque.edu.co'),
      telefono: Telefono.crear('3159998877'),
      contrasenaCifrada: hash,
      fechaDeRegistro: new Date('2026-10-02T10:00:00Z'),
    });
    await repo.guardar(otro);

    await expect(
      casoDeUso.ejecutar('usr-1', {
        correo: 'laura@unbosque.edu.co',
        contrasenaActual: 'ClaveSegura2026*',
      }),
    ).rejects.toThrow(ErrorCorreoYaRegistrado);
  });
});
