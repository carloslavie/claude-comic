# SPEC 09 — Cuadros: medidas A4 y A3 a hoja completa

> **Estado:** Implementado
> **Depende de:** SPEC 08
> **Fecha:** 2026-09-24
> **Objetivo:** Agregar la medida de cuadro A3 (29,7 × 42 cm) y hacer que las medidas A4 y A3 se impriman cada una en su propia hoja entera, borde a borde, sin margen ni marcas de corte.

## Por qué existe esta spec

La SPEC 08 imprime todos los cuadros en hojas con margen de 10 mm y marcas de corte. Con ese margen, un A4 no entra en una hoja A4: hoy la medida A4 sale en una hoja A3 y hay que recortarla. Un A3 no entra en ninguna hoja, así que no está en el catálogo.

Para una lámina de hoja entera no hace falta recortar nada: la hoja ya es el cuadro. Esta spec agrega ese modo, "hoja completa", para las dos medidas que coinciden con una hoja: A4 y A3.

## Alcance

**Dentro:**

- El desplegable "Medida" suma "A3 (29,7 × 42 cm)" después de "A4 (21 × 29,7 cm)" y antes de "Personalizada".
- Las medidas A4 y A3 son de **hoja completa**: cada cuadro va solo en una hoja de su mismo tamaño (A4 en hoja A4, A3 en hoja A3), en `x = 0`, `y = 0`, ocupando toda la hoja.
- Sin margen y sin marcas de corte en esas hojas.
- Cada hoja toma la orientación de su cuadro: un cuadro vertical va en una hoja vertical y uno horizontal en una hoja apaisada. Un mismo PDF puede mezclar las dos. La imagen nunca va girada.
- La orientación de cada cuadro sigue funcionando como en la SPEC 08: automática según la foto, con "Girar" por cuadro.
- El paspartú funciona igual que en la SPEC 08: va dentro de la medida y la foto se achica.
- **Desplegable "Hoja" con una medida de hoja completa:**
  - muestra la hoja de la medida (A4 o A3) y queda deshabilitado;
  - el aviso "Esta medida necesita hoja A3." no se muestra;
  - debajo aparece el texto "Cada cuadro ocupa una hoja A3 entera." (A4 con esa medida);
  - y debajo el aviso "Imprimí sin bordes y al 100 %. Si tu impresora no imprime hasta el borde, se pierden unos milímetros de cada lado.".
- La hoja elegida a mano no cambia al pasar a una medida de hoja completa. Al volver a una medida chica, el desplegable "Hoja" vuelve a mostrar la hoja que estaba elegida.
- Elegir la medida A4 ya no fuerza la hoja a A3.
- El texto junto a "Descargar PDF" cuenta una hoja por foto: "Se van a generar 3 hojas A3" ("Se va a generar 1 hoja A4" con una sola).
- Al pasar de la medida A3 a "Personalizada", la medida personalizada toma 27 × 40 cm: la de A3 recortada a los límites de la SPEC 08.
- El archivo se llama `cuadros.pdf` con la medida A4 y `cuadros-a3.pdf` con la medida A3.
- **Resolución del PDF:** los cuadros se siguen dibujando a 300 DPI, salvo que el canvas pase de 16 000 000 px. En ese caso se usa la mayor resolución entera que no pase ese límite. Aplica a todos los cuadros; en la práctica solo afecta al A3 (287 DPI).
- El aviso de baja resolución de cada tarjeta funciona igual, calculado sobre la medida A3 cuando corresponde.
- Las medidas que no son de hoja completa (10 × 15, 13 × 18, 15 × 20, 20 × 25, 20 × 30 y Personalizada) se imprimen igual que en la SPEC 08.
- El comic se ve y funciona igual que antes de esta spec.

**Fuera (para specs futuras):**

- Hoja completa para otras medidas (p. ej. una personalizada de 21 × 29,7 cm, o A5).
- Poner un cuadro A4 en una hoja A3 con margen, como hacía la SPEC 08.
- Hojas más grandes que A3 (A2, A1) o medidas de imprenta.
- Sangrado (bleed) o margen de seguridad configurable.
- Ampliar los límites de la medida personalizada.
- Vista previa de las hojas del PDF.
- Exportar como JPG o PNG.

## Modelo de datos

### Medidas — `src/frameSizes.js`

Las medidas A4 y A3 llevan la clave `fullSheet` con el id de la hoja (de `FRAME_SHEETS`) que ocupan entera. Las demás no la tienen.

```js
export const FRAME_SIZES = {
  // … 10x15, 13x18, 15x20, 20x25, 20x30 sin cambios
  a4: { id: 'a4', label: 'A4 (21 × 29,7 cm)', short: 210, long: 297, fullSheet: 'a4' },
  a3: { id: 'a3', label: 'A3 (29,7 × 42 cm)', short: 297, long: 420, fullSheet: 'a3' },
  custom: { id: 'custom', label: 'Personalizada' },
};
```

