import type {
  SolicitudInicioDeSesion,
  UsuarioAutenticado,
} from '@shared/usuarios/contrato-inicio-de-sesion';

/** Lo que responde el servidor al preguntar por la cookie de sesión. */
export type ResultadoDeConsultaDeSesion =
  | { estado: 'activa'; usuario: UsuarioAutenticado }
  | { estado: 'expirada' }
  | { estado: 'sin-sesion' };

/** Por qué no se pudo iniciar sesión (KAN-17 · Escenarios 3, 4 y 5). */
export type MotivoDelRechazo =
  'credenciales-incorrectas' | 'demasiados-intentos' | 'cuenta-desactivada';

/** El servidor rechazó el inicio de sesión. El mensaje es el de Jira, listo para mostrar. */
export class ErrorDeInicioDeSesion extends Error {
  readonly motivo: MotivoDelRechazo;

  constructor(motivo: MotivoDelRechazo, mensaje: string) {
    super(mensaje);
    this.name = 'ErrorDeInicioDeSesion';
    this.motivo = motivo;
  }
}

/**
 * Puerto: lo que la app necesita para manejar la sesión, sin decir CÓMO se hace.
 * Lo cumple ServicioDeSesionHttp; las pruebas usan uno falso.
 * El token vive en una cookie HttpOnly: el navegador lo envía solo y JavaScript no lo puede leer.
 */
export interface ServicioDeSesion {
  consultarSesionActual(): Promise<ResultadoDeConsultaDeSesion>;
  iniciarSesion(credenciales: SolicitudInicioDeSesion): Promise<UsuarioAutenticado>;
  cerrarSesion(): Promise<void>;
}
