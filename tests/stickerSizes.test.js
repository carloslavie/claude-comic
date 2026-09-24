import { describe, it, expect } from 'vitest';
import {
  STICKER_SHAPES,
  DEFAULT_STICKER_SHAPE,
  STICKER_SIZES,
  DEFAULT_STICKER_SIZE,
  STICKER_BORDERS,
  DEFAULT_STICKER_BORDER,
  stickerDimensions,
  resolveStickerSize,
  normalizeCustomStickerSize,
  normalizeCopies,
  shapeRadius,
  stickerFor,
  stickerPhotoArea,
  expandCopies,
  stickerText,
  stickersFileName,
} from '../src/stickerSizes.js';
import { packFrames } from '../src/sheetLayout.js';

describe('catálogos', () => {
  it('los valores por defecto existen en sus catálogos', () => {
    expect(STICKER_SHAPES).toHaveProperty(DEFAULT_STICKER_SHAPE);
    expect(STICKER_SIZES).toHaveProperty(DEFAULT_STICKER_SIZE);
    expect(STICKER_BORDERS).toHaveProperty(DEFAULT_STICKER_BORDER);
  });

  it('las formas siguen el orden del desplegable', () => {
    expect(Object.keys(STICKER_SHAPES)).toEqual([
      'circle',
      'square',
      'rounded',
      'landscape',
      'landscape-rounded',
      'portrait',
      'portrait-rounded',
    ]);
  });

  it('los tamaños siguen el orden del desplegable', () => {
    expect(Object.keys(STICKER_SIZES)).toEqual(['3cm', '4cm', '5cm', '7cm', '10cm', 'custom']);
  });
});

describe('resolveStickerSize', () => {
  it('da el tamaño del catálogo', () => {
    expect(resolveStickerSize('5cm', 80)).toBe(50);
  });

  it('da el tamaño personalizado', () => {
    expect(resolveStickerSize('custom', 80)).toBe(80);
  });

  it('usa el tamaño por defecto con una clave desconocida', () => {
    expect(resolveStickerSize('xyz', 80)).toBe(50);
  });
});

describe('normalizeCustomStickerSize', () => {
  it('acepta tamaños dentro de los límites', () => {
    expect(normalizeCustomStickerSize(45)).toBe(45);
    expect(normalizeCustomStickerSize(190)).toBe(190);
  });

  it('redondea a 1 mm', () => {
    expect(normalizeCustomStickerSize(45.4)).toBe(45);
  });

  it('rechaza tamaños fuera de los límites o que no son números', () => {
    expect(normalizeCustomStickerSize(19)).toBeNull();
    expect(normalizeCustomStickerSize(191)).toBeNull();
    expect(normalizeCustomStickerSize(NaN)).toBeNull();
  });
});

describe('normalizeCopies', () => {
  it('deja un valor válido igual', () => {
    expect(normalizeCopies(3)).toBe(3);
  });

  it('ajusta al extremo más cercano', () => {
    expect(normalizeCopies(0)).toBe(1);
    expect(normalizeCopies(80)).toBe(50);
  });

  it('redondea un decimal', () => {
    expect(normalizeCopies(2.6)).toBe(3);
  });

  it('da null si no es un número', () => {
    expect(normalizeCopies(NaN)).toBeNull();
  });
});

describe('stickerDimensions', () => {
  it('las formas cuadradas miden size × size', () => {
    expect(stickerDimensions('circle', 50)).toEqual({ width: 50, height: 50 });
  });

  it('el tamaño es el lado largo del rectángulo y el corto se redondea a 1 mm', () => {
    expect(stickerDimensions('landscape', 50)).toEqual({ width: 50, height: 33 });
    expect(stickerDimensions('portrait-rounded', 40)).toEqual({ width: 27, height: 40 });
    expect(stickerDimensions('landscape', 30)).toEqual({ width: 30, height: 20 });
    expect(stickerDimensions('landscape', 100)).toEqual({ width: 100, height: 67 });
  });

  it('usa la forma por defecto con una clave desconocida', () => {
    expect(stickerDimensions('xyz', 50)).toEqual({ width: 50, height: 50 });
  });
});

describe('shapeRadius', () => {
  it('da el radio de cada forma cuadrada', () => {
    expect(shapeRadius('circle', 50, 50)).toBe(25);
    expect(shapeRadius('square', 50, 50)).toBe(0);
    expect(shapeRadius('rounded', 50, 50)).toBe(7.5);
  });

  it('da el radio de los rectángulos con el lado corto', () => {
    expect(shapeRadius('landscape', 50, 33)).toBe(0);
    expect(shapeRadius('landscape-rounded', 50, 33)).toBeCloseTo(4.95);
  });

  it('usa la forma por defecto con una clave desconocida', () => {
    expect(shapeRadius('xyz', 50, 50)).toBe(25);
  });
});

