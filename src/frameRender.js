// Dibuja un cuadro (paspartú + foto encuadrada) en un canvas. Lo usan la vista previa y el PDF.
import { frameDimensions, effectiveMat, photoArea } from './frameSizes.js';
import { cropRect } from './crop.js';

/**
 * Medidas del cuadro de una foto, con el paspartú ya resuelto.
 * @param {{orientation: 'portrait' | 'landscape'}} image
 * @param {{short: number, long: number}} size mm
 * @param {string} matId clave de MATS
 * @param {string} matColor '#rrggbb'
 * @returns {{width: number, height: number, mat: number, matColor: string}} mm
 */
export function frameFor(image, size, matId, matColor) {
  const { width, height } = frameDimensions(size, image.orientation);
  return { width, height, mat: effectiveMat(matId, width, height), matColor };
}

/**
 * Dibuja el cuadro ocupando todo el canvas. El canvas debe tener la proporción del cuadro;
 * la escala se toma de su ancho.
 * @param {{bitmap: ImageBitmap, width: number, height: number, crop: {zoom: number, centerX: number, centerY: number}}} image
 * @param {{width: number, height: number, mat: number, matColor: string}} frame mm
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas
 */
export function renderFrame(image, frame, canvas) {
  const ctx = canvas.getContext('2d');
  const mm = canvas.width / frame.width; // px por mm

  ctx.save();
  ctx.fillStyle = frame.matColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const area = photoArea(frame.width, frame.height, frame.mat);
  const { sx, sy, sw, sh } = cropRect(image.width, image.height, area.width, area.height, image.crop);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image.bitmap, sx, sy, sw, sh, area.x * mm, area.y * mm, area.width * mm, area.height * mm);
  ctx.restore();
}
