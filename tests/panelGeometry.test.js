import { describe, it, expect } from 'vitest';
import {
  panelRects,
  panelAt,
  PAGE_WIDTH_MM,
  PAGE_HEIGHT_MM,
  MARGIN_MM,
} from '../src/panelGeometry.js';
import { TEMPLATES } from '../src/templates.js';

const panelsPage = (templateId) => ({ kind: 'panels', templateId, imageIds: [] });
const coverPage = { kind: 'cover', templateId: null, imageIds: [] };

describe('panelRects', () => {
  it('la portada usa una sola viñeta que ocupa toda el área útil', () => {
    expect(panelRects(coverPage)).toEqual([{ x: 10, y: 10, width: 190, height: 277 }]);
  });

  it('1-full ocupa toda el área útil', () => {
    expect(panelRects(panelsPage('1-full'))).toEqual([{ x: 10, y: 10, width: 190, height: 277 }]);
  });

  it('2-rows descuenta medio medianil entre las dos viñetas', () => {
    expect(panelRects(panelsPage('2-rows'))).toEqual([
      { x: 10, y: 10, width: 190, height: 136.5 },
      { x: 10, y: 150.5, width: 190, height: 136.5 },
    ]);
  });

  it('2-cols descuenta medio medianil entre las dos viñetas', () => {
    expect(panelRects(panelsPage('2-cols'))).toEqual([
      { x: 10, y: 10, width: 93, height: 277 },
      { x: 107, y: 10, width: 93, height: 277 },
    ]);
  });

  describe.each(Object.keys(TEMPLATES))('plantilla %s', (templateId) => {
    const rects = panelRects(panelsPage(templateId));

    it('tiene una viñeta por cada panel de la plantilla', () => {
      expect(rects).toHaveLength(TEMPLATES[templateId].panels.length);
    });

    it('ninguna viñeta sale del área útil', () => {
      for (const r of rects) {
        expect(r.x).toBeGreaterThanOrEqual(MARGIN_MM);
        expect(r.y).toBeGreaterThanOrEqual(MARGIN_MM);
        expect(r.x + r.width).toBeLessThanOrEqual(PAGE_WIDTH_MM - MARGIN_MM + 1e-9);
        expect(r.y + r.height).toBeLessThanOrEqual(PAGE_HEIGHT_MM - MARGIN_MM + 1e-9);
      }
    });

    it('ninguna viñeta se superpone con otra', () => {
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i];
          const b = rects[j];
          const overlaps =
            a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
          expect(overlaps).toBe(false);
        }
      }
    });
  });
});

describe('panelAt', () => {
  it('2-rows: encuentra la viñeta de arriba y la de abajo', () => {
    expect(panelAt(panelsPage('2-rows'), 100, 50)).toBe(0);
    expect(panelAt(panelsPage('2-rows'), 100, 200)).toBe(1);
  });

  it('2-rows: el medianil no es ninguna viñeta', () => {
    expect(panelAt(panelsPage('2-rows'), 100, 148.5)).toBe(-1);
  });

  it('el margen no es ninguna viñeta', () => {
    expect(panelAt(panelsPage('2-rows'), 5, 5)).toBe(-1);
  });

  it('2-cols: encuentra la viñeta de la derecha', () => {
    expect(panelAt(panelsPage('2-cols'), 150, 100)).toBe(1);
  });

  it('los bordes de la viñeta cuentan como dentro', () => {
    expect(panelAt(panelsPage('2-rows'), 10, 10)).toBe(0);
    expect(panelAt(panelsPage('2-rows'), 200, 146.5)).toBe(0);
  });

  it('la portada responde a su única viñeta', () => {
    expect(panelAt(coverPage, 105, 148.5)).toBe(0);
  });
});
