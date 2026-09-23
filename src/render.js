// Dibuja una página del comic en un canvas. Lo usan la vista previa y el PDF.
import { TEMPLATES } from './templates.js';
import { DEFAULT_PAGE_COLOR } from './colors.js';
import { DEFAULT_TITLE_STYLE, TITLE_SIZES, TITLE_FONTS, TITLE_OUTLINES, titleBlockTop } from './titleStyle.js';

// Medidas de página en mm (A4 vertical).
export const PAGE_WIDTH_MM = 210;
export const PAGE_HEIGHT_MM = 297;
const MARGIN_MM = 10;
const GUTTER_MM = 4;
const BORDER_MM = 0.8;

const TITLE_MIN_SIZE_MM = 6;
const TITLE_MAX_WIDTH = 0.85; // fracción del ancho de la viñeta
const TITLE_MAX_HEIGHT = 0.6; // fracción del alto de la viñeta
const EPSILON = 1e-6;

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
  const panels = page.kind === 'cover' ? TEMPLATES['1-full'].panels : TEMPLATES[page.templateId].panels;

  panels.forEach((panel, i) => {
    const rect = panelRect(panel, mm);
    const image = imagesById.get(page.imageIds[i]);
    if (image) drawCover(ctx, image, rect);
    drawBorder(ctx, rect, mm);
  });

  if (page.kind === 'cover' && title.trim() !== '') {
    drawTitle(ctx, title.trim(), panelRect(panels[0], mm), mm, titleStyle);
  }

  ctx.restore();
}

// Convierte una viñeta en fracciones del área útil a un rectángulo en px,
// descontando medio medianil en cada lado interno.
function panelRect(panel, mm) {
  const usableW = PAGE_WIDTH_MM - 2 * MARGIN_MM;
  const usableH = PAGE_HEIGHT_MM - 2 * MARGIN_MM;
  const half = GUTTER_MM / 2;

  const left = MARGIN_MM + panel.x * usableW + (panel.x > EPSILON ? half : 0);
  const top = MARGIN_MM + panel.y * usableH + (panel.y > EPSILON ? half : 0);
  const right = MARGIN_MM + (panel.x + panel.w) * usableW - (panel.x + panel.w < 1 - EPSILON ? half : 0);
  const bottom = MARGIN_MM + (panel.y + panel.h) * usableH - (panel.y + panel.h < 1 - EPSILON ? half : 0);

  return { x: left * mm, y: top * mm, w: (right - left) * mm, h: (bottom - top) * mm };
}

// Dibuja la imagen llenando el rectángulo con recorte centrado, sin deformarla.
function drawCover(ctx, image, rect) {
  const scale = Math.max(rect.w / image.width, rect.h / image.height);
  const sw = rect.w / scale;
  const sh = rect.h / scale;
  const sx = (image.width - sw) / 2;
  const sy = (image.height - sh) / 2;
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
