import type { Rol } from './constants';

/** Usuario autenticado que viaja en el contexto de cada petición (UEB-Proyect-04). */
export interface UsuarioSesion {
  id: string;
  nombre: string;
  rol: Rol;
  /** KAN-18 · Escenario 2: true si el admin debe cambiar su contraseña temporal. */
  debeCambiarContrasena: boolean;
}

export * from './usuarios/contrato-perfil';
