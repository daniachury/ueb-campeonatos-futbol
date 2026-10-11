import { REGLAS } from '../constants';

export const ESTADOS_PARTIDO = [
  'POR_PROGRAMAR',
  'PROGRAMADO',
  'JUGADO',
  'CANCELADO',
] as const;
export type EstadoPartido = (typeof ESTADOS_PARTIDO)[number];

export const ETIQUETAS_ESTADO_PARTIDO: Record<EstadoPartido, string> = {
  POR_PROGRAMAR: 'Por programar',
  PROGRAMADO: 'Programado',
  JUGADO: 'Jugado',
  CANCELADO: 'Cancelado',
};

export interface ResumenEstimadoFixture {
  valido: boolean;
  equiposAprobados: number;
  totalFechas: number;
  partidosPorFecha: number;
  totalPartidos: number;
  tieneDescanso: boolean;
  mensaje?: string;
}

export function estimarFixture(equiposAprobados: number): ResumenEstimadoFixture {
  if (equiposAprobados < REGLAS.EQUIPOS_POR_TORNEO_MIN) {
    return {
      valido: false,
      equiposAprobados,
      totalFechas: 0,
      partidosPorFecha: 0,
      totalPartidos: 0,
      tieneDescanso: false,
      mensaje: `Se necesitan al menos ${REGLAS.EQUIPOS_POR_TORNEO_MIN} equipos aprobados para sortear`,
    };
  }

  const esImpar = equiposAprobados % 2 !== 0;
  const totalFechas = esImpar ? equiposAprobados : equiposAprobados - 1;
  const partidosPorFecha = Math.floor(equiposAprobados / 2);
  const totalPartidos = (equiposAprobados * (equiposAprobados - 1)) / 2;

  return {
    valido: true,
    equiposAprobados,
    totalFechas,
    partidosPorFecha,
    totalPartidos,
    tieneDescanso: esImpar,
  };
}

export interface EquipoFixtureResumen {
  id: string;
  nombre: string;
  color?: string | null;
}

export interface PartidoFixtureResumen {
  id: string;
  fechaId: string;
  torneoId: string;
  local: EquipoFixtureResumen;
  visitante: EquipoFixtureResumen;
  estado: EstadoPartido;
  golesLocal: number | null;
  golesVisitante: number | null;
  fechaHora: string | null;
  cancha: string | null;
}

export interface FechaFixtureResumen {
  id: string;
  torneoId: string;
  numero: number;
  equipoDescansa: EquipoFixtureResumen | null;
  partidos: PartidoFixtureResumen[];
}

export interface FixtureTorneoResponse {
  torneoId: string;
  totalEquipos: number;
  totalFechas: number;
  totalPartidos: number;
  puedeRepetirSorteo: boolean;
  fechas: FechaFixtureResumen[];
}
