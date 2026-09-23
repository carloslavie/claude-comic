// Maquetado automático: reparte las imágenes en páginas según su orientación.
// Función pura: no toca DOM ni canvas.

/**
 * @param {Array<{id: string, orientation: 'landscape' | 'portrait' | 'square'}>} images
 * @param {string} title
 * @returns {Array<{kind: 'cover' | 'panels', templateId: string | null, imageIds: string[]}>}
 */
export function buildPages(images, title) {
  const pages = [];
  if (images.length === 0) return pages;

  if (title.trim() !== '') {
    pages.push({ kind: 'cover', templateId: null, imageIds: [images[0].id] });
  }

  let i = 0;
  while (i < images.length) {
    const remaining = images.length - i;
    const next = images.slice(i, i + 4);

    let templateId;
    let count;
    if (remaining >= 4 && next.every((img) => img.orientation === 'portrait')) {
      templateId = '4-grid';
      count = 4;
    } else if (remaining >= 3) {
      templateId = next[0].orientation === 'landscape' ? '3-top-wide' : '3-left-tall';
      count = 3;
    } else if (remaining === 2) {
      templateId = next[0].orientation === 'landscape' ? '2-rows' : '2-cols';
      count = 2;
    } else {
      templateId = '1-full';
      count = 1;
    }

    pages.push({
      kind: 'panels',
      templateId,
      imageIds: images.slice(i, i + count).map((img) => img.id),
    });
    i += count;
  }

  return pages;
}