Función nueva:

- `fullSheetFor(sizeId)`: el id de la hoja que ocupa la medida, o `null`.
  - `fullSheetFor('a4')` → `'a4'`; `fullSheetFor('a3')` → `'a3'`.
  - `fullSheetFor('13x18')` → `null`; `fullSheetFor('custom')` → `null`; `fullSheetFor('xyz')` → `null`.
- `clampCustomSize({ short, long })`: la medida recortada a `CUSTOM_SIZE_LIMITS` (`short` entre `min` y `maxShort`, `long` entre `min` y `max`).
  - `clampCustomSize({ short: 297, long: 420 })` → `{ short: 270, long: 400 }`.
  - `clampCustomSize({ short: 130, long: 180 })` → `{ short: 130, long: 180 }`.

### Hojas — `src/sheetLayout.js`

```js
export const MAX_CANVAS_PIXELS = 16_000_000;
export const EXPORT_DPI = 300;
```

Funciones nuevas:

- `fullSheetPages(frames)`: una hoja por cuadro, en orden. `frames` es `[{ id, width, height }]` en mm. Devuelve `[{ id, orientation }]`, con `orientation` `'landscape'` si `width > height` y `'portrait'` si no.
  - `fullSheetPages([{ id: 'a', width: 297, height: 420 }, { id: 'b', width: 420, height: 297 }])` → `[{ id: 'a', orientation: 'portrait' }, { id: 'b', orientation: 'landscape' }]`.
  - `fullSheetPages([])` → `[]`.
- `exportDpi(widthMm, heightMm)`: `EXPORT_DPI`, o el mayor entero que deja `round(w / 25.4 * dpi) * round(h / 25.4 * dpi) <= MAX_CANVAS_PIXELS`.
  - `exportDpi(130, 180)` → `300`; `exportDpi(210, 297)` → `300`; `exportDpi(270, 400)` → `300`.
  - `exportDpi(297, 420)` → `287`; `exportDpi(420, 297)` → `287`.

### Estado — `src/frameState.js`

`frameState` no cambia. `frameState.sheet` sigue siendo la hoja elegida a mano.

- Función nueva `currentPdfSheet()`: `fullSheetFor(frameState.size) ?? frameState.sheet`. Es la hoja que usan el desplegable "Hoja", el texto de hojas, el PDF y el nombre del archivo.
- `ensureSheetFits()` no hace nada si la medida vigente es de hoja completa.
- `setFrameSheet(sheetId)` se ignora si la medida vigente es de hoja completa.
- `setFrameSize('custom')` copia la medida que estaba elegida pasándola por `clampCustomSize`.

### Módulos con DOM

- `src/framePdf.js`: `exportFramesPdf(images, { size, mat, matColor, sheet, fullSheet })`. Con `fullSheet: true`:
  - arma las hojas con `fullSheetPages`;
  - crea el `jsPDF` con la hoja y la orientación de la primera hoja, y agrega cada hoja siguiente con `doc.addPage(sheet, orientation)`;
  - dibuja cada cuadro en `x = 0`, `y = 0`, con su medida, sin girar y sin marcas de corte.
  - Con `fullSheet: false` hace lo mismo que en la SPEC 08.
  - En los dos casos el canvas de cada cuadro usa `exportDpi(frame.width, frame.height)` en lugar de 300 fijo.
- `src/frameUi.js`: `refresh()` usa `currentPdfSheet()` para el valor del desplegable "Hoja" y lo deshabilita con una medida de hoja completa. Muestra u oculta `#frames-full-sheet-hint`. `sheetCountText()` cuenta una hoja por foto con una medida de hoja completa. "Descargar PDF" pasa `sheet: currentPdfSheet()` y `fullSheet: fullSheetFor(frameState.size) !== null`.
- `index.html`: debajo de `#frames-sheet-hint`, un `<div id="frames-full-sheet-hint" hidden>` con dos párrafos `.hint`: `<p id="frames-full-sheet-text">` (el texto "Cada cuadro ocupa una hoja … entera.", que arma `frameUi.js`) y el aviso de imprimir sin bordes (fijo).

Convenciones:

- "Hoja completa" es una propiedad de la medida, no un control aparte.
- La medida personalizada nunca es de hoja completa, aunque mida 21 × 29,7 cm.

## Plan de implementación

