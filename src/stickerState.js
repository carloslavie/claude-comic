// Estado en memoria de la herramienta de stickers y las operaciones que lo modifican.
// Es propio de esta herramienta: no comparte fotos con el comic ni con los cuadros.
import { ACCEPTED_TYPES, MAX_IMAGES } from './state.js';
import {
  STICKER_SHAPES,
  DEFAULT_STICKER_SHAPE,
  STICKER_SIZES,
  DEFAULT_STICKER_SIZE,
  STICKER_BORDERS,
  DEFAULT_STICKER_BORDER,
  DEFAULT_BORDER_COLOR,
  resolveStickerSize,
  normalizeCustomStickerSize,
  normalizeCopies,
} from './stickerSizes.js';
import { DEFAULT_CROP } from './crop.js';
import { FRAME_SHEETS, DEFAULT_FRAME_SHEET } from './sheetLayout.js';

export const stickerState = {
  images: [], // StickerImage[], en el orden de carga
  size: DEFAULT_STICKER_SIZE, // clave de STICKER_SIZES
  customSize: 50, // mm, se usa con size === 'custom'
  shape: DEFAULT_STICKER_SHAPE, // clave de STICKER_SHAPES
  border: DEFAULT_STICKER_BORDER, // clave de STICKER_BORDERS
  borderColor: DEFAULT_BORDER_COLOR, // '#rrggbb'
  sheet: DEFAULT_FRAME_SHEET, // clave de FRAME_SHEETS
};

let nextId = 1;

/**
 * Valida, decodifica y agrega fotos al final de la lista, igual que addFrameFiles.
 * Cada foto nueva lleva el encuadre por defecto y una copia.
 * @param {Iterable<File>} files
 * @returns {Promise<Array<{name: string, reason: 'type' | 'limit' | 'decode'}>>}
 *   archivos rechazados, en el orden en que llegaron
 */
export async function addStickerFiles(files) {
  const rejected = [];

  for (const file of files) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      rejected.push({ name: file.name, reason: 'type' });
      continue;
    }
    if (stickerState.images.length >= MAX_IMAGES) {
      rejected.push({ name: file.name, reason: 'limit' });
      continue;
    }

    let bitmap;
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      rejected.push({ name: file.name, reason: 'decode' });
      continue;
    }

    // Otra carga concurrente pudo completar el cupo mientras se decodificaba.
    if (stickerState.images.length >= MAX_IMAGES) {
      bitmap.close();
      rejected.push({ name: file.name, reason: 'limit' });
      continue;
    }

    stickerState.images.push({
      id: `sticker-${nextId++}`,
      name: file.name,
      url: URL.createObjectURL(file),
      bitmap,
      width: bitmap.width,
      height: bitmap.height,
      crop: { ...DEFAULT_CROP },
      copies: 1,
    });
  }

  return rejected;
}

/**
 * Quita una foto de la lista y revoca su object URL.
 * @param {string} id
 */
export function removeStickerImage(id) {
  const index = stickerState.images.findIndex((img) => img.id === id);
  if (index === -1) return;
  const [img] = stickerState.images.splice(index, 1);
  URL.revokeObjectURL(img.url);
}

/**
 * Cambia el tamaño de todos los stickers. Al elegir 'custom', el tamaño personalizado
 * toma el que estaba elegido. Una clave desconocida se ignora.
 * @param {string} sizeId clave de STICKER_SIZES
 */
export function setStickerSize(sizeId) {
  if (!Object.hasOwn(STICKER_SIZES, sizeId)) return;
  if (sizeId === 'custom' && stickerState.size !== 'custom') {
    stickerState.customSize = currentStickerSize();
  }
  stickerState.size = sizeId;
}

/**
 * Guarda un tamaño personalizado válido. Uno inválido no cambia nada.
 * @param {number} mm
 * @returns {boolean} si el tamaño era válido
 */
export function setCustomStickerSize(mm) {
  const size = normalizeCustomStickerSize(mm);
  if (size === null) return false;
  stickerState.customSize = size;
  return true;
}

/**
 * @param {string} shapeId clave de STICKER_SHAPES; una desconocida se ignora
 */
export function setStickerShape(shapeId) {
  if (!Object.hasOwn(STICKER_SHAPES, shapeId)) return;
  stickerState.shape = shapeId;
}

/**
 * @param {string} borderId clave de STICKER_BORDERS; una desconocida se ignora
 */
export function setStickerBorder(borderId) {
  if (!Object.hasOwn(STICKER_BORDERS, borderId)) return;
  stickerState.border = borderId;
}

/**
 * @param {string} color '#rrggbb'
 */
export function setStickerBorderColor(color) {
  stickerState.borderColor = color;
}

/**
 * @param {string} sheetId clave de FRAME_SHEETS; una desconocida se ignora
 */
export function setStickerSheet(sheetId) {
  if (!Object.hasOwn(FRAME_SHEETS, sheetId)) return;
  stickerState.sheet = sheetId;
}

/**
 * @param {string} id
 * @param {{zoom: number, centerX: number, centerY: number}} crop
 */
export function setStickerCrop(id, crop) {
  const img = findImage(id);
  if (!img) return;
  img.crop = { zoom: crop.zoom, centerX: crop.centerX, centerY: crop.centerY };
}

/**
 * Vuelve el encuadre de una foto a zoom 100 % y foto centrada.
 * @param {string} id
 */
export function resetStickerCrop(id) {
  const img = findImage(id);
  if (!img) return;
  img.crop = { ...DEFAULT_CROP };
}

/**
 * Guarda las copias de una foto, ajustadas a 1..50. Un valor que no es un número no cambia nada.
 * @param {string} id
 * @param {number} value
 * @returns {boolean} si el valor era un número
 */
export function setStickerCopies(id, value) {
  const img = findImage(id);
  const copies = normalizeCopies(value);
  if (!img || copies === null) return false;
  img.copies = copies;
  return true;
}

/**
 * Tamaño vigente, en mm.
 * @returns {number}
 */
export function currentStickerSize() {
  return resolveStickerSize(stickerState.size, stickerState.customSize);
}

function findImage(id) {
  return stickerState.images.find((img) => img.id === id);
}
