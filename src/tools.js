// Herramientas del menú inicial y reglas de navegación por hash. Lógica pura.

export const APP_NAME = 'PictureFactory';

// El orden de inserción es el orden de las tarjetas del menú.
export const TOOLS = {
  comic: {
    id: 'comic',
    title: 'Creá un comic',
    description: 'Cargá tus fotos y armalas como páginas de una historieta en PDF.',
    tabTitle: 'Comic',
    available: true,
  },
  cuadros: {
    id: 'cuadros',
    title: 'Creá imágenes para cuadros',
    description: 'Prepará tus fotos para imprimir y enmarcar.',
    tabTitle: 'Cuadros',
    available: true,
  },
  stickers: {
    id: 'stickers',
    title: 'Creá plantillas para stickers',
    description: 'Armá hojas de stickers listas para imprimir y recortar.',
    tabTitle: 'Stickers',
    available: true,
  },
};

/**
 * Hash de una herramienta: 'comic' → '#/comic'.
 * @param {string} id clave de TOOLS
 */
export function toolHash(id) {
  return `#/${id}`;
}

/**
 * Vista que corresponde a un hash y el hash que tiene que quedar en la URL.
 * Sin hash o '#/' es el menú. Un hash inválido o de una herramienta no disponible
 * manda al menú con '#/'.
 * @param {string} hash location.hash
 * @returns {{ view: string, hash: string }}
 */
export function resolveRoute(hash) {
  if (hash === '' || hash === '#/') return { view: 'home', hash };
  const tool = Object.values(TOOLS).find((t) => t.available && toolHash(t.id) === hash);
  if (tool) return { view: tool.id, hash };
  return { view: 'home', hash: '#/' };
}

/**
 * Texto de la pestaña: 'PictureFactory' en el menú, 'Comic · PictureFactory' en el comic.
 * Una vista desconocida devuelve el nombre de la app.
 * @param {string} view 'home' o clave de TOOLS
 */
export function documentTitle(view) {
  const tool = Object.hasOwn(TOOLS, view) ? TOOLS[view] : null;
  return tool ? `${tool.tabTitle} · ${APP_NAME}` : APP_NAME;
}
