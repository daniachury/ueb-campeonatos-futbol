/**
 * Contratos HTTP del registro de administradores (KAN-18 · UEB-Proyect-05).
 * Importado por el cliente y el servidor para mantenerlos alineados.
 */

export const RUTAS_API_ADMIN_USUARIOS = {
  /** POST → 201 AdminRegistrado | 409 CORREO_YA_ES_ADMIN | 409 CORREO_ES_JUGADOR */
  CREAR: '/admin/usuarios',
  /** POST → 200 AdminPromovido | 404 NO_ENCONTRADO | 409 JUGADOR_EN_TORNEO_EN_CURSO */
  PROMOVER: (id: string) => `/admin/usuarios/${id}/promover`,
  /** PATCH → 200 | 400 VALIDACION */
  CAMBIAR_CONTRASENA: '/auth/cambiar-contrasena',
} as const;

export const CODIGOS_ERROR_ADMIN = {
  /** 409 · Escenario 4: el correo ya pertenece a un admin. */
  CORREO_YA_ES_ADMIN: 'CORREO_YA_ES_ADMIN',
  /** 409 · Escenario 3: el correo pertenece a un jugador; el front debe mostrar diálogo. */
  CORREO_ES_JUGADOR: 'CORREO_ES_JUGADOR',
  /** 409 · Escenario 3: no se puede promover porque está en torneo EN_CURSO. */
  JUGADOR_EN_TORNEO_EN_CURSO: 'JUGADOR_EN_TORNEO_EN_CURSO',
  /** 403 · Escenario 2: primer ingreso; debe cambiar contraseña antes de continuar. */
  DEBE_CAMBIAR_CONTRASENA: 'DEBE_CAMBIAR_CONTRASENA',
} as const;

/** Body de POST /admin/usuarios */
export interface SolicitudRegistroAdmin {
  nombreCompleto: string;
  correo: string;
  telefono: string;
}

/** Respuesta 201 de POST /admin/usuarios — la contraseña temporal solo se entrega aquí. */
export interface AdminRegistrado {
  id: string;
  nombreCompleto: string;
  correo: string;
  telefono: string;
  rol: 'admin';
  /** Se muestra una sola vez con botón "Copiar". Nunca se vuelve a exponer. */
  contrasenaTemporal: string;
}

/** Respuesta 200 de POST /admin/usuarios/:id/promover */
export interface AdminPromovido {
  id: string;
  nombreCompleto: string;
  correo: string;
  telefono: string;
  rol: 'admin';
}

/** Detalle incluido en el 409 CORREO_ES_JUGADOR para que el front pueda llamar /promover. */
export interface DetalleCorreoEsJugador {
  jugadorId: string;
  nombreJugador: string;
}
