// Colores de fondo de página: paleta predefinida y resolución global/por página.

export const DEFAULT_PAGE_COLOR = '#ffffff';

export const PALETTE = [
  { name: 'Blanco', value: '#ffffff' },
  { name: 'Negro', value: '#111111' },
  { name: 'Amarillo', value: '#ffd23f' },
  { name: 'Rojo', value: '#e63946' },
  { name: 'Azul', value: '#1d70b8' },
  { name: 'Verde', value: '#2a9d8f' },
  { name: 'Naranja', value: '#f4a261' },
  { name: 'Crema', value: '#f5ecd7' },
];

/**
 * Color de fondo de la página `index`: su color propio si tiene, o el global.
 * @param {number} index índice de página, 0-based
 * @param {string} pageColor color global '#rrggbb'
 * @param {Record<number, string>} overrides colores propios por índice de página
 * @returns {string}
 */
export function resolvePageColor(index, pageColor, overrides) {
  return Object.hasOwn(overrides, index) ? overrides[index] : pageColor;
}

/**
 * Copia de `overrides` sin los índices de páginas que ya no existen (>= pageCount).
 * @param {Record<number, string>} overrides
 * @param {number} pageCount
 * @returns {Record<number, string>}
 */
export function prunePageColorOverrides(overrides, pageCount) {
  return Object.fromEntries(Object.entries(overrides).filter(([index]) => Number(index) < pageCount));
}
