// Exporta las páginas a un PDF A4 vertical generado en el navegador.
import { jsPDF } from 'jspdf';
import { renderPage, PAGE_WIDTH_MM, PAGE_HEIGHT_MM } from './render.js';

// 150 DPI sobre A4 vertical.
const PDF_PAGE_WIDTH_PX = 1240;
const PDF_PAGE_HEIGHT_PX = 1754;
const JPEG_QUALITY = 0.85;

/**
 * Dibuja cada página, la agrega al PDF y descarga el archivo.
 * @param {Array<{kind: 'cover' | 'panels', templateId: string | null, imageIds: string[]}>} pages
 * @param {Map<string, {bitmap: ImageBitmap, width: number, height: number}>} imagesById
 * @param {string} title
 * @param {string[]} backgrounds color de fondo '#rrggbb' de cada página, en el orden de `pages`
 * @param {object} titleStyle estilo del título de la portada (ver DEFAULT_TITLE_STYLE)
 */
export async function exportPdf(pages, imagesById, title, backgrounds, titleStyle) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const canvas = document.createElement('canvas');
  canvas.width = PDF_PAGE_WIDTH_PX;
  canvas.height = PDF_PAGE_HEIGHT_PX;

  for (const [index, page] of pages.entries()) {
    renderPage(page, imagesById, canvas, title, backgrounds[index], titleStyle);
    if (index > 0) doc.addPage('a4', 'portrait');
    doc.addImage(canvas.toDataURL('image/jpeg', JPEG_QUALITY), 'JPEG', 0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM);
    // Cede el hilo entre páginas para que la pestaña siga respondiendo.
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  doc.save(pdfFileName(title));
}

/**
 * "Mis Vacaciones 2024!" → "mis-vacaciones-2024.pdf"; sin título → "comic.pdf".
 * @param {string} title
 */
export function pdfFileName(title) {
  const slug = title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita tildes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || 'comic'}.pdf`;
}
