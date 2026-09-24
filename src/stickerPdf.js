// Exportación de los stickers a PDF a tamaño real: acomodados en hojas, con una línea de corte
// vectorial sobre el contorno de cada uno.
import { jsPDF } from 'jspdf';
import { renderSticker } from './stickerRender.js';
import { stickerFor, shapeRadius, expandCopies, stickersFileName } from './stickerSizes.js';
import { FRAME_SHEETS, DEFAULT_FRAME_SHEET, packFrames, exportDpi } from './sheetLayout.js';

const JPEG_QUALITY = 0.92;
const MM_PER_INCH = 25.4;
const CUT_LINE_WIDTH_MM = 0.2;
const CUT_LINE_COLOR = '#999999';

/**
 * Genera y descarga el PDF de stickers. Cada foto se dibuja una sola vez a la resolución de
 * exportDpi, con fondo blanco fuera de la forma, y la misma imagen se reusa en todas sus copias.
 * @param {Array<object>} images StickerImage[], en orden
 * @param {{size: number, shape: string, border: string, borderColor: string, sheet: string}} options
 *   tamaño en mm, clave de STICKER_SHAPES, clave de STICKER_BORDERS, color '#rrggbb' y clave de FRAME_SHEETS
 */
export async function exportStickersPdf(images, { size, shape, border, borderColor, sheet }) {
  const sheetId = Object.hasOwn(FRAME_SHEETS, sheet) ? sheet : DEFAULT_FRAME_SHEET;
  const sticker = stickerFor(size, shape, border, borderColor);
  const imagesById = new Map(images.map((image) => [image.id, image]));

  const packed = packFrames(expandCopies(images, size), sheetId);
  if (!packed) throw new Error('Un sticker no entra en la hoja elegida.');

  const doc = new jsPDF({ unit: 'mm', format: sheetId, orientation: packed.orientation });
  const canvas = document.createElement('canvas');
  const px = Math.round((size / MM_PER_INCH) * exportDpi(size, size));
  canvas.width = px;
  canvas.height = px;
  const radius = shapeRadius(sticker.shape, size);

  // JPEG de cada foto, ya dibujado. Con el alias, jsPDF guarda la imagen una sola vez.
  const jpegs = new Map();

  for (const [sheetIndex, placements] of packed.sheets.entries()) {
    if (sheetIndex > 0) doc.addPage(sheetId, packed.orientation);

    for (const { id, x, y } of placements) {
      if (!jpegs.has(id)) {
        jpegs.set(id, await drawSticker(imagesById.get(id), sticker, canvas));
        // Cede el hilo entre fotos para que la pestaña siga respondiendo.
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      doc.addImage(jpegs.get(id), 'JPEG', x, y, size, size, id);

      doc.setDrawColor(CUT_LINE_COLOR);
      doc.setLineWidth(CUT_LINE_WIDTH_MM);
      if (sticker.shape === 'circle') doc.circle(x + size / 2, y + size / 2, size / 2, 'S');
      else if (radius > 0) doc.roundedRect(x, y, size, size, radius, radius, 'S');
      else doc.rect(x, y, size, size, 'S');
    }
  }

  doc.save(stickersFileName(sheetId));
}

// Dibuja el sticker sobre fondo blanco (JPEG no tiene transparencia) y devuelve sus bytes JPEG.
async function drawSticker(image, sticker, canvas) {
  renderSticker(image, sticker, canvas);
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('No se pudo generar el JPEG.'))), 'image/jpeg', JPEG_QUALITY);
  });
  return new Uint8Array(await blob.arrayBuffer());
}
