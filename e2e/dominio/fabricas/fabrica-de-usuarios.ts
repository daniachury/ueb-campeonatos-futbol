import { nuevoId, sufijoEnLetras, sufijoUnico } from '../identificadores';
import type { Rol, UsuarioDePrueba } from '../modelos';

/** Contraseña que cumple la política de la app: 8+ caracteres con letras y números. */
export const CONTRASENA_POR_DEFECTO = 'Golazo2026';

/**
 * Builder de usuarios de prueba. Cada usuario nace válido y con correo único;
 * la prueba solo cambia lo que le importa:
 *
 *   const laura = unJugador().conNombre('Laura Gómez').construir();
 */
export class ConstructorDeUsuario {
  #usuario: UsuarioDePrueba;

  constructor(rol: Rol) {
    const sufijo = sufijoUnico();
    this.#usuario = {
      id: nuevoId('usuario-e2e'),
      nombreCompleto: `${rol === 'admin' ? 'Admin' : 'Jugador'} Prueba ${sufijoEnLetras()}`,
      correo: `${rol}.${sufijo}@e2e.ueb.test`,
      telefono: `300${Math.floor(1_000_000 + Math.random() * 8_999_999)}`,
      contrasena: CONTRASENA_POR_DEFECTO,
      rol,
      activo: true,
      debeCambiarContrasena: false,
    };
  }

  conNombre(nombreCompleto: string): this {
    this.#usuario = { ...this.#usuario, nombreCompleto };
    return this;
  }

  conCorreo(correo: string): this {
    this.#usuario = { ...this.#usuario, correo };
    return this;
  }

  conContrasena(contrasena: string): this {
    this.#usuario = { ...this.#usuario, contrasena };
    return this;
  }

  desactivado(): this {
    this.#usuario = { ...this.#usuario, activo: false };
    return this;
  }

  /** Administrador creado por otro admin: debe cambiar la contraseña al entrar (KAN-18). */
  conCambioDeContrasenaPendiente(): this {
    this.#usuario = { ...this.#usuario, debeCambiarContrasena: true };
    return this;
  }

  construir(): UsuarioDePrueba {
    return { ...this.#usuario };
  }
}

export const unJugador = () => new ConstructorDeUsuario('jugador');
export const unAdministrador = () => new ConstructorDeUsuario('admin');
