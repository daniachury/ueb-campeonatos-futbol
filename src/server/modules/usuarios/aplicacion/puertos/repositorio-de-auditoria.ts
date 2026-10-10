/**
 * Puerto del repositorio de auditoría de administradores (KAN-18 · Escenario 1).
 * Registra quién creó o promovió a quién y cuándo.
 */
export interface RegistroDeAuditoria {
  id: string;
  adminCreadorId: string;
  usuarioId: string;
  accion: 'CREAR_ADMIN' | 'PROMOVER_JUGADOR';
  creadoEn: Date;
}

export interface RepositorioDeAuditoria {
  registrar(entrada: RegistroDeAuditoria): Promise<void>;
}
