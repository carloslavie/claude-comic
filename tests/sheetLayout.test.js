import { describe, it, expect } from 'vitest';
import { FRAME_SIZES } from '../src/frameSizes.js';
import {
  FRAME_SHEETS,
  DEFAULT_FRAME_SHEET,
  EXPORT_DPI,
  MAX_CANVAS_PIXELS,
  frameFits,
  packFrames,
  fullSheetPages,
  exportDpi,
  cutMarks,
  framesFileName,
} from '../src/sheetLayout.js';

const catalog = Object.values(FRAME_SIZES).filter((size) => size.id !== 'custom');

function frames(n, width, height) {
  return Array.from({ length: n }, (_, i) => ({ id: `f${i + 1}`, width, height }));
}

describe('frameFits', () => {
  it('en A4 entran 10x15, 13x18 y 15x20', () => {
    for (const id of ['10x15', '13x18', '15x20']) expect(frameFits(FRAME_SIZES[id], 'a4')).toBe(true);
  });

  it('en A4 no entran 20x25, 20x30 ni A4', () => {
    for (const id of ['20x25', '20x30', 'a4']) expect(frameFits(FRAME_SIZES[id], 'a4')).toBe(false);
  });

  it('en A3 entra todo el catálogo salvo las medidas de hoja completa', () => {
    for (const size of catalog.filter((size) => !size.fullSheet)) expect(frameFits(size, 'a3')).toBe(true);
  });

  it('la medida A3 no entra en el área útil de una A3', () => {
    expect(frameFits(FRAME_SIZES.a3, 'a3')).toBe(false);
  });

  it('en A3 entra la medida personalizada más grande', () => {
    expect(frameFits({ short: 270, long: 400 }, 'a3')).toBe(true);
  });
});

describe('packFrames', () => {
  it('pone 2 cuadros 100 × 150 en 1 hoja A4 apaisada', () => {
    expect(packFrames(frames(2, 100, 150), 'a4')).toEqual({
      orientation: 'landscape',
      sheets: [
        [
          { id: 'f1', x: 10, y: 10, width: 100, height: 150, rotated: false },
          { id: 'f2', x: 115, y: 10, width: 100, height: 150, rotated: false },
        ],
      ],
    });
  });

  it('pone 3 cuadros 100 × 150 en 2 hojas A4 apaisadas', () => {
    const result = packFrames(frames(3, 100, 150), 'a4');
    expect(result.orientation).toBe('landscape');
    expect(result.sheets.map((sheet) => sheet.map((f) => f.id))).toEqual([['f1', 'f2'], ['f3']]);
    expect(result.sheets[1][0]).toMatchObject({ x: 10, y: 10 });
  });

  it('pone 4 cuadros 130 × 180 en 1 hoja A3 vertical, en 2 filas de 2', () => {
    const result = packFrames(frames(4, 130, 180), 'a3');
    expect(result.orientation).toBe('portrait');
    expect(result.sheets).toHaveLength(1);
    expect(result.sheets[0].map(({ x, y }) => [x, y])).toEqual([
      [10, 10],
      [145, 10],
      [10, 195],
      [145, 195],
    ]);
  });

  it('empieza la fila nueva debajo del cuadro más alto', () => {
    // A4 vertical: 80 × 100 entra al lado de 100 × 150; el tercero baja a la fila siguiente.
    const result = packFrames(
      [
        { id: 'a', width: 100, height: 150 },
        { id: 'b', width: 80, height: 100 },
        { id: 'c', width: 100, height: 100 },
        { id: 'd', width: 190, height: 277 },
      ],
      'a4',
    );
    expect(result.orientation).toBe('portrait');
    expect(result.sheets[0]).toEqual([
      { id: 'a', x: 10, y: 10, width: 100, height: 150, rotated: false },
      { id: 'b', x: 115, y: 10, width: 80, height: 100, rotated: false },
      { id: 'c', x: 10, y: 165, width: 100, height: 100, rotated: false },
    ]);
    expect(result.sheets[1]).toEqual([{ id: 'd', x: 10, y: 10, width: 190, height: 277, rotated: false }]);
  });

  it('gira el cuadro que no entra derecho y usa la hoja vertical en empate', () => {
    expect(packFrames(frames(1, 200, 150), 'a4')).toEqual({
      orientation: 'portrait',
      sheets: [[{ id: 'f1', x: 10, y: 10, width: 150, height: 200, rotated: true }]],
    });
  });

  it('devuelve null si un cuadro no entra', () => {
    expect(packFrames(frames(1, 200, 250), 'a4')).toBeNull();
  });

  it('devuelve una lista vacía sin cuadros', () => {
    expect(packFrames([], 'a4')).toEqual({ orientation: 'portrait', sheets: [] });
  });

  it('trata una hoja desconocida como A4', () => {
    expect(packFrames(frames(2, 100, 150), 'xyz')).toEqual(packFrames(frames(2, 100, 150), 'a4'));
  });
});

