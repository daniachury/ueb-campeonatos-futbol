const NOMBRES_DE_LOS_DIAS = [
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
  'domingo',
];
const MESES_ABREVIADOS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

export interface DiaDeLaSemana {
  /** Clave estable para listas y selección: AAAA-MM-DD en la hora local. */
  clave: string;
  /** "L", "M", "M", "J"… como en el calendario del diseño. */
  inicial: string;
  nombre: string;
  numero: number;
  mes: number;
}

/** Los siete días, de lunes a domingo, de la semana que contiene `fecha`. */
export function obtenerDiasDeLaSemana(fecha: Date): DiaDeLaSemana[] {
  const diasDesdeElLunes = (fecha.getDay() + 6) % 7;
  const lunes = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() - diasDesdeElLunes);

  return NOMBRES_DE_LOS_DIAS.map((nombre, posicion) => {
    const dia = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + posicion);
    return {
      clave: convertirEnClave(dia),
      inicial: nombre.charAt(0).toUpperCase(),
      nombre,
      numero: dia.getDate(),
      mes: dia.getMonth(),
    };
  });
}

/** "12 al 18 de oct", o "29 de sep al 5 de oct" si la semana cruza de mes. */
export function describirRangoDeLaSemana(dias: readonly DiaDeLaSemana[]): string {
  const primero = dias[0];
  const ultimo = dias[dias.length - 1];
  if (!primero || !ultimo) return '';

  const mesFinal = MESES_ABREVIADOS[ultimo.mes];
  if (primero.mes === ultimo.mes) {
    return `${primero.numero} al ${ultimo.numero} de ${mesFinal}`;
  }
  return `${primero.numero} de ${MESES_ABREVIADOS[primero.mes]} al ${ultimo.numero} de ${mesFinal}`;
}

export function convertirEnClave(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}
