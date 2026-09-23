// Interfaz: carga de imágenes, título, lista de miniaturas, mensajes y vista previa.
import { state, addFiles, moveImage, removeImage, setTitle, MAX_IMAGES } from './state.js';
import { buildPages } from './layout.js';
import { renderPage, PAGE_WIDTH_MM, PAGE_HEIGHT_MM } from './render.js';
import { exportPdf } from './pdf.js';

// Resolución de cada página en la vista previa (la mitad de los 150 DPI del PDF);
// el CSS la escala al ancho disponible.
const PREVIEW_WIDTH = 620;
const PREVIEW_HEIGHT = Math.round((PREVIEW_WIDTH * PAGE_HEIGHT_MM) / PAGE_WIDTH_MM);

export function initUI() {
  const fileInput = document.getElementById('file-input');
  const dropZone = document.getElementById('drop-zone');
  const titleInput = document.getElementById('title-input');
  const thumbList = document.getElementById('thumb-list');
  const imageCount = document.getElementById('image-count');
  const messages = document.getElementById('messages');
  const preview = document.getElementById('preview');
  const previewEmpty = document.getElementById('preview-empty');
  const pdfButton = document.getElementById('pdf-button');
  let exporting = false;

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
    schedulePreview();
  }

  pdfButton.addEventListener('click', async () => {
    exporting = true;
    pdfButton.disabled = true;
    pdfButton.textContent = 'Generando…';
    try {
      const pages = buildPages(state.images, state.title);
      const imagesById = new Map(state.images.map((img) => [img.id, img]));
      await exportPdf(pages, imagesById, state.title);
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
    previewFrame = requestAnimationFrame(() => renderPreview(preview, previewEmpty));
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

  titleInput.addEventListener('input', () => {
    setTitle(titleInput.value);
    refresh();
  });

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
}

function renderPreview(container, emptyHint) {
  const pages = buildPages(state.images, state.title);
  const imagesById = new Map(state.images.map((img) => [img.id, img]));
  emptyHint.hidden = pages.length > 0;

  container.replaceChildren(
    ...pages.map((page, index) => {
      const figure = document.createElement('figure');
      figure.className = 'preview-page';

      const canvas = document.createElement('canvas');
      canvas.width = PREVIEW_WIDTH;
      canvas.height = PREVIEW_HEIGHT;
      renderPage(page, imagesById, canvas, state.title);

      const caption = document.createElement('figcaption');
      caption.textContent = `${index + 1} · ${page.kind === 'cover' ? 'portada' : page.templateId}`;

      figure.append(canvas, caption);
      return figure;
    }),
  );
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
