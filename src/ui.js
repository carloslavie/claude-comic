// Interfaz: carga de imágenes, título, lista de miniaturas, mensajes y vista previa.
import {
  state,
  addFiles,
  moveImage,
  removeImage,
  setTitle,
  setPageColor,
  setPageColorOverride,
  clearPageColorOverride,
  prunePageColors,
  setPageTemplateOverride,
  setTitleStyle,
  resetTitleStyle,
  clearPageTemplateOverride,
  prunePageTemplates,
  setPdfFormat,
  MAX_IMAGES,
} from './state.js';
import { TEMPLATES } from './templates.js';
import { buildPages } from './layout.js';
import { renderPage, PAGE_WIDTH_MM, PAGE_HEIGHT_MM } from './render.js';
import { exportPdf } from './pdf.js';
import { resolvePageColor, PALETTE } from './colors.js';
import { TITLE_SIZES, TITLE_FONTS, TITLE_POSITIONS, TITLE_OUTLINES } from './titleStyle.js';
import { PDF_FORMATS } from './pdfFormat.js';

// Resolución de cada página en la vista previa (la mitad de los 150 DPI del PDF);
// el CSS la escala al ancho disponible.
const PREVIEW_WIDTH = 620;
const PREVIEW_HEIGHT = Math.round((PREVIEW_WIDTH * PAGE_HEIGHT_MM) / PAGE_WIDTH_MM);

export function initUI() {
  const fileInput = document.getElementById('file-input');
  const dropZone = document.getElementById('drop-zone');
  const titleInput = document.getElementById('title-input');
  const titleStyle = document.getElementById('title-style');
  const titleStyleControls = document.getElementById('title-style-controls');
  const titleStyleReset = document.getElementById('title-style-reset');
  const pageColor = document.getElementById('page-color');
  const thumbList = document.getElementById('thumb-list');
  const imageCount = document.getElementById('image-count');
  const messages = document.getElementById('messages');
  const preview = document.getElementById('preview');
  const previewEmpty = document.getElementById('preview-empty');
  const pdfButton = document.getElementById('pdf-button');
  const pdfFormat = document.getElementById('pdf-format');
  let exporting = false;

  // El formato solo afecta al PDF: cambiarlo no redibuja la vista previa.
  for (const format of Object.values(PDF_FORMATS)) {
    const option = document.createElement('option');
    option.value = format.id;
    option.textContent = format.label;
    pdfFormat.append(option);
  }
  pdfFormat.value = state.pdfFormat;
  pdfFormat.addEventListener('change', () => setPdfFormat(pdfFormat.value));

  async function handleFiles(files) {
    const rejected = await addFiles(files);
    showMessages(messages, rejected);
    refresh();
  }

  // Se llama después de cada cambio de estado.
  function refresh() {
    renderThumbs(thumbList);
    imageCount.textContent = `${state.images.length} / ${MAX_IMAGES} imágenes`;
    pdfButton.disabled = exporting || state.images.length === 0;
    pdfFormat.disabled = pdfButton.disabled;
    schedulePreview();
  }

  pdfButton.addEventListener('click', async () => {
    exporting = true;
    pdfButton.disabled = true;
    pdfFormat.disabled = true;
    pdfButton.textContent = 'Generando…';
    try {
      const pages = buildPages(state.images, state.title, state.pageTemplateOverrides);
      const imagesById = new Map(state.images.map((img) => [img.id, img]));
      const backgrounds = pages.map((_, index) => resolvePageColor(index, state.pageColor, state.pageColorOverrides));
      await loadTitleFont();
      await exportPdf(
        pages,
        imagesById,
        state.title,
        backgrounds,
        state.titleStyle,
        state.pdfFormat,
        state.pageColor,
      );
    } catch (error) {
      console.error(error);
      showErrors(messages, ['No se pudo generar el PDF.']);
    } finally {
      exporting = false;
      pdfButton.textContent = 'Descargar PDF';
      refresh();
    }
  });

  // Agrupa varios cambios seguidos (por ejemplo, al tipear el título) en un solo redibujo.
  let previewFrame = 0;
  function schedulePreview() {
    cancelAnimationFrame(previewFrame);
    previewFrame = requestAnimationFrame(() => renderPreview(preview, previewEmpty, refresh));
  }

  fileInput.addEventListener('change', () => {
    const files = [...fileInput.files];
    fileInput.value = ''; // permite volver a elegir los mismos archivos
    handleFiles(files);
  });

  // Evita que el navegador abra la imagen si se suelta fuera de la zona de drop.
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => e.preventDefault());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('is-over');
  });
  dropZone.addEventListener('dragleave', (e) => {
    if (!dropZone.contains(e.relatedTarget)) dropZone.classList.remove('is-over');
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('is-over');
    handleFiles([...e.dataTransfer.files]);
  });

  // Redibuja cuando termina de cargar la fuente del título, si hacía falta cargarla.
  function refreshWhenTitleFontLoads() {
    loadTitleFont().then((loaded) => {
      if (loaded) refresh();
    });
  }

  // Sin título no hay portada: el estilo queda deshabilitado, pero se conserva.
  function updateTitleStyleEnabled() {
    titleStyle.disabled = state.title.trim() === '';
  }

  titleInput.addEventListener('input', () => {
    setTitle(titleInput.value);
    updateTitleStyleEnabled();
    refresh();
    refreshWhenTitleFontLoads();
  });

  // Al cambiar de fuente, la nueva se carga antes de redibujar.
  async function handleTitleStyleChange(key) {
    if (key === 'font') await loadTitleFont();
    refresh();
  }

  // Los selectores de color solo se actualizan al elegir un color: se vuelven a armar
  // todos los controles con los valores por defecto. La fuente por defecto puede no
  // estar cargada todavía.
  titleStyleReset.addEventListener('click', async () => {
    resetTitleStyle();
    renderTitleStyleControls(titleStyleControls, handleTitleStyleChange);
    await loadTitleFont();
    refresh();
  });

  renderTitleStyleControls(titleStyleControls, handleTitleStyleChange);
  updateTitleStyleEnabled();

  pageColor.append(
    createColorPicker({
      value: state.pageColor,
      label: 'Color de fondo',
      onChange: (color) => {
        setPageColor(color);
        refresh();
      },
    }),
  );

  thumbList.addEventListener('click', (e) => {
    const button = e.target.closest('button[data-action]');
    if (!button) return;
    const id = button.closest('li').dataset.id;
    const action = button.dataset.action;
    if (action === 'up') moveImage(id, -1);
    else if (action === 'down') moveImage(id, 1);
    else if (action === 'remove') removeImage(id);
    refresh();
  });

  refresh();
  refreshWhenTitleFontLoads();
}

