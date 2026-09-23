import { describe, it, expect } from 'vitest';
import { resolvePageColor, prunePageColorOverrides, PALETTE, DEFAULT_PAGE_COLOR } from '../src/colors.js';

describe('resolvePageColor', () => {
  it('usa el color global si la página no tiene color propio', () => {
    expect(resolvePageColor(0, '#ffd23f', {})).toBe('#ffd23f');
  });

  it('usa el color propio de la página si lo tiene', () => {
    expect(resolvePageColor(1, '#ffd23f', { 1: '#e63946' })).toBe('#e63946');
  });

  it('usa el color global para un índice que no está en los colores propios', () => {
    expect(resolvePageColor(5, '#1d70b8', { 0: '#e63946', 2: '#2a9d8f' })).toBe('#1d70b8');
  });
});

describe('prunePageColorOverrides', () => {
  it('conserva solo los índices menores que la cantidad de páginas', () => {
    const overrides = { 0: '#e63946', 2: '#2a9d8f', 3: '#1d70b8' };
    expect(prunePageColorOverrides(overrides, 3)).toEqual({ 0: '#e63946', 2: '#2a9d8f' });
  });

  it('devuelve un objeto vacío con 0 páginas', () => {
    expect(prunePageColorOverrides({ 0: '#e63946' }, 0)).toEqual({});
  });

  it('no muta la entrada', () => {
    const overrides = { 0: '#e63946', 4: '#2a9d8f' };
    const result = prunePageColorOverrides(overrides, 1);
    expect(overrides).toEqual({ 0: '#e63946', 4: '#2a9d8f' });
    expect(result).not.toBe(overrides);
  });
});

describe('PALETTE', () => {
  it('tiene 8 colores en formato #rrggbb en minúsculas e incluye el color por defecto', () => {
    expect(PALETTE).toHaveLength(8);
    for (const { value } of PALETTE) expect(value).toMatch(/^#[0-9a-f]{6}$/);
    expect(PALETTE.map((c) => c.value)).toContain(DEFAULT_PAGE_COLOR);
  });
});
