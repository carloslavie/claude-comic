// Geometría de las viñetas de una página del comic, en mm. Lógica pura.
// La usan el render y la detección de la viñeta tocada en la vista previa.
import { TEMPLATES } from './templates.js';

// Medidas de página en mm (A4 vertical).
export const PAGE_WIDTH_MM = 210;
export const PAGE_HEIGHT_MM = 297;
export const MARGIN_MM = 10;
export const GUTTER_MM = 4;

const EPSILON = 1e-6;

/**
 * Rectángulos de las viñetas de `page`, en el orden de `panels`: la viñeta `i` es la
 * de `page.imageIds[i]`. La portada usa la única viñeta de `1-full`.
 * @param {{kind: 'cover' | 'panels', templateId: string | null}} page
 * @returns {{x: number, y: number, width: number, height: number}[]} mm
 */
export function panelRects(page) {
  const panels = page.kind === 'cover' ? TEMPLATES['1-full'].panels : TEMPLATES[page.templateId].panels;
  return panels.map(panelRect);
}

/**
 * Índice de la viñeta que contiene el punto, o -1 si cae en el margen o en el medianil.
 * Los bordes de la viñeta cuentan como dentro.
 * @param {{kind: 'cover' | 'panels', templateId: string | null}} page
 * @param {number} x mm
 * @param {number} y mm
 */
export function panelAt(page, x, y) {
  return panelRects(page).findIndex(
    (r) => x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height,
  );
}

// Convierte una viñeta en fracciones del área útil a un rectángulo en mm,
// descontando medio medianil en cada lado interno.
function panelRect(panel) {
  const usableW = PAGE_WIDTH_MM - 2 * MARGIN_MM;
  const usableH = PAGE_HEIGHT_MM - 2 * MARGIN_MM;
  const half = GUTTER_MM / 2;

  const left = MARGIN_MM + panel.x * usableW + (panel.x > EPSILON ? half : 0);
  const top = MARGIN_MM + panel.y * usableH + (panel.y > EPSILON ? half : 0);
  const right = MARGIN_MM + (panel.x + panel.w) * usableW - (panel.x + panel.w < 1 - EPSILON ? half : 0);
  const bottom = MARGIN_MM + (panel.y + panel.h) * usableH - (panel.y + panel.h < 1 - EPSILON ? half : 0);

  return { x: left, y: top, width: right - left, height: bottom - top };
}
