/**
 * Configuración centralizada de migraciones aplicadas e inmutables (KAN / Cloudflare D1).
 * Fuente única de verdad (DRY) para hooks, validadores y recordatorios.
 */

const ULTIMA_MIGRACION_APLICADA = 12;

/**
 * Retorna true si la ruta corresponde a una migración ya aplicada y protegida.
 * @param {string} ruta - Ruta relativa o absoluta del archivo.
 */
function esMigracionProtegida(ruta) {
  if (!ruta) return false;
  const normalizada = ruta.replace(/\\/g, '/');
  const match = normalizada.match(/\/migrations\/0*(\d+)_[^/]+\.sql$/i);
  if (!match) return false;
  const num = parseInt(match[1], 10);
  return num >= 1 && num <= ULTIMA_MIGRACION_APLICADA;
}

const DESCRIPCION_MIGRACIONES_PROTEGIDAS = `0001_ a 00${ULTIMA_MIGRACION_APLICADA}_`;

module.exports = {
  ULTIMA_MIGRACION_APLICADA,
  esMigracionProtegida,
  DESCRIPCION_MIGRACIONES_PROTEGIDAS,
};
