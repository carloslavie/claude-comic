import { describe, it, expect } from 'vitest';
import { TOOLS, toolHash, resolveRoute, documentTitle } from '../src/tools.js';

describe('resolveRoute', () => {
  it('sin hash muestra el menú y deja la URL como está', () => {
    expect(resolveRoute('')).toEqual({ view: 'home', hash: '' });
  });

  it('con #/ muestra el menú', () => {
    expect(resolveRoute('#/')).toEqual({ view: 'home', hash: '#/' });
  });

  it('con #/comic muestra el comic', () => {
    expect(resolveRoute('#/comic')).toEqual({ view: 'comic', hash: '#/comic' });
  });

  it('manda al menú las herramientas no disponibles', () => {
    expect(resolveRoute('#/cuadros')).toEqual({ view: 'home', hash: '#/' });
    expect(resolveRoute('#/stickers')).toEqual({ view: 'home', hash: '#/' });
  });

  it('manda al menú un hash desconocido', () => {
    expect(resolveRoute('#/xyz')).toEqual({ view: 'home', hash: '#/' });
  });
});

describe('documentTitle', () => {
  it('en el menú es el nombre de la app', () => {
    expect(documentTitle('home')).toBe('PictureFactory');
  });

  it('en el comic antepone el nombre de la herramienta', () => {
    expect(documentTitle('comic')).toBe('Comic · PictureFactory');
  });

  it('una vista desconocida devuelve el nombre de la app', () => {
    expect(documentTitle('xyz')).toBe('PictureFactory');
  });
});

describe('toolHash', () => {
  it('arma el hash de una herramienta', () => {
    expect(toolHash('comic')).toBe('#/comic');
  });
});

describe('TOOLS', () => {
  it('cada clave coincide con su id', () => {
    for (const [key, tool] of Object.entries(TOOLS)) expect(tool.id).toBe(key);
  });
});
