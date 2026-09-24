// Exportación de los cuadros a PDF a tamaño real, acomodados en hojas con marcas de corte.
import { jsPDF } from 'jspdf';
import { frameFor, renderFrame } from './frameRender.js';
import { FRAME_SHEETS, DEFAULT_FRAME_SHEET, packFrames, cutMarks, framesFileName } from './sheetLayout.js';

const DPI = 300;
const JPEG_QUALITY = 0.92;
const MM_PER_INCH = 25.4;
const CUT_MARK_WIDTH_MM = 0.2;
const CUT_MARK_COLOR = '#999999';

/**
 * Genera y descarga el PDF de cuadros. Cada cuadro se dibuja a 300 DPI y se agrega como
 * JPEG a su medida exacta; el que no entra derecho en la hoja va girado 90°.
 * @param {Array<object>} images FrameImage[], en orden
 * @param {{size: {short: number, long: number}, mat: string, matColor: string, sheet: string}} options
 *   medida en mm, clave de MATS, color '#rrggbb' y clave de FRAME_SHEETS
 */
export async function exportFramesPdf(images, { size, mat, matColor, sheet }) {
  const sheetId = Object.hasOwn(FRAME_SHEETS, sheet) ? sheet : DEFAULT_FRAME_SHEET;
  const entries = new Map(images.map((image) => [image.id, { image, frame: frameFor(image, size, mat, matColor) }]));
  const packed = packFrames(
    [...entries.values()].map(({ image, frame }) => ({ id: image.id, width: frame.width, height: frame.height })),
    sheetId,
  );
  if (!packed) throw new Error('Un cuadro no entra en la hoja elegida.');

  const doc = new jsPDF({ unit: 'mm', format: sheetId, orientation: packed.orientation });
  const canvas = document.createElement('canvas');
  const rotatedCanvas = document.createElement('canvas');

  for (const [sheetIndex, placements] of packed.sheets.entries()) {
    if (sheetIndex > 0) doc.addPage(sheetId, packed.orientation);

    for (const placement of placements) {
      const { image, frame } = entries.get(placement.id);
      canvas.width = toPx(frame.width);
      canvas.height = toPx(frame.height);
      renderFrame(image, frame, canvas);

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

  doc.save(framesFileName(sheetId));
}

function toPx(mm) {
  return Math.round((mm / MM_PER_INCH) * DPI);
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