1. En `src/sheetLayout.js`, agregar `MAX_CANVAS_PIXELS`, `EXPORT_DPI`, `fullSheetPages` y `exportDpi`. En `tests/sheetLayout.test.js`, probarlas con los ejemplos de esta spec. Prueba: `npm test` pasa.
2. En `src/frameSizes.js`, agregar `fullSheet: 'a4'` a la medida A4 y la función `fullSheetFor`. En `tests/frameSizes.test.js`, probarla con los ejemplos de esta spec (sin `'a3'` todavía). Prueba: `npm test` pasa.
3. En `src/frameState.js`, agregar `currentPdfSheet()` y hacer que `ensureSheetFits()` y `setFrameSheet()` no actúen con una medida de hoja completa. En `src/framePdf.js`, agregar el camino `fullSheet` y usar `exportDpi` en los dos caminos. En `src/frameUi.js`, pasar `sheet: currentPdfSheet()` y `fullSheet` a `exportFramesPdf`. Prueba manual: con medida A4 y dos fotos (una vertical y una apaisada), el PDF tiene 2 hojas A4, una vertical y una apaisada, con el cuadro ocupando toda la hoja y sin marcas de corte. Con 13 × 18 el PDF sale igual que antes.
4. En `index.html`, agregar `#frames-full-sheet-hint`. En `src/frameUi.js`, actualizar `refresh()` (valor y estado del desplegable "Hoja", avisos) y `sheetCountText()`. Agregar estilos en `src/style.css` solo si hacen falta. Prueba manual: con medida A4, "Hoja" muestra A4 deshabilitado, se ven los dos textos y el conteo dice una hoja por foto; al volver a 13 × 18 la hoja vuelve a la elegida antes.
5. En `src/frameSizes.js`, agregar la medida `a3` con `fullSheet: 'a3'` y la función `clampCustomSize`. En `src/frameState.js`, usarla en `setFrameSize('custom')`. En `tests/frameSizes.test.js`, sumar `fullSheetFor('a3')`, `resolveFrameSize('a3', …)` y `clampCustomSize`. En `tests/sheetLayout.test.js`, ajustar el test "en A3 entra todo el catálogo" para que excluya las medidas de hoja completa, y agregar que `FRAME_SIZES.a3` no entra con `frameFits` en A3. Prueba: `npm test` pasa y, a mano, los criterios de A3 de esta spec.
6. Actualizar `CLAUDE.md`: la medida A3, las medidas de hoja completa (`fullSheet`, `fullSheetFor`, `currentPdfSheet`), `fullSheetPages`, `exportDpi` y el cambio en `exportFramesPdf`.

## Criterios de aceptación

- [x] `npm test` pasa, incluidos los tests nuevos de `fullSheetFor`, `fullSheetPages` y `exportDpi`.
- [x] `npm run build` termina sin errores.
- [x] El desplegable "Medida" tiene, en este orden: 10 × 15 cm, 13 × 18 cm, 15 × 20 cm, 20 × 25 cm, 20 × 30 cm, A4 (21 × 29,7 cm), A3 (29,7 × 42 cm) y Personalizada.
- [x] Con medida A3, una foto vertical sale "29,7 × 42 cm, vertical" y una apaisada "29,7 × 42 cm, horizontal".
- [x] Con medida A3, el desplegable "Hoja" muestra A3, está deshabilitado y se ven "Cada cuadro ocupa una hoja A3 entera." y el aviso de imprimir sin bordes. No se ve "Esta medida necesita hoja A3.".
- [x] Con medida A4, el desplegable "Hoja" muestra A4, está deshabilitado y se ve "Cada cuadro ocupa una hoja A4 entera.".
- [x] Con hoja A4 elegida a mano, pasar a medida A3 y volver a 13 × 18 cm deja la hoja en A4.
- [x] Con medida A3 y 3 fotos, el texto dice "Se van a generar 3 hojas A3". Con 1 foto, "Se va a generar 1 hoja A3".
- [x] Con medida A3, una foto vertical y una apaisada, el PDF `cuadros-a3.pdf` tiene 2 hojas A3: la primera vertical y la segunda apaisada, cada una con el cuadro ocupando toda la hoja, sin margen blanco y sin marcas de corte.
- [x] Con medida A4 y 2 fotos, el PDF `cuadros.pdf` tiene 2 hojas A4 con el cuadro ocupando toda la hoja, sin marcas de corte.
- [x] Cada hoja del PDF se ve igual que su tarjeta: encuadre, zoom, orientación y paspartú.
- [x] Con medida A3 y paspartú Ancho, la hoja del PDF tiene un borde de 4 cm del color elegido alrededor de la foto.
- [x] El PDF con medida A3 se genera sin errores en Chrome de escritorio y en Safari de iPhone o iPad.
- [x] Con medida A3, elegir "Personalizada" muestra 27 y 40 en "Ancho (cm)" y "Alto (cm)", y los cuadros pasan a 27 × 40 cm.
- [x] Una foto de 1600 × 1200 px en medida A3 muestra "Baja resolución: puede verse pixelada".
- [x] Con hoja A4 elegida, pasar a 20 × 25 cm sigue deshabilitando A4, cambia la hoja a A3 y muestra "Esta medida necesita hoja A3.".
- [x] Con 13 × 18 cm, 20 × 30 cm y Personalizada, el PDF sale igual que antes de esta spec: margen de 10 mm, marcas de corte y el mismo acomodo.
- [x] El comic funciona igual que antes de esta spec.

