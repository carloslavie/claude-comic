// Catálogo fijo de plantillas de página.
// Cada viñeta se expresa en fracciones 0..1 del área útil de la página
// (sin margen exterior). El medianil entre viñetas lo aplica el render.

export const TEMPLATES = {
  '1-full': {
    id: '1-full',
    label: 'Una sola viñeta',
    panels: [{ x: 0, y: 0, w: 1, h: 1 }],
  },
  '2-rows': {
    id: '2-rows',
    label: 'Dos apiladas',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.5 },
      { x: 0, y: 0.5, w: 1, h: 0.5 },
    ],
  },
  '2-cols': {
    id: '2-cols',
    label: 'Dos lado a lado',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
  },
  '3-top-wide': {
    id: '3-top-wide',
    label: 'Una ancha arriba y dos abajo',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  '3-left-tall': {
    id: '3-left-tall',
    label: 'Una alta a la izquierda y dos a la derecha',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  '4-grid': {
    id: '4-grid',
    label: 'Grilla 2 × 2',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
};
