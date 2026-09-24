// Interfaz de la herramienta de cuadros: carga de fotos, medida, paspartú, hoja y tarjetas.
import {
  frameState,
  addFrameFiles,
  removeFrameImage,
  toggleFrameOrientation,
  setFrameCrop,
  resetFrameCrop,
  setFrameSize,
  setCustomFrameSize,
  setMat,
  setMatColor,
  setFrameSheet,
  currentFrameSize,
  currentPdfSheet,
} from './frameState.js';
import { MAX_IMAGES } from './state.js';
import { FRAME_SIZES, MATS, fullSheetFor, frameDimensions, photoArea } from './frameSizes.js';
import { cropDpi, isLowResolution } from './crop.js';
import { attachCropDrag, createZoomControl, makeCardButton } from './cropControls.js';
import { FRAME_SHEETS, frameFits, packFrames, fullSheetPages } from './sheetLayout.js';
import { frameFor, renderFrame } from './frameRender.js';
import { exportFramesPdf } from './framePdf.js';
import { createColorPicker } from './colorPicker.js';
import { showMessages, showErrors } from './messages.js';

// Lado largo, en px, del canvas de cada cuadro en la vista previa; el CSS lo escala.
const PREVIEW_LONG_SIDE = 600;

export function initFramesUI() {
  const fileInput = document.getElementById('frames-file-input');
  const dropZone = document.getElementById('frames-drop-zone');
  const messages = document.getElementById('frames-messages');
  const sizeSelect = document.getElementById('frames-size');
  const customSize = document.getElementById('frames-custom-size');
  const customWidth = document.getElementById('frames-custom-width');
  const customHeight = document.getElementById('frames-custom-height');
  const sizeError = document.getElementById('frames-size-error');
  const matSelect = document.getElementById('frames-mat');
  const matColor = document.getElementById('frames-mat-color');
  const sheetSelect = document.getElementById('frames-sheet');
  const sheetHint = document.getElementById('frames-sheet-hint');
  const fullSheetHint = document.getElementById('frames-full-sheet-hint');
  const fullSheetText = document.getElementById('frames-full-sheet-text');
  const imageCount = document.getElementById('frames-image-count');
  const sheetCount = document.getElementById('frames-sheet-count');
  const pdfButton = document.getElementById('frames-pdf-button');
  const preview = document.getElementById('frames-preview');
  const previewEmpty = document.getElementById('frames-preview-empty');
  let exporting = false;

  fillSelect(sizeSelect, FRAME_SIZES, frameState.size);
  fillSelect(matSelect, MATS, frameState.mat);
  fillSelect(sheetSelect, FRAME_SHEETS, frameState.sheet);
  matColor.append(
    createColorPicker({
      value: frameState.matColor,
      label: 'Color del paspartú',
      onChange: (color) => {
        setMatColor(color);
        schedulePreview();
      },
    }),
  );

  // Se llama después de cada cambio de estado.
  function refresh() {
    const size = currentFrameSize();
    const fullSheet = fullSheetFor(frameState.size);
    const pdfSheet = currentPdfSheet();
    const fitsA4 = fullSheet !== null || frameFits(size, 'a4');
    sheetSelect.querySelector('option[value="a4"]').disabled = !fitsA4;
    sheetSelect.value = pdfSheet;
    sheetHint.hidden = fitsA4;
    fullSheetHint.hidden = fullSheet === null;
    fullSheetText.textContent = `Cada cuadro ocupa una hoja ${FRAME_SHEETS[pdfSheet].label} entera.`;
    matColor.disabled = frameState.mat === 'none';

    imageCount.textContent = `${frameState.images.length} / ${MAX_IMAGES} fotos`;
    sheetCount.textContent = sheetCountText(size);
    pdfButton.disabled = exporting || frameState.images.length === 0;
    sheetSelect.disabled = pdfButton.disabled || fullSheet !== null;
    schedulePreview();
  }

  pdfButton.addEventListener('click', async () => {
    exporting = true;
    pdfButton.disabled = true;
    sheetSelect.disabled = true;
    pdfButton.textContent = 'Generando…';
    try {
      await exportFramesPdf(frameState.images, {
        size: currentFrameSize(),
        mat: frameState.mat,
        matColor: frameState.matColor,
        sheet: currentPdfSheet(),
        fullSheet: fullSheetFor(frameState.size) !== null,
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
    previewFrame = requestAnimationFrame(() => renderCards(preview, previewEmpty, refresh));
  }

  async function handleFiles(files) {
    const rejected = await addFrameFiles(files);
    showMessages(messages, rejected);
    refresh();
  }

  sizeSelect.addEventListener('change', () => {
    setFrameSize(sizeSelect.value);
    const isCustom = frameState.size === 'custom';
    customSize.hidden = !isCustom;
    sizeError.hidden = true;
    if (isCustom) {
      customWidth.value = String(frameState.customSize.short / 10);
      customHeight.value = String(frameState.customSize.long / 10);
    }
    refresh();
  });

  // 'change' y no 'input': no avisa del rango mientras se está escribiendo.
  function handleCustomSize() {
    const ok = setCustomFrameSize(customWidth.valueAsNumber * 10, customHeight.valueAsNumber * 10);
    sizeError.hidden = ok;
    if (ok) refresh();
  }
  customWidth.addEventListener('change', handleCustomSize);
  customHeight.addEventListener('change', handleCustomSize);

  matSelect.addEventListener('change', () => {
    setMat(matSelect.value);
    refresh();
  });

  sheetSelect.addEventListener('change', () => {
    setFrameSheet(sheetSelect.value);
    refresh();
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
 * "Se van a generar N hojas A4", o vacío sin fotos. Con una medida de hoja completa,
 * una hoja por foto.
 * @param {{short: number, long: number}} size mm
 */
function sheetCountText(size) {
  if (frameState.images.length === 0) return '';
  const sheet = currentPdfSheet();
  const frames = frameState.images.map((img) => ({ id: img.id, ...frameDimensions(size, img.orientation) }));
  let count;
  if (fullSheetFor(frameState.size)) {
    count = fullSheetPages(frames).length;
  } else {
    const packed = packFrames(frames, sheet);
    count = packed ? packed.sheets.length : 0;
  }
  const label = FRAME_SHEETS[sheet].label;
  return count === 1 ? `Se va a generar 1 hoja ${label}` : `Se van a generar ${count} hojas ${label}`;
}

/**
 * Arma una tarjeta por foto con su cuadro dibujado y sus controles de encuadre.
 * @param {HTMLElement} container
 * @param {HTMLElement} emptyHint
 * @param {() => void} onChange se llama después de quitar una foto o girar su cuadro
 */
function renderCards(container, emptyHint, onChange) {
  const size = currentFrameSize();
  emptyHint.hidden = frameState.images.length > 0;
  container.replaceChildren(...frameState.images.map((image) => createFrameCard(image, size, onChange)));
}

/**
 * Tarjeta de una foto. El arrastre, el zoom y "Centrar" redibujan solo su canvas y su aviso
 * de resolución, una vez por frame; "Girar" y "Quitar" rearman toda la vista previa.
 * @param {object} image FrameImage
 * @param {{short: number, long: number}} size mm
 * @param {() => void} onChange
 */
function createFrameCard(image, size, onChange) {
  const frame = frameFor(image, size, frameState.mat, frameState.matColor);
  const area = photoArea(frame.width, frame.height, frame.mat);

  const figure = document.createElement('figure');
  figure.className = 'frame-card';

  const canvas = document.createElement('canvas');
  const scale = PREVIEW_LONG_SIDE / Math.max(frame.width, frame.height);
  canvas.width = Math.round(frame.width * scale);
  canvas.height = Math.round(frame.height * scale);
  canvas.className = 'frame-card-canvas';
  canvas.setAttribute('aria-label', `Cuadro de ${image.name}. Arrastrá la foto para reencuadrarla.`);

  const caption = document.createElement('figcaption');
  caption.textContent = frameSizeText(size, image.orientation);

  const warning = document.createElement('p');
  warning.className = 'frame-card-warning';
  warning.textContent = 'Baja resolución: puede verse pixelada';

  let drawFrame = 0;
  function scheduleDraw() {
    cancelAnimationFrame(drawFrame);
    drawFrame = requestAnimationFrame(draw);
  }
  function draw() {
    renderFrame(image, frame, canvas);
    const dpi = cropDpi(image.width, image.height, area.width, area.height, image.crop);
    warning.hidden = !isLowResolution(dpi);
  }

  attachCropDrag(canvas, { image, area, outer: frame, setCrop: setFrameCrop, onChange: scheduleDraw });
  const zoom = createZoomControl({ image, area, setCrop: setFrameCrop, onChange: scheduleDraw });

  const actions = document.createElement('div');
  actions.className = 'frame-card-actions';
  const rotate = makeCardButton('Girar', `Girar el cuadro de ${image.name}`, () => {
    toggleFrameOrientation(image.id);
    onChange();
  });
  const center = makeCardButton('Centrar', `Centrar la foto de ${image.name}`, () => {
    resetFrameCrop(image.id);
    zoom.sync();
    scheduleDraw();
  });
  const remove = makeCardButton('Quitar', `Quitar ${image.name}`, () => {
    removeFrameImage(image.id);
    onChange();
  });
  actions.append(rotate, center, remove);

  draw();
  figure.append(canvas, caption, warning, zoom.element, actions);
  return figure;
}

/**
 * "13 × 18 cm, vertical": lado corto × lado largo, en cm con coma decimal.
 * @param {{short: number, long: number}} size mm
 * @param {'portrait' | 'landscape'} orientation
 */
function frameSizeText({ short, long }, orientation) {
  const cm = (mm) => String(mm / 10).replace('.', ',');
  return `${cm(short)} × ${cm(long)} cm, ${orientation === 'landscape' ? 'horizontal' : 'vertical'}`;
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