## Decisiones

- **Sí:** "A3 completo" es una medida A3 real impresa borde a borde en una hoja A3. Elegido por la persona.
- **No:** una medida de 27,7 × 40 cm que llene el área útil de la A3 con margen. No es una medida A3 real y no coincide con los marcos A3.
- **No:** un control "Hoja completa" aparte, para cualquier medida. Más combinaciones para una necesidad que solo tienen A4 y A3.
- **Sí:** A4 también pasa a hoja completa, en hoja A4. Elegido por la persona. Hoy un A4 sale en una A3 con margen y hay que recortarlo.
- **No:** mantener la opción de poner un A4 en una hoja A3 con margen. Se pierde, y puede volver en otra spec si hace falta.
- **Sí:** el paspartú se sigue pudiendo usar con hoja completa. Elegido por la persona. Además hace de borde si la impresora no imprime hasta el borde.
- **Sí:** aviso en pantalla sobre imprimir sin bordes, sin cambiar el PDF. Elegido por la persona. Muchas impresoras hogareñas no imprimen hasta el borde.
- **No:** agregar margen de seguridad o sangrado. Cambiaría la medida real del cuadro.
- **Sí:** con una medida de hoja completa, "Hoja" se fija en la hoja de la medida y se deshabilita. Elegido por la persona. No hay otra hoja posible.
- **Sí:** la hoja de la medida se calcula (`currentPdfSheet()`) y no se guarda en `frameState.sheet`. Así la hoja elegida a mano vuelve sola al pasar a una medida chica.
- **Sí:** cada hoja toma la orientación de su cuadro y la imagen nunca se gira. Elegido por la persona. El PDF se ve como se imprime.
- **No:** todas las hojas verticales con el cuadro horizontal girado. Obliga a girar el PDF para mirarlo.
- **Sí:** 300 DPI, bajando solo lo justo si el canvas pasa de 16 Mpx. Elegido por la persona. Safari de iOS no dibuja canvas de más de 16,7 Mpx y un A3 a 300 DPI son 17,4 Mpx; 287 DPI no se distingue impreso.
- **Sí:** `exportDpi` aplica a todos los cuadros. Con las medidas actuales solo cambia el A3; una regla sola es más simple que dos caminos.
- **Sí:** la medida personalizada nunca es de hoja completa. Mantiene "hoja completa" como propiedad del catálogo y no toca los límites de la SPEC 08.
- **Sí:** al pasar de A3 a "Personalizada", la medida se recorta a 27 × 40 cm. Elegido por la persona durante la implementación. Copiar 29,7 × 42 dejaba una medida personalizada inválida que no entra en ninguna hoja.
- **No:** conservar la medida personalizada anterior al venir de A3. Rompe la regla de la SPEC 08 de partir de la medida que estaba elegida.
- **Sí:** `fullSheetPages` y `exportDpi` son lógica pura en `src/sheetLayout.js`, probada con Vitest, igual que `packFrames`.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| La impresora no imprime hasta el borde y corta unos milímetros de la foto | Aviso en pantalla. El paspartú sirve de borde si se quiere evitar. |
| La impresora escala el PDF ("ajustar a la página") | El aviso pide imprimir al 100 %. Como la hoja del PDF mide lo mismo que el papel, escalar cambia poco. |
| El canvas del A3 no se puede crear en Safari de iOS | `exportDpi` limita el canvas a 16 Mpx. Hay un criterio de aceptación en Safari de iOS. |
| Un PDF con muchas hojas A3 a 287 DPI es pesado y lento | Se dibuja un cuadro por vez, reusando el canvas y cediendo el hilo, igual que en la SPEC 08. |
| Cambiar `ensureSheetFits()` rompe el cambio automático a A3 de las medidas 20 × 25 y 20 × 30 | El paso 4 prueba esas medidas y hay un criterio de aceptación para ellas. |

## Qué **no** incluye esta spec

- Hoja completa para medidas personalizadas u otras medidas.
- Un cuadro A4 en una hoja A3 con margen.
- Hojas más grandes que A3.
- Sangrado o margen de seguridad.
- Cambiar los límites de la medida personalizada.
- Vista previa de las hojas del PDF.
- Exportar como JPG o PNG.

Cada una de estas, si llega, va en su propia spec.