/**
 * Carga la fuente del título para los caracteres del título actual. El canvas no espera
 * a las fuentes: si no está cargada, dibuja con la de respaldo.
 * @returns {Promise<boolean>} true si hubo que cargarla (y conviene redibujar)
 */
async function loadTitleFont() {
  const font = `32px ${TITLE_FONTS[state.titleStyle.font].family}`;
  const text = state.title.trim() || ' ';
  if (document.fonts.check(font, text)) return false;
  try {
    await document.fonts.load(font, text);
    return true;
  } catch {
    return false; // se sigue dibujando con la fuente de respaldo
  }
}

/**
 * @param {HTMLElement} container
 * @param {HTMLElement} emptyHint
 * @param {() => void} onTemplateChange se llama después de cambiar la plantilla de una página
 */
function renderPreview(container, emptyHint, onTemplateChange) {
  const pages = buildPages(state.images, state.title, state.pageTemplateOverrides);
  const imagesById = new Map(state.images.map((img) => [img.id, img]));
  prunePageColors(pages.length);
  prunePageTemplates(pages.length);
  emptyHint.hidden = pages.length > 0;

  container.replaceChildren(
    ...pages.map((page, index) => {
      const figure = document.createElement('figure');
      figure.className = 'preview-page';

      const canvas = document.createElement('canvas');
      canvas.width = PREVIEW_WIDTH;
      canvas.height = PREVIEW_HEIGHT;
      const draw = () =>
        renderPage(
          page,
          imagesById,
          canvas,
          state.title,
          resolvePageColor(index, state.pageColor, state.pageColorOverrides),
          state.titleStyle,
        );
      draw();

      const caption = document.createElement('figcaption');
      caption.textContent = `${index + 1} · ${page.kind === 'cover' ? 'portada' : page.templateId}`;

      // Los cambios de color de una página redibujan solo su canvas: reconstruir toda la
      // vista previa cerraría el selector nativo mientras se arrastra.
      const colorControl = document.createElement('div');
      colorControl.className = 'page-color';

      const makePicker = () =>
        createColorPicker({
          value: resolvePageColor(index, state.pageColor, state.pageColorOverrides),
          label: `Color de fondo de la página ${index + 1}`,
          onChange: (color) => {
            setPageColorOverride(index, color);
            resetButton.disabled = false;
            draw();
          },
        });

      const resetButton = document.createElement('button');
      resetButton.type = 'button';
      resetButton.className = 'page-color-reset';
      resetButton.textContent = 'Usar global';
      resetButton.title = `Usar el color global en la página ${index + 1}`;
      resetButton.disabled = !Object.hasOwn(state.pageColorOverrides, index);
      resetButton.addEventListener('click', () => {
        clearPageColorOverride(index);
        resetButton.disabled = true;
        picker.replaceWith((picker = makePicker()));
        draw();
      });

      let picker = makePicker();
      colorControl.append(picker, resetButton);

      if (page.kind === 'panels') {
        figure.append(canvas, caption, createTemplateControl(page, index, onTemplateChange), colorControl);
      } else {
        figure.append(canvas, caption, colorControl);
      }
      return figure;
    }),
  );
}

