export interface EquipoDelTorneo {
  torneoId: string;
  equipoId: string;
  usuarioIds: string[];
}

export function puedeUnirseAlEquipo(usuarioId: string, torneoId: string, equipos: EquipoDelTorneo[]): boolean {
  return !equipos.some((equipo) => equipo.torneoId === torneoId && equipo.usuarioIds.includes(usuarioId));
}
