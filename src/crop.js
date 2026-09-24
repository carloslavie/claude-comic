// Encuadre de una foto dentro del área de la foto de un cuadro. Lógica pura.
// El encuadre es { zoom, centerX, centerY }: zoom de ZOOM_MIN a ZOOM_MAX y el centro
// de la parte visible en fracciones 0..1 de la foto.

export const DEFAULT_CROP = { zoom: 1, centerX: 0.5, centerY: 0.5 };
export const ZOOM_MIN = 1;
export const ZOOM_MAX = 3;
export const LOW_DPI = 150;

const MM_PER_INCH = 25.4;

/**
 * Rectángulo de la foto que se ve en el área. A zoom 1 es el recorte cover; a zoom z,
 * el ancho y el alto se dividen por z. El rectángulo nunca sale de la foto.
 * @param {number} imageW px
 * @param {number} imageH px
 * @param {number} photoW ancho del área de la foto (solo importa la proporción)
 * @param {number} photoH alto del área de la foto
 * @param {{zoom: number, centerX: number, centerY: number}} crop
 * @returns {{sx: number, sy: number, sw: number, sh: number}} px
 */
export function cropRect(imageW, imageH, photoW, photoH, crop) {
  const zoom = clamp(crop.zoom, ZOOM_MIN, ZOOM_MAX);
  const aspect = photoW / photoH;
  let sw;
  let sh;
  if (imageW / imageH > aspect) {
    sh = imageH;
    sw = imageH * aspect;
  } else {
    sw = imageW;
    sh = imageW / aspect;
  }
  sw /= zoom;
  sh /= zoom;
  const sx = clamp(crop.centerX * imageW - sw / 2, 0, imageW - sw);
  const sy = clamp(crop.centerY * imageH - sh / 2, 0, imageH - sh);
  return { sx, sy, sw, sh };
}

/**
 * El mismo encuadre con el zoom limitado y el centro ajustado para que coincida con cropRect.
 * @returns {{zoom: number, centerX: number, centerY: number}}
 */
export function clampCrop(imageW, imageH, photoW, photoH, crop) {
  const { sx, sy, sw, sh } = cropRect(imageW, imageH, photoW, photoH, crop);
  return {
    zoom: clamp(crop.zoom, ZOOM_MIN, ZOOM_MAX),
    centerX: (sx + sw / 2) / imageW,
    centerY: (sy + sh / 2) / imageH,
  };
}

/**
 * Encuadre después de arrastrar. La foto sigue al puntero: arrastrar a la derecha
 * mueve el centro hacia la izquierda.
 * @param {number} dx desplazamiento en fracciones del ancho del área de la foto en pantalla
 * @param {number} dy desplazamiento en fracciones del alto del área de la foto en pantalla
 * @returns {{zoom: number, centerX: number, centerY: number}}
 */
export function panCrop(imageW, imageH, photoW, photoH, crop, dx, dy) {
  const current = clampCrop(imageW, imageH, photoW, photoH, crop);
  const { sw, sh } = cropRect(imageW, imageH, photoW, photoH, current);
  return clampCrop(imageW, imageH, photoW, photoH, {
    zoom: current.zoom,
    centerX: current.centerX - (dx * sw) / imageW,
    centerY: current.centerY - (dy * sh) / imageH,
  });
}

/**
 * Resolución de impresión de la parte visible de la foto.
 * @param {number} photoW ancho del área de la foto en mm
 * @returns {number} DPI
 */
export function cropDpi(imageW, imageH, photoW, photoH, crop) {
  const { sw } = cropRect(imageW, imageH, photoW, photoH, crop);
  return sw / (photoW / MM_PER_INCH);
}

/**
 * @param {number} dpi
 */
export function isLowResolution(dpi) {
  return dpi < LOW_DPI;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
