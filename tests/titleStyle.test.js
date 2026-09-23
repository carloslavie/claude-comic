import { describe, it, expect } from 'vitest';
import {
  titleBlockTop,
  DEFAULT_TITLE_STYLE,
  TITLE_SIZES,
  TITLE_FONTS,
  TITLE_POSITIONS,
  TITLE_OUTLINES,
} from '../src/titleStyle.js';

describe('titleBlockTop', () => {
  // Viñeta de y = 100 a y = 1100 (alto 1000), bloque de texto de 200.
  it('arriba deja una separación del 5 % del alto', () => {
    expect(titleBlockTop('top', 100, 1000, 200)).toBe(150);
  });

  it('al centro deja el mismo espacio arriba y abajo', () => {
    expect(titleBlockTop('center', 100, 1000, 200)).toBe(500);
  });

  it('abajo deja una separación del 5 % del alto', () => {
    expect(titleBlockTop('bottom', 100, 1000, 200)).toBe(850);
  });

  it('trata una posición desconocida como centro', () => {
    expect(titleBlockTop('izquierda', 100, 1000, 200)).toBe(500);
  });
});

describe('DEFAULT_TITLE_STYLE', () => {
  it('cada clave apunta a una opción existente de su catálogo', () => {
    expect(TITLE_SIZES).toHaveProperty(DEFAULT_TITLE_STYLE.size);
    expect(TITLE_FONTS).toHaveProperty(DEFAULT_TITLE_STYLE.font);
    expect(TITLE_POSITIONS).toHaveProperty(DEFAULT_TITLE_STYLE.position);
    expect(TITLE_OUTLINES).toHaveProperty(DEFAULT_TITLE_STYLE.outline);
  });
});
