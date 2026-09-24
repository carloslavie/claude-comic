// Formas, tamaños, bordes y copias de los stickers. Lógica pura, todas las medidas en mm.
// Los stickers son siempre cuadrados (el círculo se inscribe en el cuadrado): no tienen orientación.

// El orden de inserción es el orden del desplegable.
export const STICKER_SHAPES = {
  circle: { id: 'circle', label: 'Círculo' },
  square: { id: 'square', label: 'Cuadrado' },
  rounded: { id: 'rounded', label: 'Cuadrado redondeado' },
};
export const DEFAULT_STICKER_SHAPE = 'circle';
export const ROUNDED_RADIUS = 0.15; // fracción del lado

// El orden de inserción es el orden del desplegable. Claves no numéricas para
// que JavaScript no las reordene.
export const STICKER_SIZES = {
  '3cm': { id: '3cm', label: '3 cm', size: 30 },
  '4cm': { id: '4cm', label: '4 cm', size: 40 },
  '5cm': { id: '5cm', label: '5 cm', size: 50 },
  '7cm': { id: '7cm', label: '7 cm', size: 70 },
  '10cm': { id: '10cm', label: '10 cm', size: 100 },
  custom: { id: 'custom', label: 'Personalizado' }, // usa stickerState.customSize
};
export const DEFAULT_STICKER_SIZE = '5cm';
export const CUSTOM_STICKER_LIMITS = { min: 20, max: 190 }; // mm

// El orden de inserción es el orden del desplegable.
export const STICKER_BORDERS = {
  none: { id: 'none', label: 'Ninguno', width: 0 },
  fino: { id: 'fino', label: 'Fino (1,5 mm)', width: 1.5 },
  ancho: { id: 'ancho', label: 'Ancho (3 mm)', width: 3 },
};
export const DEFAULT_STICKER_BORDER = 'fino';
export const DEFAULT_BORDER_COLOR = '#ffffff';

export const COPIES_LIMITS = { min: 1, max: 50 };

/**
 * Tamaño elegido en mm. 'custom' usa `customSize`; una clave desconocida usa el tamaño por defecto.
 * @param {string} sizeId clave de STICKER_SIZES
 * @param {number} customSize mm
 * @returns {number}
 */
export function resolveStickerSize(sizeId, customSize) {
  if (sizeId === 'custom') return customSize;
  const size = Object.hasOwn(STICKER_SIZES, sizeId) ? STICKER_SIZES[sizeId] : STICKER_SIZES[DEFAULT_STICKER_SIZE];
  return size.size;
}

/**
 * Tamaño personalizado redondeado a 1 mm, o null si no es un número o queda fuera de los límites.
 * @param {number} mm
 * @returns {number | null}
 */
export function normalizeCustomStickerSize(mm) {
  if (!Number.isFinite(mm)) return null;
  const size = Math.round(mm);
  if (size < CUSTOM_STICKER_LIMITS.min || size > CUSTOM_STICKER_LIMITS.max) return null;
  return size;
}

/**
 * Cantidad de copias: entero ajustado a COPIES_LIMITS, o null si no es un número.
 * @param {number} value
 * @returns {number | null}
 */
export function normalizeCopies(value) {
  if (!Number.isFinite(value)) return null;
  return Math.min(COPIES_LIMITS.max, Math.max(COPIES_LIMITS.min, Math.round(value)));
}

/**
 * Radio de las esquinas de una forma de lado `side`. Una clave desconocida usa la forma por defecto.
 * @param {string} shapeId clave de STICKER_SHAPES
 * @param {number} side mm
 * @returns {number} mm
 */
export function shapeRadius(shapeId, side) {
  const shape = Object.hasOwn(STICKER_SHAPES, shapeId) ? shapeId : DEFAULT_STICKER_SHAPE;
  if (shape === 'circle') return side / 2;
  if (shape === 'rounded') return side * ROUNDED_RADIUS;
  return 0;
}

/**
 * Sticker con la forma validada y el borde en mm.
 * @param {number} size mm
 * @param {string} shapeId clave de STICKER_SHAPES
 * @param {string} borderId clave de STICKER_BORDERS
 * @param {string} borderColor '#rrggbb'
 * @returns {{size: number, shape: string, border: number, borderColor: string}}
 */
export function stickerFor(size, shapeId, borderId, borderColor) {
  const shape = Object.hasOwn(STICKER_SHAPES, shapeId) ? shapeId : DEFAULT_STICKER_SHAPE;
  const border = Object.hasOwn(STICKER_BORDERS, borderId) ? STICKER_BORDERS[borderId].width : 0;
  return { size, shape, border, borderColor };
}

/**
 * Área de la foto dentro del borde. El radio es el exterior menos el borde, así el borde
 * queda de grosor parejo también en las esquinas.
 * @param {{size: number, shape: string, border: number}} sticker
 * @returns {{x: number, y: number, side: number, radius: number}} mm
 */
export function stickerPhotoArea({ size, shape, border }) {
  return {
    x: border,
    y: border,
    side: size - 2 * border,
    radius: Math.max(0, shapeRadius(shape, size) - border),
  };
}

/**
 * Lista para packFrames: cada foto repetida `copies` veces, en orden.
 * @param {{id: string, copies: number}[]} images
 * @param {number} size mm
 * @returns {{id: string, width: number, height: number}[]}
 */
export function expandCopies(images, size) {
  return images.flatMap((image) => Array.from({ length: image.copies }, () => ({ id: image.id, width: size, height: size })));
}

/**
 * Texto del sticker: "Círculo de 5 cm", "Cuadrado redondeado de 4,5 cm".
 * @param {string} shapeId clave de STICKER_SHAPES
 * @param {number} size mm
 */
export function stickerText(shapeId, size) {
  const shape = Object.hasOwn(STICKER_SHAPES, shapeId) ? STICKER_SHAPES[shapeId] : STICKER_SHAPES[DEFAULT_STICKER_SHAPE];
  const cm = String(size / 10).replace('.', ',');
  return `${shape.label} de ${cm} cm`;
}

/**
 * Nombre del PDF: 'stickers.pdf' con A4 (o una hoja desconocida) y 'stickers-a3.pdf' con A3.
 * @param {string} sheetId clave de FRAME_SHEETS
 */
export function stickersFileName(sheetId) {
  return sheetId === 'a3' ? 'stickers-a3.pdf' : 'stickers.pdf';
}
