// Umbrales de relación ancho/alto para clasificar una imagen.
const LANDSCAPE_MIN_RATIO = 1.2;
const PORTRAIT_MAX_RATIO = 0.83;

/**
 * Clasifica una imagen según su relación ancho/alto.
 * @param {number} width
 * @param {number} height
 * @returns {'landscape' | 'portrait' | 'square'}
 */
export function getOrientation(width, height) {
  const ratio = width / height;
  if (ratio > LANDSCAPE_MIN_RATIO) return 'landscape';
  if (ratio < PORTRAIT_MAX_RATIO) return 'portrait';
  return 'square';
}
