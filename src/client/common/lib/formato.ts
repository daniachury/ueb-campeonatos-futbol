// Las fechas sin hora (YYYY-MM-DD) se interpretan en UTC para que no "retrocedan" un día
// al mostrarse en Colombia (UTC-5).
const formatoFecha = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** "2026-11-07" → "7 de nov de 2026". Si la fecha no es válida, la devuelve tal cual. */
export function formatearFecha(fechaIso: string): string {
  const fecha = new Date(`${fechaIso}T00:00:00Z`);
  return Number.isNaN(fecha.getTime()) ? fechaIso : formatoFecha.format(fecha);
}
