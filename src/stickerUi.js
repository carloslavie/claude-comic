// Interfaz de la herramienta de stickers: carga de fotos, forma, tamaño, borde, hoja y tarjetas.
import {
  stickerState,
  addStickerFiles,
  removeStickerImage,
  setStickerSize,
  setCustomStickerSize,
  setStickerShape,
  setStickerBorder,
  setStickerBorderColor,
  setStickerSheet,
  setStickerCopies,
  setStickerCrop,
  resetStickerCrop,
  currentStickerSize,
} from './stickerState.js';
import {
  STICKER_SHAPES,
  STICKER_SIZES,
  STICKER_BORDERS,
  COPIES_LIMITS,
  stickerFor,
  expandCopies,
  stickerText,
  stickerPhotoArea,
} from './stickerSizes.js';
import { cropDpi, isLowResolution } from './crop.js';
import { FRAME_SHEETS, packFrames } from './sheetLayout.js';
import { renderSticker } from './stickerRender.js';
import { exportStickersPdf } from './stickerPdf.js';
import { attachCropDrag, createZoomControl, makeCardButton } from './cropControls.js';
import { createColorPicker } from './colorPicker.js';
import { showMessages, showErrors } from './messages.js';

// Lado largo, en px, del canvas de cada sticker en la vista previa; el corto va en proporción.
// El CSS lo escala.
const PREVIEW_SIDE = 400;

export function initStickersUI() {
  const fileInput = document.getElementById('stickers-file-input');
  const dropZone = document.getElementById('stickers-drop-zone');
  const messages = document.getElementById('stickers-messages');
  const shapeSelect = document.getElementById('stickers-shape');
  const sizeSelect = document.getElementById('stickers-size');
  const customSize = document.getElementById('stickers-custom-size');
  const customInput = document.getElementById('stickers-custom-input');
  const sizeError = document.getElementById('stickers-size-error');
  const borderSelect = document.getElementById('stickers-border');
  const borderColor = document.getElementById('stickers-border-color');
  const sheetSelect = document.getElementById('stickers-sheet');
  const stickerCount = document.getElementById('stickers-count');
  const sheetCount = document.getElementById('stickers-sheet-count');
  const pdfButton = document.getElementById('stickers-pdf-button');
  const preview = document.getElementById('stickers-preview');
  const previewEmpty = document.getElementById('stickers-preview-empty');
  let exporting = false;

  fillSelect(shapeSelect, STICKER_SHAPES, stickerState.shape);
  fillSelect(sizeSelect, STICKER_SIZES, stickerState.size);
  fillSelect(borderSelect, STICKER_BORDERS, stickerState.border);
  fillSelect(sheetSelect, FRAME_SHEETS, stickerState.sheet);
  borderColor.append(
    createColorPicker({
      value: stickerState.borderColor,
      label: 'Color del borde',
      onChange: (color) => {
        setStickerBorderColor(color);
        schedulePreview();
      },
    }),
  );

  // Contador y texto de hojas. Lo usa "Copias", que no rearma las tarjetas.
  function updateCounts() {
    stickerCount.textContent = countText();
    sheetCount.textContent = sheetCountText();
  }

  // Se llama después de cada cambio de estado que cambia las tarjetas.
  function refresh() {
    borderColor.disabled = stickerState.border === 'none';
    updateCounts();
    pdfButton.disabled = exporting || stickerState.images.length === 0;
    sheetSelect.disabled = pdfButton.disabled;
    schedulePreview();
  }

  pdfButton.addEventListener('click', async () => {
    exporting = true;
    pdfButton.disabled = true;
    sheetSelect.disabled = true;
    pdfButton.textContent = 'Generando…';
    try {
      await exportStickersPdf(stickerState.images, {
        size: currentStickerSize(),
        shape: stickerState.shape,
        border: stickerState.border,
        borderColor: stickerState.borderColor,
        sheet: stickerState.sheet,
      });
    } catch (error) {
      console.error(error);
      showErrors(messages, ['No se pudo generar el PDF.']);
    } finally {
      exporting = false;
      pdfButton.textContent = 'Descargar PDF';
      refresh();
    }
  });

  let previewFrame = 0;
  function schedulePreview() {
    cancelAnimationFrame(previewFrame);
    previewFrame = requestAnimationFrame(() => renderCards(preview, previewEmpty, { onRemove: refresh, onCopies: updateCounts }));
  }

  async function handleFiles(files) {
    const rejected = await addStickerFiles(files);
    showMessages(messages, rejected);
    refresh();
  }

  shapeSelect.addEventListener('change', () => {
    setStickerShape(shapeSelect.value);
    refresh();
  });

  sizeSelect.addEventListener('change', () => {
    setStickerSize(sizeSelect.value);
    const isCustom = stickerState.size === 'custom';
    customSize.hidden = !isCustom;
    sizeError.hidden = true;
    if (isCustom) customInput.value = String(stickerState.customSize / 10);
    refresh();
  });

  // 'change' y no 'input': no avisa del rango mientras se está escribiendo.
  customInput.addEventListener('change', () => {
    const ok = setCustomStickerSize(customInput.valueAsNumber * 10);
    sizeError.hidden = ok;
    if (ok) refresh();
  });

  borderSelect.addEventListener('change', () => {
    setStickerBorder(borderSelect.value);
    refresh();
  });

  sheetSelect.addEventListener('change', () => {
    setStickerSheet(sheetSelect.value);
    updateCounts();
  });

  fileInput.addEventListener('change', () => {
    const files = [...fileInput.files];
    fileInput.value = ''; // permite volver a elegir los mismos archivos
    handleFiles(files);
  });

  // El comic ya evita que el navegador abra la imagen si se suelta fuera de una zona de drop.
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

  refresh();
}