/**
 * Arma los controles del estilo del título con los valores actuales de state.titleStyle.
 * @param {HTMLElement} container
 * @param {(key: string) => void} onChange recibe la clave de state.titleStyle que cambió
 */
function renderTitleStyleControls(container, onChange) {
  container.replaceChildren(
    createTitleStyleSelect('Tamaño', TITLE_SIZES, 'size', onChange),
    createTitleStyleSelect('Fuente', TITLE_FONTS, 'font', onChange),
    createTitleStyleSelect('Posición', TITLE_POSITIONS, 'position', onChange),
    createTitleStyleColor('Color del texto', 'color', onChange),
    createTitleStyleColor('Color del contorno', 'outlineColor', onChange),
    createTitleStyleSelect('Grosor del contorno', TITLE_OUTLINES, 'outline', onChange),
  );
}

/**
 * Selector de color de una opción del estilo del título.
 * @param {string} label
 * @param {string} key clave de state.titleStyle
 * @param {(key: string) => void} onChange
 * @returns {HTMLDivElement}
 */
function createTitleStyleColor(label, key, onChange) {
  const field = document.createElement('div');
  field.className = 'title-style-field title-style-color';

  const text = document.createElement('span');
  text.textContent = label;

  field.append(
    text,
    createColorPicker({
      value: state.titleStyle[key],
      label,
      onChange: (color) => {
        setTitleStyle({ [key]: color });
        onChange(key);
      },
    }),
  );
  return field;
}

/**
 * Desplegable de una opción del estilo del título, con las opciones de `catalog` en orden.
 * @param {string} label
 * @param {Record<string, {label: string}>} catalog
 * @param {string} key clave de state.titleStyle
 * @param {(key: string) => void} onChange
 * @returns {HTMLLabelElement}
 */
function createTitleStyleSelect(label, catalog, key, onChange) {
  const field = document.createElement('label');
  field.className = 'title-style-field';

  const text = document.createElement('span');
  text.textContent = label;

  const select = document.createElement('select');
  select.append(
    ...Object.entries(catalog).map(([value, item]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = item.label;
      return option;
    }),
  );
  select.value = state.titleStyle[key];
  select.addEventListener('change', () => {
    setTitleStyle({ [key]: select.value });
    onChange(key);
  });

  field.append(text, select);
  return field;
}

// Plantillas en el orden del desplegable: de 1 a 4 viñetas.
const TEMPLATE_OPTIONS = Object.values(TEMPLATES).sort((a, b) => a.panels.length - b.panels.length);
const AUTO_VALUE = 'auto';

const templateText = (template) => `${template.panels.length} · ${template.label}`;

/**
 * Desplegable de plantilla de una página de viñetas, con el aviso de "no entra".
 * Cambiarlo reconstruye toda la vista previa: el <select> ya se cerró cuando llega
 * `change`, y la elección reacomoda las páginas siguientes.
 * @param {{templateId: string, layoutMode: 'auto' | 'manual' | 'fallback', available: number}} page
 * @param {number} index índice de página, 0-based
 * @param {() => void} onChange
 * @returns {HTMLDivElement}
 */
