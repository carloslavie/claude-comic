// Dibuja un sticker (borde + foto encuadrada con su forma) en un canvas. Lo usan la vista previa y el PDF.
import { shapeRadius, stickerPhotoArea } from './stickerSizes.js';
import { cropRect } from './crop.js';

const CUT_LINE_COLOR = '#999999';

/**
 * Dibuja el sticker ocupando todo el canvas, que debe tener la proporción del sticker; la escala
 * se toma de su ancho.
 * Fuera de la forma el canvas queda transparente.
 * @param {{bitmap: ImageBitmap, width: number, height: number, crop: {zoom: number, centerX: number, centerY: number}}} image
 * @param {{width: number, height: number, shape: string, border: number, borderColor: string}} sticker mm
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas
 * @param {{cutLine?: boolean}} [options] cutLine: traza el contorno con una línea de 1 px
 */
export function renderSticker(image, sticker, canvas, { cutLine = false } = {}) {
  const ctx = canvas.getContext('2d');
  const mm = canvas.width / sticker.width; // px por mm

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const radius = shapeRadius(sticker.shape, sticker.width, sticker.height);
  shapePath(ctx, 0, 0, sticker.width * mm, sticker.height * mm, radius * mm);
  ctx.fillStyle = sticker.borderColor;
  ctx.fill();

  const area = stickerPhotoArea(sticker);
  const { sx, sy, sw, sh } = cropRect(image.width, image.height, area.width, area.height, image.crop);
  ctx.save();
  shapePath(ctx, area.x * mm, area.y * mm, area.width * mm, area.height * mm, area.radius * mm);
  ctx.clip();
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image.bitmap, sx, sy, sw, sh, area.x * mm, area.y * mm, area.width * mm, area.height * mm);
  ctx.restore();

  if (cutLine) {
    // Media línea hacia adentro, para que el trazo no quede cortado por el borde del canvas.
    const inset = 0.5;
    const width = canvas.width - 2 * inset;
    const height = canvas.height - 2 * inset;
    shapePath(ctx, inset, inset, width, height, shapeRadius(sticker.shape, width / mm, height / mm) * mm);
    ctx.lineWidth = 1;
    ctx.strokeStyle = CUT_LINE_COLOR;
    ctx.stroke();
  }
  ctx.restore();
}

// Rectángulo de `width` × `height` con esquinas de radio `radius`. Con un cuadrado y
// radio = lado / 2 es un círculo.
function shapePath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}
