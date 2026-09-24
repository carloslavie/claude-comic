// Medidas de cuadro y paspartú. Lógica pura, todas las medidas en mm.
import { getOrientation } from './orientation.js';

// Cada medida guarda su lado corto y su lado largo; la orientación decide cuál es el ancho.
// El orden de inserción es el orden del desplegable.
export const FRAME_SIZES = {
  '10x15': { id: '10x15', label: '10 × 15 cm', short: 100, long: 150 },
  '13x18': { id: '13x18', label: '13 × 18 cm', short: 130, long: 180 },
  '15x20': { id: '15x20', label: '15 × 20 cm', short: 150, long: 200 },
  '20x25': { id: '20x25', label: '20 × 25 cm', short: 200, long: 250 },
  '20x30': { id: '20x30', label: '20 × 30 cm', short: 200, long: 300 },
  a4: { id: 'a4', label: 'A4 (21 × 29,7 cm)', short: 210, long: 297 },
  custom: { id: 'custom', label: 'Personalizada' }, // usa frameState.customSize
};
export const DEFAULT_FRAME_SIZE = '13x18';

export const CUSTOM_SIZE_LIMITS = { min: 50, max: 400, maxShort: 270 }; // mm

// El orden de inserción es el orden del desplegable.
export const MATS = {
  none: { id: 'none', label: 'Ninguno', width: 0 },
  fino: { id: 'fino', label: 'Fino (1 cm)', width: 10 },
  medio: { id: 'medio', label: 'Medio (2 cm)', width: 20 },
  ancho: { id: 'ancho', label: 'Ancho (4 cm)', width: 40 },
};
export const DEFAULT_MAT = 'none';
export const DEFAULT_MAT_COLOR = '#ffffff';
export const MIN_PHOTO_MM = 20; // lado corto mínimo de la foto dentro del paspartú

/**
 * Orientación inicial del cuadro de una foto: horizontal si la foto es apaisada,
 * vertical si es vertical o cuadrada.
 * @param {number} imageW
 * @param {number} imageH
 * @returns {'portrait' | 'landscape'}
 */
export function frameOrientation(imageW, imageH) {
  return getOrientation(imageW, imageH) === 'landscape' ? 'landscape' : 'portrait';
}

/**
 * Lados de la medida elegida. 'custom' usa `customSize`; una clave desconocida usa la medida por defecto.
 * @param {string} sizeId clave de FRAME_SIZES
 * @param {{short: number, long: number}} customSize mm
 * @returns {{short: number, long: number}}
 */
export function resolveFrameSize(sizeId, customSize) {
  if (sizeId === 'custom') return { short: customSize.short, long: customSize.long };
  const size = Object.hasOwn(FRAME_SIZES, sizeId) ? FRAME_SIZES[sizeId] : FRAME_SIZES[DEFAULT_FRAME_SIZE];
  return { short: size.short, long: size.long };
}

/**
 * Ancho y alto del cuadro según su orientación.
 * @param {{short: number, long: number}} size mm
 * @param {'portrait' | 'landscape'} orientation
 * @returns {{width: number, height: number}}
 */
export function frameDimensions({ short, long }, orientation) {
  return orientation === 'landscape' ? { width: long, height: short } : { width: short, height: long };
}

/**
 * Valida una medida personalizada y la ordena en lado corto y largo, redondeada a mm enteros.
 * @param {number} aMm
 * @param {number} bMm
 * @returns {{short: number, long: number} | null} null si algún lado no es un número o está fuera de rango
 */
export function normalizeCustomSize(aMm, bMm) {
  if (!Number.isFinite(aMm) || !Number.isFinite(bMm)) return null;
  const a = Math.round(aMm);
  const b = Math.round(bMm);
  const { min, max, maxShort } = CUSTOM_SIZE_LIMITS;
  if (a < min || a > max || b < min || b > max) return null;
  const short = Math.min(a, b);
  if (short > maxShort) return null;
  return { short, long: Math.max(a, b) };
}

/**
 * Grosor real del paspartú: se achica si no deja MIN_PHOTO_MM de foto en el lado corto.
 * @param {string} matId clave de MATS
 * @param {number} width mm
 * @param {number} height mm
 * @returns {number} mm
 */
export function effectiveMat(matId, width, height) {
  if (!Object.hasOwn(MATS, matId)) return 0;
  const max = (Math.min(width, height) - MIN_PHOTO_MM) / 2;
  return Math.max(0, Math.min(MATS[matId].width, max));
}

/**
 * Área de la foto dentro del cuadro, descontando el paspartú.
 * @param {number} width mm
 * @param {number} height mm
 * @param {number} mat mm
 * @returns {{x: number, y: number, width: number, height: number}}
 */
export function photoArea(width, height, mat) {
  return { x: mat, y: mat, width: width - 2 * mat, height: height - 2 * mat };
}
