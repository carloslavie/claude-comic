import { describe, it, expect } from 'vitest';
import {
  DEFAULT_CROP,
  cropRect,
  clampCrop,
  panCrop,
  cropDpi,
  isLowResolution,
} from '../src/crop.js';

describe('cropRect', () => {
  it('a zoom 1 hace el recorte cover centrado', () => {
    expect(cropRect(4000, 3000, 100, 150, DEFAULT_CROP)).toEqual({ sx: 1000, sy: 0, sw: 2000, sh: 3000 });
  });

  it('a zoom 2 divide el recorte por 2', () => {
    const crop = { zoom: 2, centerX: 0.5, centerY: 0.5 };
    expect(cropRect(4000, 3000, 100, 150, crop)).toEqual({ sx: 1500, sy: 750, sw: 1000, sh: 1500 });
  });

  it('ajusta el centro para no salir de la foto', () => {
    const crop = { zoom: 1, centerX: 0, centerY: 0.5 };
    expect(cropRect(4000, 3000, 100, 150, crop)).toEqual({ sx: 0, sy: 0, sw: 2000, sh: 3000 });
    const end = { zoom: 1, centerX: 1, centerY: 0.5 };
    expect(cropRect(4000, 3000, 100, 150, end)).toEqual({ sx: 2000, sy: 0, sw: 2000, sh: 3000 });
  });

  it('recorta arriba y abajo con una foto más alta que el área', () => {
    expect(cropRect(3000, 4000, 180, 130, DEFAULT_CROP)).toEqual({
      sx: 0,
      sy: (4000 - 3000 * (130 / 180)) / 2,
      sw: 3000,
      sh: 3000 * (130 / 180),
    });
  });

  it('limita el zoom a 1..3', () => {
    const low = cropRect(4000, 3000, 100, 150, { zoom: 0.5, centerX: 0.5, centerY: 0.5 });
    expect(low.sw).toBe(2000);
    const high = cropRect(4000, 3000, 100, 150, { zoom: 5, centerX: 0.5, centerY: 0.5 });
    expect(high.sh).toBe(1000);
  });
});

describe('clampCrop', () => {
  it('no cambia un encuadre válido', () => {
    expect(clampCrop(4000, 3000, 100, 150, DEFAULT_CROP)).toEqual(DEFAULT_CROP);
  });

  it('ajusta el centro y el zoom fuera de rango', () => {
    expect(clampCrop(4000, 3000, 100, 150, { zoom: 0.5, centerX: 0, centerY: 0.9 })).toEqual({
      zoom: 1,
      centerX: 0.25,
      centerY: 0.5,
    });
  });
});

describe('panCrop', () => {
  it('la foto sigue al puntero: arrastrar a la derecha mueve el centro a la izquierda', () => {
    // sw = 2000 de 4000 px: moverse el 10 % del área son 200 px, 0.05 de la foto.
    const crop = panCrop(4000, 3000, 100, 150, DEFAULT_CROP, 0.1, 0);
    expect(crop.centerX).toBeCloseTo(0.45);
    expect(crop.centerY).toBe(0.5);
    expect(crop.zoom).toBe(1);
  });

  it('arrastrar a la izquierda mueve el centro a la derecha', () => {
    expect(panCrop(4000, 3000, 100, 150, DEFAULT_CROP, -0.1, 0).centerX).toBeCloseTo(0.55);
  });

  it('no sale de la foto', () => {
    expect(panCrop(4000, 3000, 100, 150, DEFAULT_CROP, 5, 0).centerX).toBe(0.25);
    expect(panCrop(4000, 3000, 100, 150, DEFAULT_CROP, -5, 0).centerX).toBe(0.75);
    // A zoom 1 la foto ya ocupa todo el alto: no se mueve en vertical.
    expect(panCrop(4000, 3000, 100, 150, DEFAULT_CROP, 0, 0.3).centerY).toBe(0.5);
  });

  it('con zoom se puede mover en los dos ejes', () => {
    const crop = panCrop(4000, 3000, 100, 150, { zoom: 2, centerX: 0.5, centerY: 0.5 }, 0, 0.2);
    // sh = 1500 de 3000 px: el 20 % del área son 300 px, 0.1 de la foto.
    expect(crop.centerY).toBeCloseTo(0.4);
  });
});

describe('cropDpi', () => {
  it('calcula la resolución de la parte visible', () => {
    expect(Math.round(cropDpi(4000, 3000, 100, 150, DEFAULT_CROP))).toBe(508);
  });

  it('baja con el zoom', () => {
    const crop = { zoom: 2, centerX: 0.5, centerY: 0.5 };
    expect(Math.round(cropDpi(4000, 3000, 100, 150, crop))).toBe(254);
  });

  it('una foto chica en un cuadro grande queda con baja resolución', () => {
    expect(isLowResolution(cropDpi(800, 600, 300, 200, DEFAULT_CROP))).toBe(true);
    expect(isLowResolution(cropDpi(4000, 3000, 180, 130, DEFAULT_CROP))).toBe(false);
  });
});

describe('isLowResolution', () => {
  it('es baja por debajo de 150 DPI', () => {
    expect(isLowResolution(149.9)).toBe(true);
    expect(isLowResolution(150)).toBe(false);
  });
});
