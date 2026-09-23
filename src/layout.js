// Maquetado: reparte las imágenes en páginas según su orientación,
// o según la plantilla elegida a mano para cada página.
// Funciones puras: no tocan DOM ni canvas.
import { TEMPLATES } from './templates.js';

/**
 * Regla automática: elige la plantilla según la orientación de las imágenes que quedan.
 * @param {Array<{orientation: string}>} next hasta 4 imágenes siguientes
 * @param {number} remaining imágenes que quedan
 * @returns {string} id de plantilla
 */
function autoTemplateId(next, remaining) {
  if (remaining >= 4 && next.every((img) => img.orientation === 'portrait')) return '4-grid';
  if (remaining >= 3) return next[0].orientation === 'landscape' ? '3-top-wide' : '3-left-tall';
  if (remaining === 2) return next[0].orientation === 'landscape' ? '2-rows' : '2-cols';
  return '1-full';
}

/**
 * @param {Array<{id: string, orientation: 'landscape' | 'portrait' | 'square'}>} images
 * @param {string} title
 * @param {{ [pageIndex: number]: string }} [templateOverrides] plantilla elegida por página, índice 0-based
 * @returns {Array<{
 *   kind: 'cover' | 'panels',
 *   templateId: string | null,
 *   imageIds: string[],
 *   layoutMode: 'auto' | 'manual' | 'fallback',
 *   available: number,
 * }>}
 *   `available`: imágenes que quedan desde esta página, incluida (1 en la portada).
 *   `fallback`: la página tiene elección pero no entra; usa la regla automática.
 */
export function buildPages(images, title, templateOverrides = {}) {
  const pages = [];
  if (images.length === 0) return pages;

  // La portada ignora cualquier elección en su índice.
  if (title.trim() !== '') {
    pages.push({ kind: 'cover', templateId: null, imageIds: [images[0].id], layoutMode: 'auto', available: 1 });
  }

  let i = 0;
  while (i < images.length) {
    const remaining = images.length - i;
    const chosenId = templateOverrides[pages.length];
    const chosen = Object.hasOwn(TEMPLATES, chosenId) ? TEMPLATES[chosenId] : null;

    let templateId;
    let layoutMode;
    if (!chosen) {
      templateId = autoTemplateId(images.slice(i, i + 4), remaining);
      layoutMode = 'auto';
    } else if (chosen.panels.length <= remaining) {
      templateId = chosen.id;
      layoutMode = 'manual';
    } else {
      templateId = autoTemplateId(images.slice(i, i + 4), remaining);
      layoutMode = 'fallback';
    }

    const count = TEMPLATES[templateId].panels.length;
    pages.push({
      kind: 'panels',
      templateId,
      imageIds: images.slice(i, i + count).map((img) => img.id),
      layoutMode,
      available: remaining,
    });
    i += count;
  }

  return pages;
}

/**
 * Descarta las elecciones de plantilla de páginas que ya no existen.
 * @param {{ [pageIndex: number]: string }} overrides
 * @param {number} pageCount
 * @returns {{ [pageIndex: number]: string }} copia sin las claves >= pageCount
 */
export function prunePageTemplateOverrides(overrides, pageCount) {
  const pruned = {};
  for (const [key, templateId] of Object.entries(overrides)) {
    if (Number(key) < pageCount) pruned[key] = templateId;
  }
  return pruned;
}
