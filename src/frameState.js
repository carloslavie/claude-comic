// Estado en memoria de la herramienta de cuadros y las operaciones que lo modifican.
// Es propio de esta herramienta: no comparte fotos con el comic.
import { ACCEPTED_TYPES, MAX_IMAGES } from './state.js';
import {
  FRAME_SIZES,
  DEFAULT_FRAME_SIZE,
  MATS,
  DEFAULT_MAT,
  DEFAULT_MAT_COLOR,
  frameOrientation,
  resolveFrameSize,
  normalizeCustomSize,
} from './frameSizes.js';
import { DEFAULT_CROP } from './crop.js';
import { FRAME_SHEETS, DEFAULT_FRAME_SHEET, frameFits } from './sheetLayout.js';

export const frameState = {
  images: [], // FrameImage[], en el orden de carga
  size: DEFAULT_FRAME_SIZE, // clave de FRAME_SIZES
  customSize: { short: 130, long: 180 }, // mm, se usa con size === 'custom'
  mat: DEFAULT_MAT, // clave de MATS
  matColor: DEFAULT_MAT_COLOR, // '#rrggbb'
  sheet: DEFAULT_FRAME_SHEET, // clave de FRAME_SHEETS
};

let nextId = 1;

/**
 * Valida, decodifica y agrega fotos al final de la lista, igual que addFiles del comic.
 * Cada foto nueva lleva la orientación de su cuadro y el encuadre por defecto.
 * @param {Iterable<File>} files
 * @returns {Promise<Array<{name: string, reason: 'type' | 'limit' | 'decode'}>>}
 *   archivos rechazados, en el orden en que llegaron
 */
export async function addFrameFiles(files) {
  const rejected = [];

  for (const file of files) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      rejected.push({ name: file.name, reason: 'type' });
      continue;
    }
    if (frameState.images.length >= MAX_IMAGES) {
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
    if (frameState.images.length >= MAX_IMAGES) {
      bitmap.close();
      rejected.push({ name: file.name, reason: 'limit' });
      continue;
    }

    frameState.images.push({
      id: `frame-${nextId++}`,
      name: file.name,
      url: URL.createObjectURL(file),
      bitmap,
      width: bitmap.width,
      height: bitmap.height,
      orientation: frameOrientation(bitmap.width, bitmap.height),
      crop: { ...DEFAULT_CROP },
    });
  }

  return rejected;
}

/**
 * Quita una foto de la lista y revoca su object URL.
 * @param {string} id
 */
export function removeFrameImage(id) {
  const index = frameState.images.findIndex((img) => img.id === id);
  if (index === -1) return;
  const [img] = frameState.images.splice(index, 1);
  URL.revokeObjectURL(img.url);
}

/**
 * Cambia la medida de todos los cuadros. Al elegir 'custom', la medida personalizada
 * toma la que estaba elegida. Una clave desconocida se ignora.
 * @param {string} sizeId clave de FRAME_SIZES
 */
export function setFrameSize(sizeId) {
  if (!Object.hasOwn(FRAME_SIZES, sizeId)) return;
  if (sizeId === 'custom' && frameState.size !== 'custom') {
    frameState.customSize = resolveFrameSize(frameState.size, frameState.customSize);
  }
  frameState.size = sizeId;
  ensureSheetFits();
}

/**
 * Guarda una medida personalizada válida. Una inválida no cambia nada.
 * @param {number} aMm
 * @param {number} bMm
 * @returns {boolean} si la medida era válida
 */
export function setCustomFrameSize(aMm, bMm) {
  const size = normalizeCustomSize(aMm, bMm);
  if (!size) return false;
  frameState.customSize = size;
  ensureSheetFits();
  return true;
}

/**
 * @param {string} matId clave de MATS; una desconocida se ignora
 */
export function setMat(matId) {
  if (!Object.hasOwn(MATS, matId)) return;
  frameState.mat = matId;
}

/**
 * @param {string} color '#rrggbb'
 */
export function setMatColor(color) {
  frameState.matColor = color;
}

/**
 * Cambia la hoja del PDF. Ignora claves desconocidas y A4 si la medida vigente no entra.
 * @param {string} sheetId clave de FRAME_SHEETS
 */
export function setFrameSheet(sheetId) {
  if (!Object.hasOwn(FRAME_SHEETS, sheetId)) return;
  if (!frameFits(currentFrameSize(), sheetId)) return;
  frameState.sheet = sheetId;
}

/**
 * Cambia la orientación del cuadro de una foto: vertical ↔ horizontal.
 * @param {string} id
 */
export function toggleFrameOrientation(id) {
  const img = findImage(id);
  if (!img) return;
  img.orientation = img.orientation === 'landscape' ? 'portrait' : 'landscape';
}

/**
 * @param {string} id
 * @param {{zoom: number, centerX: number, centerY: number}} crop
 */
export function setFrameCrop(id, crop) {
  const img = findImage(id);
  if (!img) return;
  img.crop = { zoom: crop.zoom, centerX: crop.centerX, centerY: crop.centerY };
}

/**
 * Vuelve el encuadre de una foto a zoom 100 % y foto centrada.
 * @param {string} id
 */
export function resetFrameCrop(id) {
  const img = findImage(id);
  if (!img) return;
  img.crop = { ...DEFAULT_CROP };
}

/**
 * Lados de la medida vigente, en mm.
 * @returns {{short: number, long: number}}
 */
export function currentFrameSize() {
  return resolveFrameSize(frameState.size, frameState.customSize);
}

// Si la medida vigente no entra en la hoja elegida, pasa a A3.
function ensureSheetFits() {
  if (!frameFits(currentFrameSize(), frameState.sheet)) frameState.sheet = 'a3';
}

function findImage(id) {
  return frameState.images.find((img) => img.id === id);
}
