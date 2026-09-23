import { describe, it, expect } from 'vitest';
import { buildPages, prunePageTemplateOverrides } from '../src/layout.js';
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
        { kind: 'panels', templateId: '1-full', imageIds: ['img-1'], layoutMode: 'auto', available: 1 },
      ]);
    });

    it('con título agrega portada y repite la imagen en 1-full', () => {
      expect(buildPages(makeImages('P'), 'Vacaciones')).toEqual([
        { kind: 'cover', templateId: null, imageIds: ['img-1'], layoutMode: 'auto', available: 1 },
        { kind: 'panels', templateId: '1-full', imageIds: ['img-1'], layoutMode: 'auto', available: 1 },
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
        { kind: 'panels', templateId: '3-top-wide', imageIds: ['img-1', 'img-2', 'img-3'], layoutMode: 'auto', available: 3 },
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
        { kind: 'panels', templateId: '4-grid', imageIds: ['img-1', 'img-2', 'img-3', 'img-4'], layoutMode: 'auto', available: 4 },
      ]);
    });

    it('4 portrait con título: portada + 4-grid con las mismas 4', () => {
      const pages = buildPages(makeImages('PPPP'), 'Retratos');
      expect(pages[0]).toEqual({ kind: 'cover', templateId: null, imageIds: ['img-1'], layoutMode: 'auto', available: 1 });
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
        { kind: 'panels', templateId: '3-top-wide', imageIds: ['img-1', 'img-2', 'img-3'], layoutMode: 'auto', available: 7 },
        { kind: 'panels', templateId: '3-top-wide', imageIds: ['img-4', 'img-5', 'img-6'], layoutMode: 'auto', available: 4 },
        { kind: 'panels', templateId: '1-full', imageIds: ['img-7'], layoutMode: 'auto', available: 1 },
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

  describe('plantilla elegida por página', () => {
    const modes = (pages) => pages.map((p) => p.layoutMode);

    it('sin elecciones da el mismo resultado que sin el parámetro', () => {
      const images = makeImages('LPSPPPPLLSPL');
      expect(buildPages(images, 'Título', {})).toEqual(buildPages(images, 'Título'));
    });

    it('respeta la plantilla elegida y la marca como manual', () => {
      const pages = buildPages(makeImages('LLL'), '', { 0: '2-cols' });
      expect(pages[0]).toMatchObject({ templateId: '2-cols', imageIds: ['img-1', 'img-2'], layoutMode: 'manual' });
    });

    it('reacomoda las páginas siguientes con las imágenes que quedan', () => {
      const pages = buildPages(makeImages('LLLLLLL'), '', { 0: '4-grid' });
      expect(pages).toEqual([
        { kind: 'panels', templateId: '4-grid', imageIds: ['img-1', 'img-2', 'img-3', 'img-4'], layoutMode: 'manual', available: 7 },
        { kind: 'panels', templateId: '3-top-wide', imageIds: ['img-5', 'img-6', 'img-7'], layoutMode: 'auto', available: 3 },
      ]);
    });

    it('conserva la elección de una página posterior aunque cambien sus imágenes', () => {
      const pages = buildPages(makeImages('LLLLLLLLL'), '', { 0: '2-rows', 2: '1-full' });
      expect(templateIds(pages)).toEqual(['2-rows', '3-top-wide', '1-full', '3-top-wide']);
      expect(modes(pages)).toEqual(['manual', 'auto', 'manual', 'auto']);

      const changed = buildPages(makeImages('LLLLLLLLL'), '', { 0: '4-grid', 2: '1-full' });
      expect(templateIds(changed)).toEqual(['4-grid', '3-top-wide', '1-full', '1-full']);
      expect(changed[2]).toMatchObject({ imageIds: ['img-8'], layoutMode: 'manual' });
    });

    it('si no quedan imágenes suficientes usa la regla automática y marca fallback', () => {
      const pages = buildPages(makeImages('LLLLL'), '', { 1: '4-grid' });
      expect(pages[1]).toEqual({
        kind: 'panels',
        templateId: '2-rows',
        imageIds: ['img-4', 'img-5'],
        layoutMode: 'fallback',
        available: 2,
      });
    });

    it('aplica la elección cuando las imágenes alcanzan justo', () => {
      const pages = buildPages(makeImages('LLLLLLL'), '', { 1: '4-grid' });
      expect(pages[1]).toMatchObject({ templateId: '4-grid', layoutMode: 'manual', available: 4 });
    });

    it('ignora una elección en el índice de la portada', () => {
      const pages = buildPages(makeImages('LLL'), 'Título', { 0: '1-full' });
      expect(pages[0]).toMatchObject({ kind: 'cover', templateId: null, layoutMode: 'auto' });
      expect(templateIds(pages)).toEqual([null, '3-top-wide']);
    });

    it('con portada, el índice 1 es la primera página de viñetas', () => {
      const pages = buildPages(makeImages('LLL'), 'Título', { 1: '1-full' });
      expect(templateIds(pages)).toEqual([null, '1-full', '2-rows']);
    });

    it('ignora un id de plantilla que no existe', () => {
      for (const bad of ['no-existe', 'constructor', 'toString']) {
        const pages = buildPages(makeImages('LLL'), '', { 0: bad });
        expect(pages[0]).toMatchObject({ templateId: '3-top-wide', layoutMode: 'auto' });
      }
    });

    it('cada página sigue teniendo tantas imágenes como viñetas', () => {
      const pages = buildPages(makeImages('LPSPPPPLLSPL'), '', { 0: '1-full', 1: '4-grid', 3: '2-cols', 5: '4-grid' });
      for (const page of pages) {
        expect(page.imageIds).toHaveLength(TEMPLATES[page.templateId].panels.length);
      }
    });
  });

  describe('plantillas espejadas', () => {
    const MIRRORED = ['3-bottom-wide', '3-right-tall'];

    it.each(MIRRORED)('%s elegida con 3 imágenes queda manual', (id) => {
      expect(buildPages(makeImages('LLL'), '', { 0: id })).toEqual([
        { kind: 'panels', templateId: id, imageIds: ['img-1', 'img-2', 'img-3'], layoutMode: 'manual', available: 3 },
      ]);
    });

    it.each(MIRRORED)('%s elegida con 2 imágenes queda en fallback', (id) => {
      expect(buildPages(makeImages('LL'), '', { 0: id })).toEqual([
        { kind: 'panels', templateId: '2-rows', imageIds: ['img-1', 'img-2'], layoutMode: 'fallback', available: 2 },
      ]);
    });

    it('la regla automática nunca las elige', () => {
      // Todas las combinaciones de L/P/S de 1 a 6 imágenes.
      let patterns = [''];
      for (let n = 1; n <= 6; n++) {
        patterns = patterns.flatMap((p) => [...'LPS'].map((c) => p + c));
        for (const pattern of patterns) {
          for (const id of templateIds(buildPages(makeImages(pattern), ''))) {
            expect(MIRRORED).not.toContain(id);
          }
        }
      }
    });
  });
});

