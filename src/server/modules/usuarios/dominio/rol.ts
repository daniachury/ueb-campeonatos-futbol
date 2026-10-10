/**
 * Roles del MVP. Se usa un objeto `as const` en lugar de `enum`:
 * produce JavaScript simple y el tipo Rol se deriva automáticamente de sus valores.
 */
export const ROLES = {
  JUGADOR: 'jugador',
  ADMINISTRADOR: 'admin',
} as const;

export type Rol = (typeof ROLES)[keyof typeof ROLES];