function createTemplateControl(page, index, onChange) {
  const control = document.createElement('div');
  control.className = 'page-template';

  const select = document.createElement('select');
  select.setAttribute('aria-label', `Plantilla de la página ${index + 1}`);

  // En modo manual la plantilla del canvas es la elegida, no la automática.
  const auto = document.createElement('option');
  auto.value = AUTO_VALUE;
  auto.textContent =
    page.layoutMode === 'manual' ? 'Automático' : `Automático (${templateText(TEMPLATES[page.templateId])})`;

  const options = TEMPLATE_OPTIONS.map((template) => {
    const option = document.createElement('option');
    option.value = template.id;
    option.textContent = templateText(template);
    option.disabled = template.panels.length > page.available;
    return option;
  });

  select.append(auto, ...options);
  select.value = page.layoutMode === 'auto' ? AUTO_VALUE : state.pageTemplateOverrides[index];

  select.addEventListener('change', () => {
    if (select.value === AUTO_VALUE) clearPageTemplateOverride(index);
    else setPageTemplateOverride(index, select.value);
    onChange();
  });

  control.append(select);

  if (page.layoutMode === 'fallback') {
    const warning = document.createElement('span');
    warning.className = 'page-template-warning';
    warning.textContent = 'No hay fotos suficientes: se usa Automático';
    control.append(warning);
  }

  return control;
}

function renderThumbs(list) {
  list.replaceChildren(
    ...state.images.map((img, index) => {
      const li = document.createElement('li');
      li.className = 'thumb';
      li.dataset.id = img.id;

      const pic = document.createElement('img');
      pic.src = img.url;
      pic.alt = '';

      const name = document.createElement('span');
      name.className = 'thumb-name';
      name.textContent = `${index + 1}. ${img.name}`;
      name.title = img.name;

      const actions = document.createElement('div');
      actions.className = 'thumb-actions';
      actions.append(
        makeButton('up', '↑', `Subir ${img.name}`, index === 0),
        makeButton('down', '↓', `Bajar ${img.name}`, index === state.images.length - 1),
        makeButton('remove', '✕', `Quitar ${img.name}`, false),
      );

      li.append(pic, name, actions);
      return li;
    }),
  );
}

/**
 * Selector de color: botones con la paleta predefinida y un <input type="color"> libre.
 * Marca con aria-pressed el botón que coincide con el color actual y se actualiza solo
 * cuando el usuario elige un color.
 * @param {{value: string, onChange: (color: string) => void, label: string}} options
 * @returns {HTMLDivElement}
 */
function createColorPicker({ value, onChange, label }) {
  const picker = document.createElement('div');
  picker.className = 'color-picker';
  picker.setAttribute('role', 'group');
  picker.setAttribute('aria-label', label);

  const swatches = PALETTE.map(({ name, value: color }) => {
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = color;
    swatch.dataset.color = color;
    swatch.setAttribute('aria-label', name);
    swatch.title = name;
    swatch.addEventListener('click', () => select(color));
    return swatch;
  });

  const custom = document.createElement('input');
  custom.type = 'color';
  custom.className = 'color-custom';
  custom.setAttribute('aria-label', `${label}: otro color`);
  custom.title = 'Otro color';
  custom.addEventListener('input', () => select(custom.value));

  function mark(color) {
    custom.value = color;
    for (const swatch of swatches) {
      swatch.setAttribute('aria-pressed', String(swatch.dataset.color === color));
    }
  }

  function select(color) {
    mark(color);
    onChange(color);
  }

  mark(value);
  picker.append(...swatches, custom);
  return picker;
}

function makeButton(action, label, ariaLabel, disabled) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.action = action;
  button.textContent = label;
  button.setAttribute('aria-label', ariaLabel);
  button.title = ariaLabel;
  button.disabled = disabled;
  return button;
}

function showMessages(container, rejected) {
  const byReason = (reason) => rejected.filter((r) => r.reason === reason);
  const lines = [];

  const badType = byReason('type');
  if (badType.length) {
    lines.push(`Formato no admitido (solo JPG, PNG o WebP): ${names(badType)}.`);
  }
  const badDecode = byReason('decode');
  if (badDecode.length) {
    lines.push(`No se pudieron leer: ${names(badDecode)}.`);
  }
  const overLimit = byReason('limit');
  if (overLimit.length) {
    const n = overLimit.length;
    lines.push(
      `Se alcanzó el límite de ${MAX_IMAGES} imágenes: ${n} ${n === 1 ? 'imagen rechazada' : 'imágenes rechazadas'}.`,
    );
  }

  showErrors(container, lines);
}

function showErrors(container, lines) {
  container.replaceChildren(
    ...lines.map((text) => {
      const p = document.createElement('p');
      p.className = 'message message-error';
      p.textContent = text;
      return p;
    }),
  );
}

function names(items) {
  return items.map((r) => r.name).join(', ');
}
