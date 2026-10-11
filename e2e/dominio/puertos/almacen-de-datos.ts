import type {
  EquipoDePrueba,
  EstadoDeInscripcion,
  EstadoDeTorneo,
  InscripcionDePrueba,
  TorneoDePrueba,
  UsuarioDePrueba,
} from '../modelos';

/**
 * Puerto: lo que los escenarios necesitan guardar y consultar, sin decir dónde.
 * Lo implementa la infraestructura (hoy, la D1 local de las pruebas).
 *
 * Preparar datos por aquí y no por la interfaz deja que cada prueba ejercite en pantalla
 * solo el flujo que verifica, y respeta el límite de registros por minuto de la API.
 */
export interface AlmacenDeDatosDePrueba {
  guardarUsuario(usuario: UsuarioDePrueba): Promise<void>;
  guardarTorneo(torneo: TorneoDePrueba): Promise<void>;
  guardarEquipo(equipo: EquipoDePrueba): Promise<void>;
  guardarInscripcion(inscripcion: InscripcionDePrueba): Promise<void>;

  buscarUsuarioPorCorreo(correo: string): Promise<UsuarioGuardado | null>;
  estadoDelTorneo(torneoId: string): Promise<EstadoDeTorneo | null>;
  estadoDeLaInscripcion(inscripcionId: string): Promise<EstadoDeInscripcion | null>;
  cantidadDePartidos(torneoId: string): Promise<number>;
}

/** Lo que la base guarda de un usuario y una prueba puede querer verificar. */
export interface UsuarioGuardado {
  id: string;
  nombreCompleto: string;
  telefono: string;
  rol: UsuarioDePrueba['rol'];
  hashDeContrasena: string;
  debeCambiarContrasena: boolean;
}
