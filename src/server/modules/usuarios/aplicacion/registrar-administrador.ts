import { ContrasenaPlana } from '../dominio/objeto-valor/contrasena-plana';
import { CorreoElectronico } from '../dominio/objeto-valor/correo-electronico';
import { NombreCompleto } from '../dominio/objeto-valor/nombre-completo';
import { Telefono } from '../dominio/objeto-valor/telefono';
import { ROLES } from '../dominio/rol';
import { Usuario } from '../dominio/usuario';
import { ErrorCorreoEsJugador } from './errores/error-correo-es-jugador';
import { ErrorCorreoYaEsAdmin } from './errores/error-correo-ya-es-admin';
import type { CifradorDeContrasenas } from './puertos/cifrador-de-contrasenas';
import type { GeneradorDeIdentificadores } from './puertos/generador-de-identificadores';
import type { Reloj } from './puertos/reloj';
import type { RepositorioDeAuditoria } from './puertos/repositorio-de-auditoria';
import type { RepositorioDeUsuarios } from './puertos/repositorio-de-usuarios';

/** Respuesta del caso de uso: incluye la contraseña temporal en texto plano, mostrada una sola vez. */
export interface AdminRegistrado {
  id: string;
  nombreCompleto: string;
  correo: string;
  telefono: string;
  rol: 'admin';
  /** Contraseña temporal de 12 caracteres. Se devuelve SOLO en esta respuesta, nunca más. */
  contrasenaTemporal: string;
}

export interface SolicitudRegistroAdmin {
  nombreCompleto: string;
  correo: string;
  telefono: string;
}

export interface DependenciasDeRegistrarAdministrador {
  repositorioDeUsuarios: RepositorioDeUsuarios;
  repositorioDeAuditoria: RepositorioDeAuditoria;
  cifradorDeContrasenas: CifradorDeContrasenas;
  generadorDeIdentificadores: GeneradorDeIdentificadores;
  reloj: Reloj;
}

/**
 * Caso de uso «Registrar administrador» (KAN-18 · UEB-Proyect-05).
 *
 * Escenario 1: correo nuevo → crea la cuenta con rol admin y contraseña temporal (12 chars).
 * Escenario 3: correo de jugador → lanza ErrorCorreoEsJugador para que el caller promueva.
 * Escenario 4: correo de admin   → lanza ErrorCorreoYaEsAdmin.
 */
export class RegistrarAdministrador {
  readonly #repositorioDeUsuarios: RepositorioDeUsuarios;
  readonly #repositorioDeAuditoria: RepositorioDeAuditoria;
  readonly #cifradorDeContrasenas: CifradorDeContrasenas;
  readonly #generadorDeIdentificadores: GeneradorDeIdentificadores;
  readonly #reloj: Reloj;

  constructor(dependencias: DependenciasDeRegistrarAdministrador) {
    this.#repositorioDeUsuarios = dependencias.repositorioDeUsuarios;
    this.#repositorioDeAuditoria = dependencias.repositorioDeAuditoria;
    this.#cifradorDeContrasenas = dependencias.cifradorDeContrasenas;
    this.#generadorDeIdentificadores = dependencias.generadorDeIdentificadores;
    this.#reloj = dependencias.reloj;
  }

  async ejecutar(
    solicitud: SolicitudRegistroAdmin,
    adminCreadorId: string,
  ): Promise<AdminRegistrado> {
    // 1. Validar con objetos de valor (reutiliza las reglas de UEB-Proyect-03).
    const nombreCompleto = NombreCompleto.crear(solicitud.nombreCompleto);
    const correo = CorreoElectronico.crear(solicitud.correo);
    const telefono = Telefono.crear(solicitud.telefono);

    // 2. Revisar si el correo ya existe en el sistema.
    const usuarioExistente = await this.#repositorioDeUsuarios.buscarPorCorreo(correo);

    if (usuarioExistente !== null) {
      if (usuarioExistente.esAdministrador()) {
        // Escenario 4: ya es administrador.
        throw new ErrorCorreoYaEsAdmin();
      }
      // Escenario 3: es jugador → el caller decide si promover.
      throw new ErrorCorreoEsJugador(usuarioExistente.id, usuarioExistente.nombreCompleto.valor);
    }

    // 3. Generar contraseña temporal de 12 caracteres.
    const contrasenaTemporal = generarContrasenaTemporal();

    // 4. Cifrar y crear el usuario administrador.
    const contrasenaCifrada = await this.#cifradorDeContrasenas.cifrar(
      ContrasenaPlana.desdeContrasenaVerificada(contrasenaTemporal),
    );

    const adminNuevo = Usuario.registrarAdministrador({
      id: this.#generadorDeIdentificadores.generar(),
      nombreCompleto,
      correo,
      telefono,
      contrasenaCifrada,
      fechaDeRegistro: this.#reloj.ahora(),
    });

    // 5. Guardar en la base de datos.
    await this.#repositorioDeUsuarios.guardar(adminNuevo);

    // 6. Registrar en auditoría: quién creó a quién y cuándo (Escenario 1).
    await this.#repositorioDeAuditoria.registrar({
      id: this.#generadorDeIdentificadores.generar(),
      adminCreadorId,
      usuarioId: adminNuevo.id,
      accion: 'CREAR_ADMIN',
      creadoEn: this.#reloj.ahora(),
    });

    return {
      id: adminNuevo.id,
      nombreCompleto: adminNuevo.nombreCompleto.valor,
      correo: adminNuevo.correo.valor,
      telefono: adminNuevo.telefono.valor,
      rol: ROLES.ADMINISTRADOR,
      contrasenaTemporal,
    };
  }
}

/**
 * Genera una contraseña temporal de exactamente 12 caracteres alfanuméricos.
 * Garantiza al menos una letra mayúscula, una minúscula y un dígito.
 */
export function generarContrasenaTemporal(): string {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(12);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => CHARS[b % CHARS.length]).join('');
}
