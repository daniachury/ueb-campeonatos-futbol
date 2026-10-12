import { ROLES, type Rol } from './rol';
import type { ContrasenaCifrada } from './objeto-valor/contrasena-cifrada';
import type { CorreoElectronico } from './objeto-valor/correo-electronico';
import type { NombreCompleto } from './objeto-valor/nombre-completo';
import type { Telefono } from './objeto-valor/telefono';

export interface PropiedadesDelUsuario {
  id: string;
  nombreCompleto: NombreCompleto;
  correo: CorreoElectronico;
  telefono: Telefono;
  contrasenaCifrada: ContrasenaCifrada;
  rol: Rol;
  activo: boolean;
  /** KAN-18 · Escenario 2: true para admins creados por otro admin (primer ingreso). */
  debeCambiarContrasena: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
}

export interface DatosParaRegistrarJugador {
  id: string;
  nombreCompleto: NombreCompleto;
  correo: CorreoElectronico;
  telefono: Telefono;
  contrasenaCifrada: ContrasenaCifrada;
  fechaDeRegistro: Date;
}

/** KAN-18 · Datos necesarios para crear un administrador desde el panel de admin. */
export interface DatosParaRegistrarAdministrador {
  id: string;
  nombreCompleto: NombreCompleto;
  correo: CorreoElectronico;
  telefono: Telefono;
  contrasenaCifrada: ContrasenaCifrada;
  fechaDeRegistro: Date;
}

/**
 * Entidad Usuario: tiene identidad propia (id) y reúne objetos de valor ya validados.
 * Si existe un Usuario, sus datos son válidos: no hay forma de construir uno "a medias".
 */
export class Usuario {
  readonly id: string;
  readonly nombreCompleto: NombreCompleto;
  readonly correo: CorreoElectronico;
  readonly telefono: Telefono;
  readonly contrasenaCifrada: ContrasenaCifrada;
  readonly rol: Rol;
  readonly activo: boolean;
  /** KAN-18 · Escenario 2: bloquea rutas hasta que el admin cambie su contraseña temporal. */
  readonly debeCambiarContrasena: boolean;
  readonly creadoEn: Date;
  readonly actualizadoEn: Date;

  private constructor(propiedades: PropiedadesDelUsuario) {
    this.id = propiedades.id;
    this.nombreCompleto = propiedades.nombreCompleto;
    this.correo = propiedades.correo;
    this.telefono = propiedades.telefono;
    this.contrasenaCifrada = propiedades.contrasenaCifrada;
    this.rol = propiedades.rol;
    this.activo = propiedades.activo;
    this.debeCambiarContrasena = propiedades.debeCambiarContrasena;
    this.creadoEn = propiedades.creadoEn;
    this.actualizadoEn = propiedades.actualizadoEn;
  }

  /**
   * Única forma de crear un usuario desde el registro público.
   * Fíjate que NO recibe rol: un jugador registrado siempre nace como Jugador.
   * Así el Escenario 4 de KAN-16 (intentar registrarse como admin) se cumple por diseño.
   */
  static registrarJugador(datos: DatosParaRegistrarJugador): Usuario {
    return new Usuario({
      id: datos.id,
      nombreCompleto: datos.nombreCompleto,
      correo: datos.correo,
      telefono: datos.telefono,
      contrasenaCifrada: datos.contrasenaCifrada,
      rol: ROLES.JUGADOR,
      activo: true,
      debeCambiarContrasena: false,
      creadoEn: datos.fechaDeRegistro,
      actualizadoEn: datos.fechaDeRegistro,
    });
  }

  /**
   * KAN-18 · Crea un administrador desde el panel de admin.
   * Nace con debeCambiarContrasena=true para forzar el cambio en el primer ingreso.
   */
  static registrarAdministrador(datos: DatosParaRegistrarAdministrador): Usuario {
    return new Usuario({
      id: datos.id,
      nombreCompleto: datos.nombreCompleto,
      correo: datos.correo,
      telefono: datos.telefono,
      contrasenaCifrada: datos.contrasenaCifrada,
      rol: ROLES.ADMINISTRADOR,
      activo: true,
      debeCambiarContrasena: true,
      creadoEn: datos.fechaDeRegistro,
      actualizadoEn: datos.fechaDeRegistro,
    });
  }

  /**
   * KAN-18 · Promueve este usuario (jugador) a administrador.
   * Devuelve una nueva instancia inmutable con el rol cambiado.
   */
  promoverAAdministrador(fecha: Date): Usuario {
    return new Usuario({
      id: this.id,
      nombreCompleto: this.nombreCompleto,
      correo: this.correo,
      telefono: this.telefono,
      contrasenaCifrada: this.contrasenaCifrada,
      rol: ROLES.ADMINISTRADOR,
      activo: this.activo,
      debeCambiarContrasena: this.debeCambiarContrasena,
      creadoEn: this.creadoEn,
      actualizadoEn: fecha,
    });
  }

  /**
   * Vuelve a armar un usuario que ya existe (por ejemplo, leído de la base de datos).
   * Recibe objetos de valor ya validados, así que no puede crear un usuario inválido.
   */
  static reconstituir(propiedades: PropiedadesDelUsuario): Usuario {
    return new Usuario(propiedades);
  }

  esJugador(): boolean {
    return this.rol === ROLES.JUGADOR;
  }

  esAdministrador(): boolean {
    return this.rol === ROLES.ADMINISTRADOR;
  }
}