describe('stickerFor', () => {
  it('resuelve el borde en mm', () => {
    expect(stickerFor(50, 'circle', 'fino', '#ffffff')).toEqual({
      width: 50,
      height: 50,
      shape: 'circle',
      border: 1.5,
      borderColor: '#ffffff',
    });
  });

  it('da las medidas del rectángulo', () => {
    expect(stickerFor(50, 'landscape', 'fino', '#ffffff')).toEqual({
      width: 50,
      height: 33,
      shape: 'landscape',
      border: 1.5,
      borderColor: '#ffffff',
    });
  });

  it('usa la forma por defecto y borde 0 con claves desconocidas', () => {
    expect(stickerFor(50, 'xyz', 'xyz', '#000000')).toEqual({
      width: 50,
      height: 50,
      shape: 'circle',
      border: 0,
      borderColor: '#000000',
    });
  });
});

describe('stickerPhotoArea', () => {
  it('círculo con borde fino', () => {
    expect(stickerPhotoArea(stickerFor(50, 'circle', 'fino', '#fff'))).toEqual({ x: 1.5, y: 1.5, width: 47, height: 47, radius: 23.5 });
  });

  it('redondeado con borde ancho', () => {
    expect(stickerPhotoArea(stickerFor(50, 'rounded', 'ancho', '#fff'))).toEqual({ x: 3, y: 3, width: 44, height: 44, radius: 4.5 });
  });

  it('cuadrado sin borde', () => {
    expect(stickerPhotoArea(stickerFor(50, 'square', 'none', '#fff'))).toEqual({ x: 0, y: 0, width: 50, height: 50, radius: 0 });
  });

  it('rectángulo horizontal con borde fino', () => {
    expect(stickerPhotoArea(stickerFor(50, 'landscape', 'fino', '#fff'))).toEqual({ x: 1.5, y: 1.5, width: 47, height: 30, radius: 0 });
  });

  it('rectángulo horizontal redondeado con borde ancho', () => {
    const area = stickerPhotoArea(stickerFor(50, 'landscape-rounded', 'ancho', '#fff'));
    expect(area).toMatchObject({ x: 3, y: 3, width: 44, height: 27 });
    expect(area.radius).toBeCloseTo(1.95);
  });
});

describe('expandCopies', () => {
  it('repite cada foto según sus copias, en orden', () => {
    const images = [
      { id: 'a', copies: 2 },
      { id: 'b', copies: 1 },
    ];
    expect(expandCopies(images, 50, 50)).toEqual([
      { id: 'a', width: 50, height: 50 },
      { id: 'a', width: 50, height: 50 },
      { id: 'b', width: 50, height: 50 },
    ]);
  });

  it('con packFrames, 15 stickers de 50 mm entran en 1 hoja A4 y 16 necesitan 2', () => {
    expect(packFrames(expandCopies([{ id: 'a', copies: 15 }], 50, 50), 'a4').sheets).toHaveLength(1);
    expect(packFrames(expandCopies([{ id: 'a', copies: 16 }], 50, 50), 'a4').sheets).toHaveLength(2);
  });

  it('usa ancho y alto del rectángulo', () => {
    expect(expandCopies([{ id: 'a', copies: 1 }], 50, 33)).toEqual([{ id: 'a', width: 50, height: 33 }]);
  });

  it('con packFrames, 25 rectángulos horizontales de 50 mm entran en 1 hoja A4 apaisada y 26 necesitan 2', () => {
    const one = packFrames(expandCopies([{ id: 'a', copies: 25 }], 50, 33), 'a4');
    expect(one.orientation).toBe('landscape');
    expect(one.sheets).toHaveLength(1);
    expect(packFrames(expandCopies([{ id: 'a', copies: 26 }], 50, 33), 'a4').sheets).toHaveLength(2);
  });

  it('con packFrames, un rectángulo horizontal y uno vertical de 190 mm entran en A4 sin girar', () => {
    for (const shape of ['landscape', 'portrait']) {
      const { width, height } = stickerDimensions(shape, 190);
      const packed = packFrames(expandCopies([{ id: 'a', copies: 1 }], width, height), 'a4');
      expect(packed.sheets.flat().some((placement) => placement.rotated)).toBe(false);
    }
  });
});

describe('stickerText', () => {
  it('usa cm sin decimal si es entero', () => {
    expect(stickerText('circle', 50)).toBe('Círculo de 5 cm');
  });

  it('usa coma decimal', () => {
    expect(stickerText('rounded', 45)).toBe('Cuadrado redondeado de 4,5 cm');
  });

  it('los rectángulos muestran ancho × alto', () => {
    expect(stickerText('landscape', 50)).toBe('Rectángulo horizontal de 5 × 3,3 cm');
    expect(stickerText('portrait-rounded', 40)).toBe('Rectángulo vertical redondeado de 2,7 × 4 cm');
    expect(stickerText('landscape', 45)).toBe('Rectángulo horizontal de 4,5 × 3 cm');
  });
});

describe('stickersFileName', () => {
  it('da el nombre según la hoja', () => {
    expect(stickersFileName('a4')).toBe('stickers.pdf');
    expect(stickersFileName('a3')).toBe('stickers-a3.pdf');
    expect(stickersFileName('xyz')).toBe('stickers.pdf');
  });
});