describe('cutMarks', () => {
  const rect = { x: 10, y: 10, width: 100, height: 150 };

  it('devuelve 8 líneas', () => {
    expect(cutMarks(rect)).toHaveLength(8);
  });

  it('en la esquina superior izquierda van hacia la izquierda y hacia arriba', () => {
    const [horizontal, vertical] = cutMarks(rect);
    expect(horizontal).toEqual({ x1: 9, y1: 10, x2: 7.8, y2: 10 });
    expect(vertical).toEqual({ x1: 10, y1: 9, x2: 10, y2: 7.8 });
  });

  it('ninguna línea entra en el cuadro', () => {
    for (const { x1, y1, x2, y2 } of cutMarks(rect)) {
      for (const [px, py] of [
        [x1, y1],
        [x2, y2],
      ]) {
        const inside = px > rect.x && px < rect.x + rect.width && py > rect.y && py < rect.y + rect.height;
        expect(inside).toBe(false);
        const onCorner = [rect.x, rect.x + rect.width].includes(px) && [rect.y, rect.y + rect.height].includes(py);
        expect(onCorner).toBe(false);
      }
    }
  });

  it('no toca las marcas de un vecino a 5 mm', () => {
    const neighbor = { ...rect, x: rect.x + rect.width + 5 };
    const rightEdge = cutMarks(rect).filter((m) => m.y1 === m.y2 && m.x1 > rect.x + rect.width - 1);
    const leftEdge = cutMarks(neighbor).filter((m) => m.y1 === m.y2 && m.x1 < neighbor.x);
    const maxRight = Math.max(...rightEdge.flatMap((m) => [m.x1, m.x2]));
    const minLeft = Math.min(...leftEdge.flatMap((m) => [m.x1, m.x2]));
    expect(maxRight).toBeLessThan(minLeft);
  });
});

describe('framesFileName', () => {
  it('usa cuadros.pdf con A4 y cuadros-a3.pdf con A3', () => {
    expect(framesFileName('a4')).toBe('cuadros.pdf');
    expect(framesFileName('a3')).toBe('cuadros-a3.pdf');
  });

  it('trata una hoja desconocida como A4', () => {
    expect(framesFileName('xyz')).toBe('cuadros.pdf');
  });
});

describe('FRAME_SHEETS', () => {
  it('la hoja por defecto existe y las claves coinciden con su id', () => {
    expect(Object.hasOwn(FRAME_SHEETS, DEFAULT_FRAME_SHEET)).toBe(true);
    for (const [key, sheet] of Object.entries(FRAME_SHEETS)) expect(sheet.id).toBe(key);
  });
});

describe('fullSheetPages', () => {
  it('una hoja por cuadro, con la orientación del cuadro', () => {
    expect(
      fullSheetPages([
        { id: 'a', width: 297, height: 420 },
        { id: 'b', width: 420, height: 297 },
      ]),
    ).toEqual([
      { id: 'a', orientation: 'portrait' },
      { id: 'b', orientation: 'landscape' },
    ]);
  });

  it('sin cuadros no hay hojas', () => {
    expect(fullSheetPages([])).toEqual([]);
  });
});

describe('exportDpi', () => {
  const pixels = (w, h, dpi) => Math.round((w / 25.4) * dpi) * Math.round((h / 25.4) * dpi);

  it('usa 300 DPI si el canvas entra en el límite', () => {
    expect(EXPORT_DPI).toBe(300);
    expect(exportDpi(130, 180)).toBe(300);
    expect(exportDpi(210, 297)).toBe(300);
    expect(exportDpi(270, 400)).toBe(300);
  });

  it('baja lo justo para que un A3 no pase el límite, en las dos orientaciones', () => {
    expect(exportDpi(297, 420)).toBe(287);
    expect(exportDpi(420, 297)).toBe(287);
    expect(pixels(297, 420, 287)).toBeLessThanOrEqual(MAX_CANVAS_PIXELS);
    expect(pixels(297, 420, 288)).toBeGreaterThan(MAX_CANVAS_PIXELS);
  });
});
