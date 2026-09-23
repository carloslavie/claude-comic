import { describe, it, expect } from 'vitest';
import { buildPages } from '../src/layout.js';
import { TEMPLATES } from '../src/templates.js';

// Crea imágenes de prueba a partir de una cadena de orientaciones:
// L = landscape, P = portrait, S = square.
const ORIENTATIONS = { L: 'landscape', P: 'portrait', S: 'square' };
function makeImages(pattern) {
  return [...pattern].map((c, i) => ({ id: `img-${i + 1}`, orientation: ORIENTATIONS[c] }));
}

const templateIds = (pages) => pages.map((p) => p.templateId);

describe('buildPages', () => {
  describe('sin imágenes', () => {
    it('devuelve [] sin título', () => {
      expect(buildPages([], '')).toEqual([]);
    });

    it('devuelve [] aunque haya título', () => {
      expect(buildPages([], 'Mi comic')).toEqual([]);
    });
  });

  describe('1 imagen', () => {
    it('usa 1-full', () => {
      expect(buildPages(makeImages('L'), '')).toEqual([
        { kind: 'panels', templateId: '1-full', imageIds: ['img-1'] },
      ]);
    });

    it('con título agrega portada y repite la imagen en 1-full', () => {
      expect(buildPages(makeImages('P'), 'Vacaciones')).toEqual([
        { kind: 'cover', templateId: null, imageIds: ['img-1'] },
        { kind: 'panels', templateId: '1-full', imageIds: ['img-1'] },
      ]);
    });
  });

  describe('2 imágenes', () => {
    it('usa 2-rows si la primera es landscape', () => {
      expect(templateIds(buildPages(makeImages('LP'), ''))).toEqual(['2-rows']);
    });

    it('usa 2-cols si la primera es portrait', () => {
      expect(templateIds(buildPages(makeImages('PL'), ''))).toEqual(['2-cols']);
    });

    it('usa 2-cols si la primera es square', () => {
      expect(templateIds(buildPages(makeImages('SL'), ''))).toEqual(['2-cols']);
    });
  });

  describe('3 imágenes', () => {
    it('usa 3-top-wide si la primera es landscape', () => {
      expect(buildPages(makeImages('LPP'), '')).toEqual([
        { kind: 'panels', templateId: '3-top-wide', imageIds: ['img-1', 'img-2', 'img-3'] },
      ]);
    });

    it('usa 3-left-tall si la primera es portrait', () => {
      expect(templateIds(buildPages(makeImages('PLL'), ''))).toEqual(['3-left-tall']);
    });

    it('usa 3-left-tall si la primera es square', () => {
      expect(templateIds(buildPages(makeImages('SSS'), ''))).toEqual(['3-left-tall']);
    });

    it('con título agrega portada antes de las viñetas', () => {
      expect(templateIds(buildPages(makeImages('LLL'), 'Título'))).toEqual([null, '3-top-wide']);
    });
  });

  describe('4 imágenes', () => {
    it('4 portrait usan una sola página 4-grid', () => {
      expect(buildPages(makeImages('PPPP'), '')).toEqual([
        { kind: 'panels', templateId: '4-grid', imageIds: ['img-1', 'img-2', 'img-3', 'img-4'] },
      ]);
    });

    it('4 portrait con título: portada + 4-grid con las mismas 4', () => {
      const pages = buildPages(makeImages('PPPP'), 'Retratos');
      expect(pages[0]).toEqual({ kind: 'cover', templateId: null, imageIds: ['img-1'] });
      expect(pages[1].templateId).toBe('4-grid');
      expect(pages[1].imageIds).toEqual(['img-1', 'img-2', 'img-3', 'img-4']);
    });

    it('si alguna de las 4 no es portrait, usa 3 + 1', () => {
      expect(templateIds(buildPages(makeImages('PPPL'), ''))).toEqual(['3-left-tall', '1-full']);
    });

    it('4 landscape usan 3-top-wide + 1-full', () => {
      expect(templateIds(buildPages(makeImages('LLLL'), ''))).toEqual(['3-top-wide', '1-full']);
    });
  });

  describe('7 imágenes', () => {
    it('7 landscape sin título: 3-top-wide, 3-top-wide, 1-full', () => {
      const pages = buildPages(makeImages('LLLLLLL'), '');
      expect(pages).toEqual([
        { kind: 'panels', templateId: '3-top-wide', imageIds: ['img-1', 'img-2', 'img-3'] },
        { kind: 'panels', templateId: '3-top-wide', imageIds: ['img-4', 'img-5', 'img-6'] },
        { kind: 'panels', templateId: '1-full', imageIds: ['img-7'] },
      ]);
    });

    it('7 landscape con título: portada + las mismas 3 páginas', () => {
      const pages = buildPages(makeImages('LLLLLLL'), 'Viaje');
      expect(templateIds(pages)).toEqual([null, '3-top-wide', '3-top-wide', '1-full']);
      expect(pages[0].kind).toBe('cover');
    });

    it('7 portrait: 4-grid + 3-left-tall', () => {
      expect(templateIds(buildPages(makeImages('PPPPPPP'), ''))).toEqual(['4-grid', '3-left-tall']);
    });

    it('orientaciones mezcladas', () => {
      // PPPP → 4-grid; LSP → 3-top-wide
      expect(templateIds(buildPages(makeImages('PPPPLSP'), ''))).toEqual(['4-grid', '3-top-wide']);
    });
  });

  describe('invariantes', () => {
    it('conserva el orden y usa cada imagen exactamente una vez en las viñetas', () => {
      const images = makeImages('LPSPPPPLLSPL');
      const pages = buildPages(images, 'Título');
      const used = pages.filter((p) => p.kind === 'panels').flatMap((p) => p.imageIds);
      expect(used).toEqual(images.map((img) => img.id));
    });

    it('cada página tiene tantas imágenes como viñetas su plantilla', () => {
      const pages = buildPages(makeImages('LPSPPPPLLSPLPPPP'), '');
      for (const page of pages) {
        expect(page.imageIds).toHaveLength(TEMPLATES[page.templateId].panels.length);
      }
    });

    it('un título con solo espacios no genera portada', () => {
      expect(buildPages(makeImages('L'), '   ')[0].kind).toBe('panels');
    });
  });
});
