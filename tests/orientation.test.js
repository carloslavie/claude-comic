import { describe, it, expect } from 'vitest';
import { getOrientation } from '../src/orientation.js';

describe('getOrientation', () => {
  it('clasifica como landscape una imagen claramente horizontal', () => {
    expect(getOrientation(4000, 3000)).toBe('landscape');
    expect(getOrientation(1920, 1080)).toBe('landscape');
  });

  it('clasifica como portrait una imagen claramente vertical', () => {
    expect(getOrientation(3000, 4000)).toBe('portrait');
    expect(getOrientation(1080, 1920)).toBe('portrait');
  });

  it('clasifica como square una imagen cuadrada o casi cuadrada', () => {
    expect(getOrientation(1000, 1000)).toBe('square');
    expect(getOrientation(1100, 1000)).toBe('square');
    expect(getOrientation(900, 1000)).toBe('square');
  });

  it('trata los umbrales exactos como square', () => {
    expect(getOrientation(1200, 1000)).toBe('square'); // 1.2
    expect(getOrientation(830, 1000)).toBe('square'); // 0.83
  });

  it('cruza el umbral apenas se pasa de 1.2 o se baja de 0.83', () => {
    expect(getOrientation(1201, 1000)).toBe('landscape');
    expect(getOrientation(829, 1000)).toBe('portrait');
  });
});