/**
 * "3 fotos · 12 stickers" ("1 foto · 1 sticker" en singular).
 */
function countText() {
  const photos = stickerState.images.length;
  const stickers = stickerState.images.reduce((sum, img) => sum + img.copies, 0);
  return `${photos} ${photos === 1 ? 'foto' : 'fotos'} · ${stickers} ${stickers === 1 ? 'sticker' : 'stickers'}`;
}

/**
 * "Se van a generar N hojas A4", o vacío sin fotos.
 */
function sheetCountText() {
  if (stickerState.images.length === 0) return '';
  const sheet = stickerState.sheet;
  const { width, height } = stickerFor(currentStickerSize(), stickerState.shape, stickerState.border, stickerState.borderColor);
  const packed = packFrames(expandCopies(stickerState.images, width, height), sheet);
  const count = packed ? packed.sheets.length : 0;
  const label = FRAME_SHEETS[sheet].label;
  return count === 1 ? `Se va a generar 1 hoja ${label}` : `Se van a generar ${count} hojas ${label}`;
}

/**
 * Arma una tarjeta por foto con su sticker dibujado y sus controles.
 * @param {HTMLElement} container
 * @param {HTMLElement} emptyHint
 * @param {{onRemove: () => void, onCopies: () => void}} callbacks
 */
function renderCards(container, emptyHint, callbacks) {
  const sticker = stickerFor(currentStickerSize(), stickerState.shape, stickerState.border, stickerState.borderColor);
  emptyHint.hidden = stickerState.images.length > 0;
  container.replaceChildren(...stickerState.images.map((image) => createStickerCard(image, sticker, callbacks)));
}

/**
 * Tarjeta de una foto. El arrastre, el zoom y "Centrar" redibujan solo su canvas y su aviso
 * de resolución, una vez por frame; "Copias" actualiza el contador y el texto de hojas sin
 * rearmar; "Quitar" rearma toda la vista previa.
 * @param {object} image StickerImage
 * @param {{width: number, height: number, shape: string, border: number, borderColor: string}} sticker mm
 * @param {{onRemove: () => void, onCopies: () => void}} callbacks
 */
function createStickerCard(image, sticker, { onRemove, onCopies }) {
  const area = stickerPhotoArea(sticker);
  const photo = { width: area.width, height: area.height };

  const figure = document.createElement('figure');
  figure.className = 'frame-card sticker-card';

  const canvas = document.createElement('canvas');
  const scale = PREVIEW_SIDE / Math.max(sticker.width, sticker.height);
  canvas.width = Math.round(sticker.width * scale);
  canvas.height = Math.round(sticker.height * scale);
  canvas.setAttribute('aria-label', `Sticker de ${image.name}. Arrastrá la foto para reencuadrarla.`);

  const caption = document.createElement('figcaption');
  caption.textContent = stickerText(sticker.shape, currentStickerSize());

  const warning = document.createElement('p');
  warning.className = 'frame-card-warning';
  warning.textContent = 'Baja resolución: puede verse pixelada';

  let drawFrame = 0;
  function scheduleDraw() {
    cancelAnimationFrame(drawFrame);
    drawFrame = requestAnimationFrame(draw);
  }
  function draw() {
    renderSticker(image, sticker, canvas, { cutLine: true });
    const dpi = cropDpi(image.width, image.height, area.width, area.height, image.crop);
    warning.hidden = !isLowResolution(dpi);
  }

  const outer = { width: sticker.width, height: sticker.height };
  attachCropDrag(canvas, { image, area: photo, outer, setCrop: setStickerCrop, onChange: scheduleDraw });
  const zoom = createZoomControl({ image, area: photo, setCrop: setStickerCrop, onChange: scheduleDraw });

  const copiesField = document.createElement('label');
  copiesField.className = 'sticker-card-copies';
  const copiesLabel = document.createElement('span');
  copiesLabel.textContent = 'Copias';
  const copies = document.createElement('input');
  copies.type = 'number';
  copies.min = String(COPIES_LIMITS.min);
  copies.max = String(COPIES_LIMITS.max);
  copies.step = '1';
  copies.value = String(image.copies);
  copiesField.append(copiesLabel, copies);

  // Al salir del campo: fuera de rango se ajusta, vacío vuelve al valor anterior.
  copies.addEventListener('change', () => {
    setStickerCopies(image.id, copies.valueAsNumber);
    copies.value = String(image.copies);
    onCopies();
  });

  const actions = document.createElement('div');
  actions.className = 'frame-card-actions';
  const center = makeCardButton('Centrar', `Centrar la foto de ${image.name}`, () => {
    resetStickerCrop(image.id);
    zoom.sync();
    scheduleDraw();
  });
  const remove = makeCardButton('Quitar', `Quitar ${image.name}`, () => {
    removeStickerImage(image.id);
    onRemove();
  });
  actions.append(center, remove);

  draw();
  figure.append(canvas, caption, warning, zoom.element, copiesField, actions);
  return figure;
}

/**
 * Llena un <select> con las opciones de un catálogo { id, label }, en orden de inserción.
 * @param {HTMLSelectElement} select
 * @param {Record<string, {id: string, label: string}>} catalog
 * @param {string} value
 */
function fillSelect(select, catalog, value) {
  for (const item of Object.values(catalog)) {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.label;
    select.append(option);
  }
  select.value = value;
}
