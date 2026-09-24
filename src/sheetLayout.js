// Hojas del PDF de cuadros y acomodo de los cuadros en ellas. Lógica pura, medidas en mm.

// El orden de inserción es el orden del desplegable. Medidas en vertical.
export const FRAME_SHEETS = {
  a4: { id: 'a4', label: 'A4', width: 210, height: 297 },
  a3: { id: 'a3', label: 'A3', width: 297, height: 420 },
};
export const DEFAULT_FRAME_SHEET = 'a4';
export const SHEET_MARGIN_MM = 10;
export const FRAME_GAP_MM = 5;
export const CUT_MARK = { offset: 1, length: 1.2 }; // mm desde la esquina del cuadro
export const EXPORT_DPI = 300;
export const MAX_CANVAS_PIXELS = 16_000_000; // Safari de iOS no dibuja canvas de más de 16,7 Mpx

const MM_PER_INCH = 25.4;

/**
 * Área útil de la hoja en vertical (sin márgenes). Una clave desconocida se trata como A4.
 * @param {string} sheetId clave de FRAME_SHEETS
 * @returns {{width: number, height: number}}
 */
function usableArea(sheetId) {
  const sheet = Object.hasOwn(FRAME_SHEETS, sheetId) ? FRAME_SHEETS[sheetId] : FRAME_SHEETS[DEFAULT_FRAME_SHEET];
  return { width: sheet.width - 2 * SHEET_MARGIN_MM, height: sheet.height - 2 * SHEET_MARGIN_MM };
}

/**
 * Si un cuadro de esa medida entra en el área útil de la hoja, en alguna orientación.
 * @param {{short: number, long: number}} size mm
 * @param {string} sheetId clave de FRAME_SHEETS
 */
export function frameFits({ short, long }, sheetId) {
  const { width, height } = usableArea(sheetId);
  return short <= width && long <= height;
}

/**
 * Acomoda los cuadros en hojas, en filas y en el orden recibido. Prueba la hoja vertical
 * y la horizontal y devuelve la que da menos hojas (empate: vertical). Un cuadro que no
 * entra tal cual en el área útil pero sí girado va girado.
 * @param {Array<{id: string, width: number, height: number}>} frames mm
 * @param {string} sheetId clave de FRAME_SHEETS
 * @returns {{
 *   orientation: 'portrait' | 'landscape',
 *   sheets: Array<Array<{id: string, x: number, y: number, width: number, height: number, rotated: boolean}>>,
 * } | null} null si algún cuadro no entra
 */
export function packFrames(frames, sheetId) {
  const { width, height } = usableArea(sheetId);
  const portrait = packInArea(frames, width, height);
  const landscape = packInArea(frames, height, width);
  if (!portrait && !landscape) return null;
  if (!landscape || (portrait && portrait.length <= landscape.length)) {
    return { orientation: 'portrait', sheets: portrait };
  }
  return { orientation: 'landscape', sheets: landscape };
}

function packInArea(frames, areaW, areaH) {
  const sheets = [];
  let current = [];
  let x = 0;
  let y = 0;
  let rowH = 0;

  for (const frame of frames) {
    let w = frame.width;
    let h = frame.height;
    let rotated = false;
    if (w > areaW || h > areaH) {
      if (h > areaW || w > areaH) return null;
      [w, h] = [h, w];
      rotated = true;
    }

    if (x > 0 && x + w > areaW) {
      y += rowH + FRAME_GAP_MM;
      x = 0;
      rowH = 0;
    }
    if (y > 0 && y + h > areaH) {
      sheets.push(current);
      current = [];
      x = 0;
      y = 0;
      rowH = 0;
    }

    current.push({ id: frame.id, x: SHEET_MARGIN_MM + x, y: SHEET_MARGIN_MM + y, width: w, height: h, rotated });
    x += w + FRAME_GAP_MM;
    rowH = Math.max(rowH, h);
  }

  if (current.length) sheets.push(current);
  return sheets;
}

/**
 * Una hoja por cuadro, en orden, para las medidas de hoja completa. Cada hoja toma la
 * orientación de su cuadro.
 * @param {Array<{id: string, width: number, height: number}>} frames mm
 * @returns {Array<{id: string, orientation: 'portrait' | 'landscape'}>}
 */
export function fullSheetPages(frames) {
  return frames.map(({ id, width, height }) => ({ id, orientation: width > height ? 'landscape' : 'portrait' }));
}

/**
 * Resolución de exportación de un cuadro: EXPORT_DPI, o la mayor entera que no deja
 * pasar el canvas de MAX_CANVAS_PIXELS.
 * @param {number} widthMm
 * @param {number} heightMm
 * @returns {number}
 */
export function exportDpi(widthMm, heightMm) {
  const pixels = (dpi) =>
    Math.round((widthMm / MM_PER_INCH) * dpi) * Math.round((heightMm / MM_PER_INCH) * dpi);
  let dpi = EXPORT_DPI;
  while (dpi > 1 && pixels(dpi) > MAX_CANVAS_PIXELS) dpi--;
  return dpi;
}

/**
 * Las 8 líneas de las marcas de corte de un cuadro: en cada esquina, una horizontal y
 * una vertical sobre la prolongación de los bordes, por fuera del cuadro.
 * @param {{x: number, y: number, width: number, height: number}} rect mm
 * @returns {Array<{x1: number, y1: number, x2: number, y2: number}>}
 */
export function cutMarks({ x, y, width, height }) {
  const near = CUT_MARK.offset;
  const far = CUT_MARK.offset + CUT_MARK.length;
  const corners = [
    { cx: x, cy: y, dx: -1, dy: -1 },
    { cx: x + width, cy: y, dx: 1, dy: -1 },
    { cx: x, cy: y + height, dx: -1, dy: 1 },
    { cx: x + width, cy: y + height, dx: 1, dy: 1 },
  ];
  return corners.flatMap(({ cx, cy, dx, dy }) => [
    { x1: cx + dx * near, y1: cy, x2: cx + dx * far, y2: cy },
    { x1: cx, y1: cy + dy * near, x2: cx, y2: cy + dy * far },
  ]);
}

/**
 * Nombre del PDF de cuadros: 'cuadros.pdf' con A4 (o clave desconocida), 'cuadros-a3.pdf' con A3.
 * @param {string} sheetId clave de FRAME_SHEETS
 */
export function framesFileName(sheetId) {
  return sheetId === 'a3' ? 'cuadros-a3.pdf' : 'cuadros.pdf';
}
