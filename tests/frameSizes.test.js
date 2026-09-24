import { describe, it, expect } from 'vitest';
import {
  FRAME_SIZES,
  DEFAULT_FRAME_SIZE,
  MATS,
  DEFAULT_MAT,
  frameOrientation,
  resolveFrameSize,
  frameDimensions,
  normalizeCustomSize,
  effectiveMat,
  photoArea,
} from '../src/frameSizes.js';

describe('frameOrientation', () => {
  it('da horizontal para una foto apaisada', () => {
    expect(frameOrientation(4000, 3000)).toBe('landscape');
  });

  it('da vertical para una foto vertical', () => {
    expect(frameOrientation(3000, 4000)).toBe('portrait');
  });

  it('da vertical para una foto cuadrada', () => {
    expect(frameOrientation(1000, 1000)).toBe('portrait');
  });
});

describe('resolveFrameSize', () => {
  it('devuelve los lados de una medida del catálogo', () => {
    expect(resolveFrameSize('10x15', { short: 50, long: 50 })).toEqual({ short: 100, long: 150 });
    expect(resolveFrameSize('a4', { short: 50, long: 50 })).toEqual({ short: 210, long: 297 });
  });

  it('usa la medida personalizada con custom', () => {
    expect(resolveFrameSize('custom', { short: 180, long: 250 })).toEqual({ short: 180, long: 250 });
  });

  it('usa la medida por defecto con una clave desconocida', () => {
    expect(resolveFrameSize('xyz', { short: 50, long: 50 })).toEqual({ short: 130, long: 180 });
  });
});

describe('frameDimensions', () => {
  it('pone el lado corto como ancho en vertical', () => {
    expect(frameDimensions({ short: 130, long: 180 }, 'portrait')).toEqual({ width: 130, height: 180 });
  });

  it('pone el lado largo como ancho en horizontal', () => {
    expect(frameDimensions({ short: 130, long: 180 }, 'landscape')).toEqual({ width: 180, height: 130 });
  });
});

describe('normalizeCustomSize', () => {
  it('ordena los lados en corto y largo', () => {
    expect(normalizeCustomSize(250, 180)).toEqual({ short: 180, long: 250 });
    expect(normalizeCustomSize(180, 250)).toEqual({ short: 180, long: 250 });
  });

  it('redondea a mm enteros', () => {
    expect(normalizeCustomSize(210.4, 296.6)).toEqual({ short: 210, long: 297 });
  });

  it('acepta los extremos del rango', () => {
    expect(normalizeCustomSize(50, 50)).toEqual({ short: 50, long: 50 });
    expect(normalizeCustomSize(270, 400)).toEqual({ short: 270, long: 400 });
  });

  it('rechaza lados fuera de 50..400 mm', () => {
    expect(normalizeCustomSize(40, 100)).toBeNull();
    expect(normalizeCustomSize(100, 410)).toBeNull();
  });

  it('rechaza un lado corto de más de 270 mm', () => {
    expect(normalizeCustomSize(300, 300)).toBeNull();
  });

  it('rechaza valores que no son números', () => {
    expect(normalizeCustomSize(NaN, 100)).toBeNull();
    expect(normalizeCustomSize(100, Infinity)).toBeNull();
  });
});

describe('effectiveMat', () => {
  it('usa el grosor elegido si deja lugar para la foto', () => {
    expect(effectiveMat('fino', 130, 180)).toBe(10);
    expect(effectiveMat('ancho', 100, 150)).toBe(40);
  });

  it('se achica para dejar al menos 20 mm de foto', () => {
    expect(effectiveMat('ancho', 50, 50)).toBe(15);
  });

  it('vale 0 sin paspartú o con una clave desconocida', () => {
    expect(effectiveMat('none', 130, 180)).toBe(0);
    expect(effectiveMat('xyz', 130, 180)).toBe(0);
  });
});

describe('photoArea', () => {
  it('descuenta el paspartú de cada lado', () => {
    expect(photoArea(130, 180, 20)).toEqual({ x: 20, y: 20, width: 90, height: 140 });
  });

  it('ocupa todo el cuadro sin paspartú', () => {
    expect(photoArea(130, 180, 0)).toEqual({ x: 0, y: 0, width: 130, height: 180 });
  });
});

describe('catálogos', () => {
  it('los valores por defecto existen en sus catálogos', () => {
    expect(Object.hasOwn(FRAME_SIZES, DEFAULT_FRAME_SIZE)).toBe(true);
    expect(Object.hasOwn(MATS, DEFAULT_MAT)).toBe(true);
  });

  it('las claves coinciden con su id', () => {
    for (const [key, size] of Object.entries(FRAME_SIZES)) expect(size.id).toBe(key);
    for (const [key, mat] of Object.entries(MATS)) expect(mat.id).toBe(key);
  });
});
