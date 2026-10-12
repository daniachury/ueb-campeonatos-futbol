/**
 * Modelos del dominio de las pruebas: lo que una prueba sabe de los datos que prepara.
 * No dependen de Playwright, de la base de datos ni de las pantallas.
 */

export type Rol = 'jugador' | 'admin';

export interface UsuarioDePrueba {
  id: string;
  nombreCompleto: string;
  correo: string;
  telefono: string;
  /** La contraseña en texto plano: la prueba la escribe en el formulario. */
  contrasena: string;
  rol: Rol;
  activo: boolean;
  debeCambiarContrasena: boolean;
}

export type EstadoDeTorneo =
  'BORRADOR' | 'INSCRIPCIONES_ABIERTAS' | 'EN_CURSO' | 'FINALIZADO' | 'CANCELADO';

export interface TorneoDePrueba {
  id: string;
  nombre: string;
  fechaInicio: string;
  cupo: number;
  estado: EstadoDeTorneo;
}

export interface EquipoDePrueba {
  id: string;
  nombre: string;
  capitanId: string | null;
  jugadorIds: string[];
}

export type EstadoDeInscripcion = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'RETIRADO' | 'CANCELADO';

export interface InscripcionDePrueba {
  id: string;
  torneoId: string;
  equipoId: string;
  estado: EstadoDeInscripcion;
}
