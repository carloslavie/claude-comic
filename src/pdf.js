// Exporta las páginas a un PDF generado en el navegador: A4 vertical o A3 apaisado con dos páginas por hoja.
import { jsPDF } from 'jspdf';
import { renderPage, PAGE_WIDTH_MM, PAGE_HEIGHT_MM } from './render.js';
import { DEFAULT_PAGE_COLOR } from './colors.js';
import { buildSheets, pdfFileName } from './pdfFormat.js';

// 150 DPI sobre A4 vertical.
const PDF_PAGE_WIDTH_PX = 1240;
const PDF_PAGE_HEIGHT_PX = 1754;
const JPEG_QUALITY = 0.85;

// Tamaño y orientación de la hoja de jsPDF para cada formato.
const SHEET_OPTIONS = {
  a4: { format: 'a4', orientation: 'portrait' },
  a3: { format: 'a3', orientation: 'landscape' },
};

/**
 * Dibuja cada página, la agrega al PDF y descarga el archivo.
 * Con A3, cada hoja lleva dos páginas seguidas: la izquierda en x = 0 y la derecha en x = 210 mm.
 * @param {Array<{kind: 'cover' | 'panels', templateId: string | null, imageIds: string[]}>} pages
 * @param {Map<string, {bitmap: ImageBitmap, width: number, height: number}>} imagesById
 * @param {string} title
 * @param {string[]} backgrounds color de fondo '#rrggbb' de cada página, en el orden de `pages`
 * @param {object} titleStyle estilo del título de la portada (ver DEFAULT_TITLE_STYLE)
 * @param {string} [format] clave de PDF_FORMATS
 * @param {string} [blankColor] color '#rrggbb' de la mitad vacía de la última hoja A3
 */
export async function exportPdf(
  pages,
  imagesById,
  title,
  backgrounds,
  titleStyle,
  format = 'a4',
  blankColor = DEFAULT_PAGE_COLOR,
) {
  const sheetOptions = SHEET_OPTIONS[format] ?? SHEET_OPTIONS.a4;
  const doc = new jsPDF({ unit: 'mm', ...sheetOptions });
  const canvas = document.createElement('canvas');
  canvas.width = PDF_PAGE_WIDTH_PX;
  canvas.height = PDF_PAGE_HEIGHT_PX;

  for (const [sheetIndex, sheet] of buildSheets(pages.length, format).entries()) {
    if (sheetIndex > 0) doc.addPage(sheetOptions.format, sheetOptions.orientation);

    for (const [slot, pageIndex] of sheet.entries()) {
      const x = slot * PAGE_WIDTH_MM;
      if (pageIndex === null) {
        doc.setFillColor(blankColor);
        doc.rect(x, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM, 'F');
        continue;
      }
      renderPage(pages[pageIndex], imagesById, canvas, title, backgrounds[pageIndex], titleStyle);
      doc.addImage(canvas.toDataURL('image/jpeg', JPEG_QUALITY), 'JPEG', x, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM);
      // Cede el hilo entre páginas para que la pestaña siga respondiendo.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  doc.save(pdfFileName(title, format));
}
