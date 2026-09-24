// Menú inicial: tarjetas de herramientas y navegación por hash entre vistas.
import { TOOLS, toolHash, resolveRoute, documentTitle } from './tools.js';

// Íconos de las tarjetas, por id de herramienta. Usan currentColor para tomar el color del texto.
const SVG_OPEN =
  '<svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" ' +
  'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';

const ICONS = {
  // Página de historieta con tres viñetas.
  comic:
    SVG_OPEN +
    '<rect x="8" y="5" width="32" height="38" rx="2"/>' +
    '<rect x="12" y="9" width="24" height="13"/>' +
    '<rect x="12" y="26" width="10" height="13"/>' +
    '<rect x="26" y="26" width="10" height="13"/></svg>',
  // Cuadro enmarcado con un paisaje.
  cuadros:
    SVG_OPEN +
    '<rect x="5" y="9" width="38" height="30" rx="2"/>' +
    '<rect x="10" y="14" width="28" height="20"/>' +
    '<path d="M10 31l8-8 6 6 5-4 9 8"/>' +
    '<circle cx="31" cy="19" r="2"/></svg>',
  // Hoja con stickers redondos y una esquina despegada.
  stickers:
    SVG_OPEN +
    '<path d="M8 5h32v28l-10 10H8z"/>' +
    '<path d="M40 33H30v10"/>' +
    '<circle cx="17" cy="15" r="5"/>' +
    '<circle cx="31" cy="15" r="5"/>' +
    '<circle cx="17" cy="31" r="5"/></svg>',
};

export function initHome() {
  const toolList = document.getElementById('tool-list');
  for (const tool of Object.values(TOOLS)) {
    const li = document.createElement('li');
    li.append(createToolCard(tool));
    toolList.append(li);
  }

  window.addEventListener('hashchange', applyRoute);
  applyRoute();
}

// La tarjeta disponible es un enlace; la de "Próximamente" es un div sin href ni tabindex.
function createToolCard(tool) {
  let card;
  if (tool.available) {
    card = document.createElement('a');
    card.href = toolHash(tool.id);
  } else {
    card = document.createElement('div');
    card.setAttribute('aria-disabled', 'true');
  }
  card.className = tool.available ? 'tool-card' : 'tool-card is-soon';

  const icon = document.createElement('span');
  icon.className = 'tool-card-icon';
  icon.innerHTML = ICONS[tool.id] ?? '';

  const title = document.createElement('h3');
  title.className = 'tool-card-title';
  title.textContent = tool.title;

  const description = document.createElement('p');
  description.className = 'tool-card-description';
  description.textContent = tool.description;

  card.append(icon, title, description);

  if (!tool.available) {
    const soon = document.createElement('span');
    soon.className = 'tool-card-soon';
    soon.textContent = 'Próximamente';
    card.append(soon);
  }
  return card;
}

// Corrige la URL sin sumar entrada al historial, muestra la vista y actualiza cabecera y pestaña.
function applyRoute() {
  const route = resolveRoute(location.hash);
  if (route.hash !== location.hash) history.replaceState(null, '', route.hash);

  for (const view of document.querySelectorAll('[data-view]')) {
    view.hidden = view.dataset.view !== route.view;
  }
  document.getElementById('home-link').hidden = route.view === 'home';
  document.title = documentTitle(route.view);
}
