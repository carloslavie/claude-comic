// Controles de reencuadre de las tarjetas (arrastre y zoom) y sus botones. Los usan los cuadros y los stickers.
import { ZOOM_MIN, ZOOM_MAX, clampCrop, panCrop } from './crop.js';

/**
 * Arrastre: la foto sigue al puntero. El desplazamiento se mide en fracciones del área
 * de la foto en pantalla, así no depende del tamaño con que se muestra el canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {object} options
 * @param {{id: string, width: number, height: number, crop: object}} options.image
 * @param {{width: number, height: number}} options.area área de la foto, mm
 * @param {{width: number, height: number}} options.outer todo el canvas, mm
 * @param {(id: string, crop: object) => void} options.setCrop
 * @param {() => void} options.onChange
 */
export function attachCropDrag(canvas, { image, area, outer, setCrop, onChange }) {
  let last = null;
  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('is-dragging');
    last = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!last) return;
    const box = canvas.getBoundingClientRect();
    const areaW = box.width * (area.width / outer.width);
    const areaH = box.height * (area.height / outer.height);
    const dx = (e.clientX - last.x) / areaW;
    const dy = (e.clientY - last.y) / areaH;
    last = { x: e.clientX, y: e.clientY };
    setCrop(image.id, panCrop(image.width, image.height, area.width, area.height, image.crop, dx, dy));
    onChange();
  });
  const endDrag = () => {
    last = null;
    canvas.classList.remove('is-dragging');
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
}

/**
 * Control "Zoom" de 100 a 300 %. `sync()` pone el rango y el texto según `image.crop.zoom`.
 * @param {object} options
 * @param {{id: string, width: number, height: number, crop: object}} options.image
 * @param {{width: number, height: number}} options.area área de la foto, mm
 * @param {(id: string, crop: object) => void} options.setCrop
 * @param {() => void} options.onChange
 * @returns {{element: HTMLLabelElement, sync: () => void}}
 */
export function createZoomControl({ image, area, setCrop, onChange }) {
  const element = document.createElement('label');
  element.className = 'frame-card-zoom';
  const zoomLabel = document.createElement('span');
  const zoom = document.createElement('input');
  zoom.type = 'range';
  zoom.min = String(ZOOM_MIN * 100);
  zoom.max = String(ZOOM_MAX * 100);
  zoom.step = '1';
  element.append(zoomLabel, zoom);

  function sync() {
    const percent = Math.round(image.crop.zoom * 100);
    zoom.value = String(percent);
    zoomLabel.textContent = `Zoom ${percent} %`;
  }

  zoom.addEventListener('input', () => {
    const crop = { ...image.crop, zoom: zoom.valueAsNumber / 100 };
    setCrop(image.id, clampCrop(image.width, image.height, area.width, area.height, crop));
    sync();
    onChange();
  });

  sync();
  return { element, sync };
}

export function makeCardButton(label, ariaLabel, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'frame-card-button';
  button.textContent = label;
  button.setAttribute('aria-label', ariaLabel);
  button.title = ariaLabel;
  button.addEventListener('click', onClick);
  return button;
}
