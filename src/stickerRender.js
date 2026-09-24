// Dibuja un sticker (borde + foto encuadrada con su forma) en un canvas. Lo usan la vista previa y el PDF.
import { shapeRadius, stickerPhotoArea } from './stickerSizes.js';
import { cropRect } from './crop.js';

const CUT_LINE_COLOR = '#999999';

/**
 * Dibuja el sticker ocupando todo el canvas, que debe ser cuadrado; la escala se toma de su ancho.
 * Fuera de la forma el canvas queda transparente.
 * @param {{bitmap: ImageBitmap, width: number, height: number, crop: {zoom: number, centerX: number, centerY: number}}} image
 * @param {{size: number, shape: string, border: number, borderColor: string}} sticker mm
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas
 * @param {{cutLine?: boolean}} [options] cutLine: traza el contorno con una línea de 1 px
 */
export function renderSticker(image, sticker, canvas, { cutLine = false } = {}) {
  const ctx = canvas.getContext('2d');
  const mm = canvas.width / sticker.size; // px por mm

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  shapePath(ctx, 0, 0, sticker.size * mm, shapeRadius(sticker.shape, sticker.size) * mm);
  ctx.fillStyle = sticker.borderColor;
  ctx.fill();

  const area = stickerPhotoArea(sticker);
  const { sx, sy, sw, sh } = cropRect(image.width, image.height, area.side, area.side, image.crop);
  ctx.save();
  shapePath(ctx, area.x * mm, area.y * mm, area.side * mm, area.radius * mm);
  ctx.clip();
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image.bitmap, sx, sy, sw, sh, area.x * mm, area.y * mm, area.side * mm, area.side * mm);
  ctx.restore();

  if (cutLine) {
    // Media línea hacia adentro, para que el trazo no quede cortado por el borde del canvas.
    const inset = 0.5;
    const side = canvas.width - 2 * inset;
    shapePath(ctx, inset, inset, side, shapeRadius(sticker.shape, side / mm) * mm);
    ctx.lineWidth = 1;
    ctx.strokeStyle = CUT_LINE_COLOR;
    ctx.stroke();
  }
  ctx.restore();
}

// Cuadrado de lado `side` con esquinas de radio `radius`. Con radio = side / 2 es un círculo.
function shapePath(ctx, x, y, side, radius) {
  const r = Math.min(radius, side / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + side, y, x + side, y + side, r);
  ctx.arcTo(x + side, y + side, x, y + side, r);
  ctx.arcTo(x, y + side, x, y, r);
  ctx.arcTo(x, y, x + side, y, r);
  ctx.closePath();
}
