// Mensajes de error de la carga de imágenes, compartidos por las herramientas.
import { MAX_IMAGES } from './state.js';

export function showMessages(container, rejected) {
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

export function showErrors(container, lines) {
  container.replaceChildren(
    ...lines.map((text) => {
      const p = document.createElement('p');
      p.className = 'message message-error';
      p.textContent = text;
      return p;
    }),
  );
}

export function names(items) {
  return items.map((r) => r.name).join(', ');
}
