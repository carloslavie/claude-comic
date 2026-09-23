// Estado en memoria de la app y las operaciones que lo modifican.
import { getOrientation } from './orientation.js';
import { DEFAULT_PAGE_COLOR, prunePageColorOverrides } from './colors.js';
import { prunePageTemplateOverrides } from './layout.js';
import { DEFAULT_TITLE_STYLE } from './titleStyle.js';

export const MAX_IMAGES = 40;
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const state = {
  title: '', // string, título del comic; vacío = sin portada
  images: [], // ComicImage[], en el orden elegido por el usuario
  pageColor: DEFAULT_PAGE_COLOR, // string '#rrggbb', color global de fondo
  pageColorOverrides: {}, // { [pageIndex: number]: '#rrggbb' }, índice 0-based
  pageTemplateOverrides: {}, // { [pageIndex: number]: templateId }, índice 0-based
  titleStyle: { ...DEFAULT_TITLE_STYLE }, // estilo del título de la portada
};

let nextId = 1;

/**
 * Valida, decodifica y agrega archivos al final de la lista.
 * Respeta el límite de MAX_IMAGES: acepta los primeros hasta completar el cupo.
 * @param {Iterable<File>} files
 * @returns {Promise<Array<{name: string, reason: 'type' | 'limit' | 'decode'}>>}
 *   archivos rechazados, en el orden en que llegaron
 */
export async function addFiles(files) {
  const rejected = [];

  for (const file of files) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      rejected.push({ name: file.name, reason: 'type' });
      continue;
    }
    if (state.images.length >= MAX_IMAGES) {
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
    if (state.images.length >= MAX_IMAGES) {
      bitmap.close();
      rejected.push({ name: file.name, reason: 'limit' });
      continue;
    }

    state.images.push({
      id: `img-${nextId++}`,
      name: file.name,
      url: URL.createObjectURL(file),
      bitmap,
      width: bitmap.width,
      height: bitmap.height,
      orientation: getOrientation(bitmap.width, bitmap.height),
    });
  }

  return rejected;
}

/**
 * Mueve una imagen `delta` posiciones (-1 sube, +1 baja), sin salirse de la lista.
 * @param {string} id
 * @param {number} delta
 */
export function moveImage(id, delta) {
  const from = state.images.findIndex((img) => img.id === id);
  if (from === -1) return;
  const to = Math.min(Math.max(from + delta, 0), state.images.length - 1);
  if (to === from) return;
  const [img] = state.images.splice(from, 1);
  state.images.splice(to, 0, img);
}

/**
 * Quita una imagen de la lista y revoca su object URL.
 * @param {string} id
 */
export function removeImage(id) {
  const index = state.images.findIndex((img) => img.id === id);
  if (index === -1) return;
  const [img] = state.images.splice(index, 1);
  URL.revokeObjectURL(img.url);
}

/**
 * @param {string} text
 */
export function setTitle(text) {
  state.title = text;
}

/**
 * Cambia el color global de fondo de página.
 * @param {string} color '#rrggbb'
 */
export function setPageColor(color) {
  state.pageColor = color;
}

/**
 * Fija el color propio de una página; pisa al color global solo en esa página.
 * @param {number} index índice de página, 0-based
 * @param {string} color '#rrggbb'
 */
export function setPageColorOverride(index, color) {
  state.pageColorOverrides[index] = color;
}

/**
 * Quita el color propio de una página, que vuelve a usar el color global.
 * @param {number} index índice de página, 0-based
 */
export function clearPageColorOverride(index) {
  delete state.pageColorOverrides[index];
}

/**
 * Descarta los colores propios de páginas que ya no existen.
 * @param {number} pageCount
 */
export function prunePageColors(pageCount) {
  state.pageColorOverrides = prunePageColorOverrides(state.pageColorOverrides, pageCount);
}

/**
 * Fija la plantilla de una página; las páginas siguientes se reacomodan solas.
 * @param {number} index índice de página, 0-based
 * @param {string} templateId id de TEMPLATES
 */
export function setPageTemplateOverride(index, templateId) {
  state.pageTemplateOverrides[index] = templateId;
}

/**
 * Quita la plantilla elegida de una página, que vuelve al maquetado automático.
 * @param {number} index índice de página, 0-based
 */
export function clearPageTemplateOverride(index) {
  delete state.pageTemplateOverrides[index];
}

/**
 * Descarta las plantillas elegidas de páginas que ya no existen.
 * @param {number} pageCount
 */
export function prunePageTemplates(pageCount) {
  state.pageTemplateOverrides = prunePageTemplateOverrides(state.pageTemplateOverrides, pageCount);
}

/**
 * Cambia una o más opciones del estilo del título; las demás se conservan.
 * @param {Partial<typeof DEFAULT_TITLE_STYLE>} partial por ejemplo { size: 'large' }
 */
export function setTitleStyle(partial) {
  state.titleStyle = { ...state.titleStyle, ...partial };
}

/**
 * Vuelve el estilo del título a los valores por defecto.
 */
export function resetTitleStyle() {
  state.titleStyle = { ...DEFAULT_TITLE_STYLE };
}
