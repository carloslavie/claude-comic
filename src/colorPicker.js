// Selector de color compartido por las herramientas: paleta predefinida + color libre.
import { PALETTE } from './colors.js';

/**
 * Selector de color: botones con la paleta predefinida y un <input type="color"> libre.
 * Marca con aria-pressed el botón que coincide con el color actual y se actualiza solo
 * cuando el usuario elige un color.
 * @param {{value: string, onChange: (color: string) => void, label: string}} options
 * @returns {HTMLDivElement}
 */
export function createColorPicker({ value, onChange, label }) {
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
