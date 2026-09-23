// Catálogo fijo de plantillas de página.
// Cada viñeta se expresa en fracciones 0..1 del área útil de la página
// (sin margen exterior). El medianil entre viñetas lo aplica el render.

export const TEMPLATES = {
  '1-full': {
    id: '1-full',
    panels: [{ x: 0, y: 0, w: 1, h: 1 }],
  },
  '2-rows': {
    id: '2-rows',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.5 },
      { x: 0, y: 0.5, w: 1, h: 0.5 },
    ],
  },
  '2-cols': {
    id: '2-cols',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
  },
  '3-top-wide': {
    id: '3-top-wide',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  '3-left-tall': {
    id: '3-left-tall',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  '4-grid': {
    id: '4-grid',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
};