describe('TEMPLATES', () => {
  // Área de la intersección entre dos viñetas (0 si no se tocan o solo comparten borde).
  const overlap = (a, b) =>
    Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) *
    Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

  it.each(['3-bottom-wide', '3-right-tall'])('%s cubre el área útil sin solaparse', (id) => {
    const { panels } = TEMPLATES[id];
    for (const p of panels) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.x + p.w).toBeLessThanOrEqual(1);
      expect(p.y + p.h).toBeLessThanOrEqual(1);
    }
    for (let i = 0; i < panels.length; i++) {
      for (let j = i + 1; j < panels.length; j++) {
        expect(overlap(panels[i], panels[j])).toBe(0);
      }
    }
    expect(panels.reduce((sum, p) => sum + p.w * p.h, 0)).toBeCloseTo(1);
  });
});

describe('prunePageTemplateOverrides', () => {
  it('conserva los índices de páginas que existen y descarta el resto', () => {
    expect(prunePageTemplateOverrides({ 0: '1-full', 2: '4-grid', 3: '2-rows' }, 3)).toEqual({ 0: '1-full', 2: '4-grid' });
  });

  it('con 0 páginas devuelve un objeto vacío', () => {
    expect(prunePageTemplateOverrides({ 0: '1-full' }, 0)).toEqual({});
  });

  it('no muta la entrada', () => {
    const overrides = { 0: '1-full', 5: '4-grid' };
    const pruned = prunePageTemplateOverrides(overrides, 1);
    expect(overrides).toEqual({ 0: '1-full', 5: '4-grid' });
    expect(pruned).not.toBe(overrides);
  });
});
