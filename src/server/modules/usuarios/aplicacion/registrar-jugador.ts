import type { JugadorRegistrado } from '../../../../shared/usuarios/contrato-registro-jugador';
import type { SolicitudRegistroJugador } from '../../../../shared/usuarios/esquema-registro-jugador';
import { ContrasenaPlana } from '../dominio/objeto-valor/contrasena-plana';
import { CorreoElectronico } from '../dominio/objeto-valor/correo-electronico';
import { NombreCompleto } from '../dominio/objeto-valor/nombre-completo';
import { Telefono } from '../dominio/objeto-valor/telefono';
import { ROLES } from '../dominio/rol';
import { Usuario } from '../dominio/usuario';
import { ErrorCorreoYaRegistrado } from './errores/error-correo-ya-registrado';
import type { CifradorDeContrasenas } from './puertos/cifrador-de-contrasenas';
import type { GeneradorDeIdentificadores } from './puertos/generador-de-identificadores';
import type { Reloj } from './puertos/reloj';
import type { RepositorioDeUsuarios } from './puertos/repositorio-de-usuarios';

export interface DependenciasDeRegistrarJugador {
  repositorioDeUsuarios: RepositorioDeUsuarios;
  cifradorDeContrasenas: CifradorDeContrasenas;
  generadorDeIdentificadores: GeneradorDeIdentificadores;
  reloj: Reloj;
}

/**
 * Caso de uso «Registrar jugador» (KAN-16).
 * Orquesta el registro: valida con el dominio, revisa que el correo sea único,
 * cifra la contraseña, crea el usuario y lo guarda. No sabe nada de HTTP ni de D1.
 */
export class RegistrarJugador {
  readonly #repositorioDeUsuarios: RepositorioDeUsuarios;
  readonly #cifradorDeContrasenas: CifradorDeContrasenas;
  readonly #generadorDeIdentificadores: GeneradorDeIdentificadores;
  readonly #reloj: Reloj;

  constructor(dependencias: DependenciasDeRegistrarJugador) {
    this.#repositorioDeUsuarios = dependencias.repositorioDeUsuarios;
    this.#cifradorDeContrasenas = dependencias.cifradorDeContrasenas;
    this.#generadorDeIdentificadores = dependencias.generadorDeIdentificadores;
    this.#reloj = dependencias.reloj;
  }

  async ejecutar(solicitud: SolicitudRegistroJugador): Promise<JugadorRegistrado> {
    // 1. Validar con el dominio: si algo está mal, se lanza ErrorDeValidacionDeDominio.
    const nombreCompleto = NombreCompleto.crear(solicitud.nombreCompleto);
    const correo = CorreoElectronico.crear(solicitud.correo);
    const telefono = Telefono.crear(solicitud.telefono);
    const contrasena = ContrasenaPlana.crear(solicitud.contrasena);

    // 2. El correo debe ser único (Escenario 2). Se revisa antes de cifrar, que es lo costoso.
    if (await this.#repositorioDeUsuarios.existeConCorreo(correo)) {
      throw new ErrorCorreoYaRegistrado();
    }

    // 3. Cifrar y crear el usuario. El rol no viene de la solicitud (Escenario 4).
    const contrasenaCifrada = await this.#cifradorDeContrasenas.cifrar(contrasena);
    const jugadorNuevo = Usuario.registrarJugador({
      id: this.#generadorDeIdentificadores.generar(),
      nombreCompleto,
      correo,
      telefono,
      contrasenaCifrada,
      fechaDeRegistro: this.#reloj.ahora(),
    });

    // 4. Guardar y responder sin la contraseña (Escenario 5).
    await this.#repositorioDeUsuarios.guardar(jugadorNuevo);
    return convertirEnJugadorRegistrado(jugadorNuevo);
  }
}

function convertirEnJugadorRegistrado(usuario: Usuario): JugadorRegistrado {
  if (!usuario.esJugador()) {
    throw new Error('El registro público solo puede crear jugadores');
  }
  return {
    id: usuario.id,
    nombreCompleto: usuario.nombreCompleto.valor,
    correo: usuario.correo.valor,
    telefono: usuario.telefono.valor,
    rol: ROLES.JUGADOR,
  };
}
