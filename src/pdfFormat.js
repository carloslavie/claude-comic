// Formatos de hoja del PDF y cómo se reparten las páginas en cada hoja. Lógica pura.

export const DEFAULT_PDF_FORMAT = 'a4';

// El orden de inserción es el orden del desplegable.
export const PDF_FORMATS = {
  a4: { id: 'a4', label: 'A4 (1 página por hoja)', pagesPerSheet: 1 },
  a3: { id: 'a3', label: 'A3 (2 páginas por hoja)', pagesPerSheet: 2 },
};

/**
 * Reparte las páginas en hojas, en orden: con A3, [[0, 1], [2, 3], …].
 * La mitad vacía de la última hoja queda en `null`. Un formato desconocido se trata como A4.
 * @param {number} pageCount
 * @param {string} format clave de PDF_FORMATS
 * @returns {Array<Array<number | null>>}
 */
export function buildSheets(pageCount, format) {
  const perSheet = (PDF_FORMATS[format] ?? PDF_FORMATS[DEFAULT_PDF_FORMAT]).pagesPerSheet;
  const sheets = [];
  for (let start = 0; start < pageCount; start += perSheet) {
    const sheet = [];
    for (let i = start; i < start + perSheet; i++) sheet.push(i < pageCount ? i : null);
    sheets.push(sheet);
  }
  return sheets;
}

/**
 * "Mis Vacaciones 2024!" → "mis-vacaciones-2024.pdf"; sin título → "comic.pdf".
 * Con A3 agrega el sufijo "-a3": "mis-vacaciones-2024-a3.pdf".
 * @param {string} title
 * @param {string} [format] clave de PDF_FORMATS
 */
export function pdfFileName(title, format = 'a4') {
  const slug = title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita tildes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const suffix = format === 'a3' ? '-a3' : '';
  return `${slug || 'comic'}${suffix}.pdf`;
}
