// Exportación de los cuadros a PDF a tamaño real: acomodados en hojas con marcas de corte,
// o uno por hoja, borde a borde, con las medidas de hoja completa.
import { jsPDF } from 'jspdf';
import { frameFor, renderFrame } from './frameRender.js';
import {
  FRAME_SHEETS,
  DEFAULT_FRAME_SHEET,
  packFrames,
  fullSheetPages,
  exportDpi,
  cutMarks,
  framesFileName,
} from './sheetLayout.js';

const JPEG_QUALITY = 0.92;
const MM_PER_INCH = 25.4;
const CUT_MARK_WIDTH_MM = 0.2;
const CUT_MARK_COLOR = '#999999';

/**
 * Genera y descarga el PDF de cuadros. Cada cuadro se dibuja a la resolución de exportDpi
 * y se agrega como JPEG a su medida exacta.
 * Con `fullSheet`, cada cuadro ocupa su propia hoja entera, con la orientación del cuadro,
 * sin margen ni marcas de corte. Si no, los cuadros se acomodan en hojas con marcas de
 * corte y el que no entra derecho va girado 90°.
 * @param {Array<object>} images FrameImage[], en orden
 * @param {{size: {short: number, long: number}, mat: string, matColor: string, sheet: string, fullSheet?: boolean}} options
 *   medida en mm, clave de MATS, color '#rrggbb', clave de FRAME_SHEETS y si la medida es de hoja completa
 */
export async function exportFramesPdf(images, { size, mat, matColor, sheet, fullSheet = false }) {
  const sheetId = Object.hasOwn(FRAME_SHEETS, sheet) ? sheet : DEFAULT_FRAME_SHEET;
  const entries = new Map(images.map((image) => [image.id, { image, frame: frameFor(image, size, mat, matColor) }]));
  const frames = [...entries.values()].map(({ image, frame }) => ({
    id: image.id,
    width: frame.width,
    height: frame.height,
  }));
  const canvas = document.createElement('canvas');

  const doc = fullSheet
    ? await exportFullSheets(frames, entries, sheetId, canvas)
    : await exportPacked(frames, entries, sheetId, canvas);

  doc.save(framesFileName(sheetId));
}

// Un cuadro por hoja, en x = 0, y = 0, sin girar y sin marcas de corte.
async function exportFullSheets(frames, entries, sheetId, canvas) {
  const pages = fullSheetPages(frames);
  const doc = new jsPDF({ unit: 'mm', format: sheetId, orientation: pages[0]?.orientation ?? 'portrait' });

  for (const [pageIndex, page] of pages.entries()) {
    if (pageIndex > 0) doc.addPage(sheetId, page.orientation);

    const { image, frame } = entries.get(page.id);
    drawFrame(image, frame, canvas);
    doc.addImage(canvas.toDataURL('image/jpeg', JPEG_QUALITY), 'JPEG', 0, 0, frame.width, frame.height);

    // Cede el hilo entre cuadros para que la pestaña siga respondiendo.
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return doc;
}

// Cuadros acomodados en hojas con margen y marcas de corte.
async function exportPacked(frames, entries, sheetId, canvas) {
  const packed = packFrames(frames, sheetId);
  if (!packed) throw new Error('Un cuadro no entra en la hoja elegida.');

  const doc = new jsPDF({ unit: 'mm', format: sheetId, orientation: packed.orientation });
  const rotatedCanvas = document.createElement('canvas');

  for (const [sheetIndex, placements] of packed.sheets.entries()) {
    if (sheetIndex > 0) doc.addPage(sheetId, packed.orientation);

    for (const placement of placements) {
      const { image, frame } = entries.get(placement.id);
      drawFrame(image, frame, canvas);

      const output = placement.rotated ? rotate(canvas, rotatedCanvas) : canvas;
      doc.addImage(
        output.toDataURL('image/jpeg', JPEG_QUALITY),
        'JPEG',
        placement.x,
        placement.y,
        placement.width,
        placement.height,
      );

      doc.setDrawColor(CUT_MARK_COLOR);
      doc.setLineWidth(CUT_MARK_WIDTH_MM);
      for (const { x1, y1, x2, y2 } of cutMarks(placement)) doc.line(x1, y1, x2, y2);

      // Cede el hilo entre cuadros para que la pestaña siga respondiendo.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  return doc;
}

// Dibuja el cuadro en `canvas` a la resolución de exportación de su medida.
function drawFrame(image, frame, canvas) {
  const dpi = exportDpi(frame.width, frame.height);
  canvas.width = toPx(frame.width, dpi);
  canvas.height = toPx(frame.height, dpi);
  renderFrame(image, frame, canvas);
}

function toPx(mm, dpi) {
  return Math.round((mm / MM_PER_INCH) * dpi);
}

// Copia `source` girado 90° en sentido horario en `target`, con los lados cambiados.
function rotate(source, target) {
  target.width = source.height;
  target.height = source.width;
  const ctx = target.getContext('2d');
  ctx.translate(target.width, 0);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(source, 0, 0);
  return target;
}
