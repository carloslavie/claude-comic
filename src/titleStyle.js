// Estilo del título de la portada: catálogos de opciones y posición del bloque de texto.

// El orden de inserción de cada catálogo es el orden del desplegable.
export const TITLE_SIZES = {
  small: { label: 'Chico', maxMm: 14 },
  medium: { label: 'Mediano', maxMm: 22 },
  large: { label: 'Grande', maxMm: 32 },
};

export const TITLE_FONTS = {
  bangers: { label: 'Bangers', family: '"Bangers", "Impact", sans-serif' },
  luckiest: { label: 'Luckiest Guy', family: '"Luckiest Guy", "Impact", sans-serif' },
  marker: { label: 'Permanent Marker', family: '"Permanent Marker", "Impact", sans-serif' },
  anton: { label: 'Anton', family: '"Anton", "Impact", sans-serif' },
};

export const TITLE_POSITIONS = {
  top: { label: 'Arriba' },
  center: { label: 'Centro' },
  bottom: { label: 'Abajo' },
};

// ratio: grosor del contorno como fracción del tamaño de letra.
export const TITLE_OUTLINES = {
  none: { label: 'Sin contorno', ratio: 0 },
  thin: { label: 'Fino', ratio: 0.07 },
  normal: { label: 'Normal', ratio: 0.14 },
  thick: { label: 'Grueso', ratio: 0.22 },
};

export const DEFAULT_TITLE_STYLE = {
  size: 'medium', // clave de TITLE_SIZES
  font: 'bangers', // clave de TITLE_FONTS
  position: 'center', // clave de TITLE_POSITIONS
  color: '#ffffff', // '#rrggbb', relleno del texto
  outlineColor: '#111111', // '#rrggbb'
  outline: 'normal', // clave de TITLE_OUTLINES
};

// Separación entre el bloque de texto y el borde de la viñeta, en fracción del alto.
const TITLE_EDGE_GAP = 0.05;

/**
 * Coordenada `y` del borde superior del bloque de texto dentro de la viñeta.
 * Una posición desconocida se trata como 'center'.
 * @param {string} position clave de TITLE_POSITIONS
 * @param {number} rectY borde superior de la viñeta
 * @param {number} rectH alto de la viñeta
 * @param {number} blockH alto del bloque de texto
 * @returns {number}
 */
export function titleBlockTop(position, rectY, rectH, blockH) {
  if (position === 'top') return rectY + TITLE_EDGE_GAP * rectH;
  if (position === 'bottom') return rectY + (1 - TITLE_EDGE_GAP) * rectH - blockH;
  return rectY + (rectH - blockH) / 2;
}
