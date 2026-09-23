import { describe, it, expect } from 'vitest';
import { buildSheets, pdfFileName, PDF_FORMATS, DEFAULT_PDF_FORMAT } from '../src/pdfFormat.js';

describe('buildSheets', () => {
  it('devuelve una lista vacía sin páginas', () => {
    expect(buildSheets(0, 'a4')).toEqual([]);
    expect(buildSheets(0, 'a3')).toEqual([]);
  });

  it('con A4 pone una página por hoja', () => {
    expect(buildSheets(1, 'a4')).toEqual([[0]]);
    expect(buildSheets(3, 'a4')).toEqual([[0], [1], [2]]);
    expect(buildSheets(4, 'a4')).toEqual([[0], [1], [2], [3]]);
  });

  it('con A3 pone dos páginas seguidas por hoja', () => {
    expect(buildSheets(4, 'a3')).toEqual([
      [0, 1],
      [2, 3],
    ]);
  });

  it('con A3 y páginas impares deja en null la mitad vacía de la última hoja', () => {
    expect(buildSheets(1, 'a3')).toEqual([[0, null]]);
    expect(buildSheets(3, 'a3')).toEqual([
      [0, 1],
      [2, null],
    ]);
  });

  it('trata un formato desconocido como A4', () => {
    expect(buildSheets(3, 'carta')).toEqual([[0], [1], [2]]);
  });
});

describe('pdfFileName', () => {
  it('arma el nombre en kebab-case a partir del título', () => {
    expect(pdfFileName('Mis Vacaciones 2024!', 'a4')).toBe('mis-vacaciones-2024.pdf');
  });

  it('usa "comic" sin título', () => {
    expect(pdfFileName('', 'a4')).toBe('comic.pdf');
    expect(pdfFileName('', 'a3')).toBe('comic-a3.pdf');
  });

  it('quita las tildes', () => {
    expect(pdfFileName('Canción del Árbol', 'a4')).toBe('cancion-del-arbol.pdf');
    expect(pdfFileName('Canción del Árbol', 'a3')).toBe('cancion-del-arbol-a3.pdf');
  });

  it('agrega el sufijo -a3 con A3', () => {
    expect(pdfFileName('Mis Vacaciones 2024!', 'a3')).toBe('mis-vacaciones-2024-a3.pdf');
  });

  it('usa A4 por defecto', () => {
    expect(pdfFileName('Hola')).toBe('hola.pdf');
  });
});

describe('PDF_FORMATS', () => {
  it('incluye el formato por defecto', () => {
    expect(PDF_FORMATS[DEFAULT_PDF_FORMAT]).toBeDefined();
  });
});
