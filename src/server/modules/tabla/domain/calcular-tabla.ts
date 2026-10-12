export interface EquipoTabla { equipoId: string; equipo: string; partidosJugados: number; ganados: number; empatados: number; perdidos: number; golesFavor: number; golesContra: number; puntos: number; }

export function calcularTabla(filas: EquipoTabla[]): EquipoTabla[] {
  return [...filas].sort((a, b) => b.puntos - a.puntos || b.golesFavor - b.golesContra - (a.golesFavor - a.golesContra) || b.golesFavor - a.golesFavor || a.equipo.localeCompare(b.equipo));
}
