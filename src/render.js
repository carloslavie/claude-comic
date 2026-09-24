// Dibuja una página del comic en un canvas. Lo usan la vista previa y el PDF.
import { DEFAULT_PAGE_COLOR } from './colors.js';
import { DEFAULT_TITLE_STYLE, TITLE_SIZES, TITLE_FONTS, TITLE_OUTLINES, titleBlockTop } from './titleStyle.js';
import { PAGE_WIDTH_MM, panelRects } from './panelGeometry.js';
import { DEFAULT_CROP, cropRect } from './crop.js';

export { PAGE_WIDTH_MM, PAGE_HEIGHT_MM } from './panelGeometry.js';

const BORDER_MM = 0.8;

const TITLE_MIN_SIZE_MM = 6;
const TITLE_MAX_WIDTH = 0.85; // fracción del ancho de la viñeta
const TITLE_MAX_HEIGHT = 0.6; // fracción del alto de la viñeta

/**
 * Dibuja `page` ocupando todo el canvas. El canvas debe tener proporción A4 vertical;
 * la escala se toma de su ancho.
 * @param {{kind: 'cover' | 'panels', templateId: string | null, imageIds: string[]}} page
 * @param {Map<string, {bitmap: ImageBitmap, width: number, height: number}>} imagesById
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas
 * @param {string} [title] texto de la portada; solo se usa si page.kind === 'cover'
 * @param {string} [background] color de fondo de la página (margen y medianil), '#rrggbb'
 * @param {typeof DEFAULT_TITLE_STYLE} [titleStyle] estilo del título de la portada
 */
export function renderPage(
  page,
  imagesById,
  canvas,
  title = '',
  background = DEFAULT_PAGE_COLOR,
  titleStyle = DEFAULT_TITLE_STYLE,
) {
  const ctx = canvas.getContext('2d');
  const mm = canvas.width / PAGE_WIDTH_MM; // px por mm

  ctx.save();
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // La portada usa una sola viñeta que ocupa toda el área útil.
  const rects = panelRects(page).map((r) => toPx(r, mm));

  rects.forEach((rect, i) => {
    const image = imagesById.get(page.imageIds[i]);
    if (image) drawCover(ctx, image, rect);
    drawBorder(ctx, rect, mm);
  });

  if (page.kind === 'cover' && title.trim() !== '') {
    drawTitle(ctx, title.trim(), rects[0], mm, titleStyle);
  }

  ctx.restore();
}

// Pasa un rectángulo de viñeta en mm a px.
function toPx(rect, mm) {
  return { x: rect.x * mm, y: rect.y * mm, w: rect.width * mm, h: rect.height * mm };
}

// Dibuja la imagen llenando el rectángulo, sin deformarla, con el encuadre de la foto
// (con DEFAULT_CROP es el recorte cover centrado).
function drawCover(ctx, image, rect) {
  const { sx, sy, sw, sh } = cropRect(image.width, image.height, rect.w, rect.h, image.crop ?? DEFAULT_CROP);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image.bitmap, sx, sy, sw, sh, rect.x, rect.y, rect.w, rect.h);
}

// Borde negro por dentro del rectángulo, para no invadir el medianil.
function drawBorder(ctx, rect, mm) {
  const lw = BORDER_MM * mm;
  ctx.lineWidth = lw;
  ctx.strokeStyle = '#000';
  ctx.lineJoin = 'miter';
  ctx.strokeRect(rect.x + lw / 2, rect.y + lw / 2, rect.w - lw, rect.h - lw);
}

// Título centrado en horizontal, con el estilo elegido. Reparte en líneas y achica
// la letra, desde el tamaño máximo del estilo, hasta que entra en el rectángulo.
function drawTitle(ctx, text, rect, mm, style) {
  const maxW = rect.w * TITLE_MAX_WIDTH;
  const maxH = rect.h * TITLE_MAX_HEIGHT;
  const { maxMm } = option(TITLE_SIZES, style.size, DEFAULT_TITLE_STYLE.size);
  const { family } = option(TITLE_FONTS, style.font, DEFAULT_TITLE_STYLE.font);
  const { ratio } = option(TITLE_OUTLINES, style.outline, DEFAULT_TITLE_STYLE.outline);

  let size = maxMm * mm;
  let lines;
  for (; size > TITLE_MIN_SIZE_MM * mm; size -= mm) {
    ctx.font = `${size}px ${family}`;
    lines = wrapLines(ctx, text, maxW);
    const fitsWidth = lines.every((line) => ctx.measureText(line).width <= maxW);
    if (fitsWidth && lines.length * size * 1.1 <= maxH) break;
  }
  ctx.font = `${size}px ${family}`;
  lines = wrapLines(ctx, text, maxW);

  const lineHeight = size * 1.1;
  const centerX = rect.x + rect.w / 2;
  const top = titleBlockTop(style.position, rect.y, rect.h, lines.length * lineHeight);
  const firstY = top + lineHeight / 2;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * ratio;
  ctx.strokeStyle = style.outlineColor ?? DEFAULT_TITLE_STYLE.outlineColor;
  ctx.fillStyle = style.color ?? DEFAULT_TITLE_STYLE.color;

  lines.forEach((line, i) => {
    const y = firstY + i * lineHeight;
    if (ratio > 0) ctx.strokeText(line, centerX, y);
    ctx.fillText(line, centerX, y);
  });
}

// Opción `key` del catálogo, o la opción por defecto si la clave no existe.
function option(catalog, key, defaultKey) {
  return Object.hasOwn(catalog, key) ? catalog[key] : catalog[defaultKey];
}

function wrapLines(ctx, text, maxW) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(candidate).width > maxW) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}
