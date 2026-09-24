# SPEC 12 — Comic: encuadre manual de cada foto en su viñeta

> **Estado:** Aprobado
> **Depende de:** SPEC 01, SPEC 03, SPEC 08
> **Fecha:** 2026-09-24
> **Objetivo:** Permitir en el comic mover y hacer zoom a cada foto dentro de su viñeta, arrastrándola sobre la vista previa de la página y con los controles Zoom y Centrar de la viñeta seleccionada, como en los cuadros y los stickers.

## Por qué existe esta spec

Hoy el comic recorta cada foto con un cover centrado fijo: si la cara o el objeto importante queda en un borde de la foto, la viñeta lo corta y no hay forma de corregirlo. Los cuadros (SPEC 08) y los stickers (SPEC 10) ya resuelven esto con un encuadre por foto (`crop.js`) y controles de arrastre y zoom.

La diferencia es que en el comic un canvas es una página con varias viñetas, no una foto por tarjeta. Por eso esta spec suma la idea de **viñeta seleccionada**: se toca una viñeta en la vista previa, queda resaltada y debajo de su página aparecen Zoom y Centrar para esa foto.

## Alcance

**Dentro:**

- **Encuadre por foto:** cada foto del comic guarda su encuadre `{ zoom, centerX, centerY }` (el mismo de `crop.js`). Al cargarla empieza en `DEFAULT_CROP` (zoom 1, centrada), que se ve igual que el recorte actual.
- **El encuadre sigue a la foto:** si la foto cambia de página, de viñeta o de plantilla (por reordenar, quitar otras fotos, cambiar el título o elegir otra plantilla), conserva su zoom y su centro. `cropRect` lo ajusta a la proporción de la nueva viñeta sin dejar huecos.
- **Selección:** hay como mucho **una** viñeta seleccionada en toda la vista previa. Se selecciona al presionar sobre una viñeta con foto. Seleccionar otra (en la misma página o en otra) deselecciona la anterior. Presionar sobre el margen o el medianil de cualquier página, o apretar Escape con la vista del comic visible, deselecciona.
- **Resaltado:** la viñeta seleccionada se marca en la vista previa con un contorno de color de acento por dentro de la viñeta. El resaltado **no** sale en el PDF.
- **Arrastre:** con el mouse, presionar sobre una viñeta la selecciona y, sin soltar, arrastrar mueve la foto dentro de la viñeta (la foto sigue al puntero, como en los cuadros). Con el dedo, el primer toque selecciona la viñeta y a partir de ahí arrastrar sobre ella mueve la foto (ver Decisiones: el scroll de la página no se bloquea hasta que hay una selección). La foto nunca deja huecos: el arrastre se frena en los bordes (lo hace `panCrop`).
- **Controles de la viñeta seleccionada:** debajo del canvas de su página, entre la leyenda y los controles de plantilla y color, aparece un bloque con el texto "Encuadre de la viñeta N" (N empieza en 1 dentro de la página), el control **Zoom** (100 a 300 %, el mismo `createZoomControl` de las otras herramientas) y el botón **Centrar** (vuelve la foto a `DEFAULT_CROP`). En las páginas sin viñeta seleccionada ese bloque no se muestra.
- **Portada:** la foto de la portada se reencuadra igual que las demás. El título se sigue dibujando encima, en su posición, sin moverse.
- **Redibujo liviano:** el arrastre, el zoom y Centrar redibujan solo el canvas de esa página. Seleccionar o deseleccionar redibuja solo las páginas afectadas (la que pierde y la que gana la selección) y muestra u oculta sus controles, sin rearmar toda la vista previa, para no cerrar un selector de color abierto ni perder el scroll.
- **Rearmado:** cuando la vista previa se rearma entera (cargar, reordenar o quitar fotos, cambiar el título o una plantilla), la selección se conserva por foto: si la foto seleccionada sigue en alguna viñeta, queda seleccionada donde esté ahora; si se quitó, no queda nada seleccionado.
- **PDF:** cada foto se exporta con su encuadre, porque el PDF usa el mismo `renderPage`. Lo que se ve es lo que se exporta, en A4 y en A3.
- **Geometría pura:** la posición de las viñetas en la página sale de un módulo nuevo, puro y con tests, que usan el render y la detección de la viñeta tocada.

**Fuera (para specs futuras):**

- Aviso de baja resolución en el comic (el PDF sale a 150 DPI fijos).
- Zoom con la rueda del mouse o con el gesto de pellizcar.
- Botón "Centrar todas" o restablecer el encuadre de todo el comic.
- Reencuadre desde la lista de miniaturas (las miniaturas siguen mostrando la foto entera).
- Girar la foto dentro de la viñeta.
- Manejo con teclado del encuadre (flechas para mover, +/− para el zoom).
- Mover el título de la portada.
- Cambios en los cuadros o los stickers.
- Persistencia entre sesiones.

## Modelo de datos

### Foto del comic — `src/state.js`

Cada imagen de `state.images` suma `crop`:

```js
{
  id: 'img-3',
  name: 'playa.jpg',
  url: 'blob:…',
  bitmap: ImageBitmap,
  width: 4000,
  height: 3000,
  orientation: 'landscape',
  crop: { zoom: 1, centerX: 0.5, centerY: 0.5 }, // nuevo, copia de DEFAULT_CROP al cargar
}
```

Mutaciones nuevas, iguales a las de los cuadros y los stickers:

- `setImageCrop(id, crop)`: guarda `{ zoom, centerX, centerY }` en la foto (copia los tres campos). Un `id` desconocido se ignora.
- `resetImageCrop(id)`: vuelve la foto a una copia de `DEFAULT_CROP`. Un `id` desconocido se ignora.

`moveImage`, `removeImage` y el resto del estado no cambian: el encuadre viaja con la foto.

### Selección — `src/ui.js`

La selección no es estado del comic: vive en `ui.js` como `selectedImageId` (`string | null`). Se guarda el id de la foto, no la página ni la viñeta, para que sobreviva a los rearmados.

### Geometría de las viñetas — `src/panelGeometry.js` (nuevo, puro)

Pasan a este módulo las medidas de página y el cálculo de `panelRect` que hoy están en `render.js`, en mm:

```js
export const PAGE_WIDTH_MM = 210;
export const PAGE_HEIGHT_MM = 297;
export const MARGIN_MM = 10;
export const GUTTER_MM = 4;
```

- `panelRects(page)` → lista de `{ x, y, width, height }` en mm, una por viñeta, en el orden de `panels` (la viñeta `i` es la de `page.imageIds[i]`). La portada usa la única viñeta de `1-full`. Descuenta medio medianil en cada lado interno, igual que hoy.
  - Portada o `1-full` → `[{ x: 10, y: 10, width: 190, height: 277 }]`.
  - `2-rows` → `[{ x: 10, y: 10, width: 190, height: 136.5 }, { x: 10, y: 150.5, width: 190, height: 136.5 }]`.
  - `2-cols` → `[{ x: 10, y: 10, width: 93, height: 277 }, { x: 107, y: 10, width: 93, height: 277 }]`.
- `panelAt(page, x, y)` → índice de la viñeta que contiene el punto `(x, y)` en mm, o `-1` si cae en el margen o en el medianil. Los bordes de la viñeta cuentan como dentro.
  - `2-rows`: `(100, 50)` → `0`; `(100, 200)` → `1`; `(100, 148.5)` → `-1` (medianil); `(5, 5)` → `-1` (margen).
  - `2-cols`: `(150, 100)` → `1`.

`render.js` sigue exportando `PAGE_WIDTH_MM` y `PAGE_HEIGHT_MM` (reexportados desde `panelGeometry.js`) para que `ui.js` y `pdf.js` no cambien sus imports.

### Módulos con DOM

- `src/render.js`: `renderPage` usa `panelRects(page)` (pasando de mm a px con la escala del canvas) y reemplaza el recorte centrado de `drawCover` por `cropRect(image.width, image.height, rect.w, rect.h, image.crop ?? DEFAULT_CROP)`. La firma de `renderPage` no cambia. El borde (0,8 mm) sigue por dentro de la viñeta y el encuadre se mide sobre la viñeta entera, como hasta ahora.
- `src/ui.js`: en `renderPreview`, cada canvas de página detecta la viñeta tocada con `panelAt` (pasando las coordenadas del puntero a mm con `getBoundingClientRect`), maneja el arrastre con `panCrop` de `crop.js` midiendo el desplazamiento en fracciones de la viñeta en pantalla, y después de `renderPage` dibuja el resaltado de la viñeta seleccionada (solo en la vista previa). El bloque de encuadre usa `createZoomControl` y `makeCardButton` de `cropControls.js`, con `area` = la viñeta en mm. `attachCropDrag` no se usa en el comic porque supone una sola área fija por canvas.
- `src/style.css`: estilos del bloque de encuadre (`.panel-crop`), cursor `grab` / `grabbing` sobre las viñetas y `touch-action` del canvas de la página (ver Decisiones).

## Plan de implementación

1. Crear `src/panelGeometry.js` con las constantes, `panelRects` y `panelAt`, y `tests/panelGeometry.test.js` con los ejemplos de esta spec y un caso por cada una de las 8 plantillas (cantidad de viñetas y que ninguna se superpone ni sale del área útil). Cambiar `render.js` para usar `panelRects` y reexportar `PAGE_WIDTH_MM` / `PAGE_HEIGHT_MM`. Prueba: `npm test` y `npm run build` pasan y, a mano, la vista previa y el PDF se ven exactamente igual que antes.
2. En `src/state.js`, sumar `crop` a cada foto al cargarla, y `setImageCrop` y `resetImageCrop`. En `render.js`, dibujar cada foto con `cropRect` y su `crop`. Prueba: `npm test` y `npm run build` pasan y, a mano, todo se ve igual que antes (con `DEFAULT_CROP` el recorte es el mismo cover centrado).
3. En `src/ui.js` y `src/style.css`, la selección: presionar una viñeta la selecciona y la resalta, margen/medianil y Escape deselecciona, una sola selección en toda la vista previa, redibujo solo de las páginas afectadas y conservación por foto en los rearmados. Prueba manual: los criterios de selección.
4. En `src/ui.js` y `src/style.css`, el arrastre sobre la viñeta seleccionada (mouse y dedo, con el `touch-action` de Decisiones) y el bloque "Encuadre de la viñeta N" con Zoom y Centrar. Prueba manual: los criterios de arrastre, zoom y Centrar.
5. Verificar el PDF en A4 y A3 con fotos reencuadradas. Prueba manual: los criterios de PDF.
6. Actualizar `CLAUDE.md`: `panelGeometry.js` (y su test en la lista de tests), `crop` en las fotos del comic con `setImageCrop` / `resetImageCrop`, `renderPage` con `cropRect`, la selección de viñeta en `ui.js` y que `crop.js` / `cropControls.js` también los usa el comic.

## Criterios de aceptación

- [ ] `npm test` pasa, incluido `tests/panelGeometry.test.js`.
- [ ] `npm run build` termina sin errores.
- [ ] Recién cargadas, las fotos se ven en la vista previa y en el PDF igual que antes de esta spec.
- [ ] Presionar una viñeta la resalta con un contorno de acento y muestra debajo de su página "Encuadre de la viñeta N" con Zoom en 100 % y el botón Centrar.
- [ ] Presionar otra viñeta, en la misma página o en otra, mueve el resaltado y el bloque de encuadre: nunca hay dos viñetas seleccionadas.
- [ ] Presionar el margen o el medianil de una página, o apretar Escape, quita el resaltado y oculta el bloque de encuadre.
- [ ] Con el mouse, presionar una viñeta y arrastrar mueve la foto dentro de ella en el mismo gesto; la foto sigue al puntero y nunca deja huecos.
- [ ] En un celular, la vista previa se puede scrollear con el dedo mientras no hay selección; después de tocar una viñeta, arrastrar sobre ella mueve la foto.
- [ ] Mover el Zoom a 200 % agranda la foto en la viñeta y el texto dice "Zoom 200 %". Centrar la vuelve a zoom 100 % y centrada, y el control dice "Zoom 100 %".
- [ ] Arrastrar, hacer zoom o Centrar con un selector de color de página abierto en otra página no lo cierra.
- [ ] La foto de la portada se puede mover y agrandar; el título sigue en su posición encima de la foto.
- [ ] Una foto reencuadrada que se sube o se baja en la lista conserva su encuadre en su nueva viñeta, y sigue seleccionada si lo estaba.
- [ ] Cambiar la plantilla de una página conserva el encuadre de sus fotos (ajustado a la nueva proporción, sin huecos).
- [ ] Quitar la foto seleccionada deja la vista previa sin selección.
- [ ] El PDF A4 muestra cada foto con el mismo encuadre y zoom que la vista previa, sin el contorno de selección.
- [ ] El PDF A3 muestra cada foto con el mismo encuadre y zoom que la vista previa.
- [ ] Los cuadros y los stickers funcionan igual que antes de esta spec.

## Decisiones

- **Sí:** arrastrar directo sobre la viñeta + selección con controles Zoom y Centrar bajo la página. Elegido por la persona. Es lo más parecido a las tarjetas de cuadros y stickers sin partir la página en tarjetas.
- **No:** zoom con la rueda del mouse como único control. No se descubre y no anda en táctil.
- **No:** controles en la lista de miniaturas. Separa el control del lugar donde se ve el resultado.
- **Sí:** el encuadre se guarda por foto (`image.crop`). Elegido por la persona. Sobrevive a reordenar y a cambiar plantilla, y reusa `crop.js` tal cual.
- **No:** encuadre por página y viñeta. Se pierde o queda aplicado a otra foto cuando las páginas se reacomodan.
- **No:** aviso de baja resolución. Elegido por la persona. El PDF del comic sale a 150 DPI fijos y el aviso sería ruido en viñetas chicas.
- **Sí:** la portada se reencuadra como las demás. Elegido por la persona.
- **Sí:** una sola viñeta seleccionada en toda la vista previa. Elegido por la persona. Un único bloque de controles visible, sin ambigüedad sobre qué foto se está tocando.
- **Sí:** la selección se conserva por id de foto al rearmar la vista previa. Elegido por la persona.
- **Sí:** módulo puro `panelGeometry.js` con tests. Elegido por la persona. La detección de la viñeta tocada y el render comparten la misma geometría, y queda testeada.
- **No:** `attachCropDrag` en el comic. Supone un área fija por canvas; en una página el área depende de la viñeta donde empieza el arrastre. Se reusa `panCrop` y `createZoomControl`.
- **Sí:** en táctil, `touch-action` del canvas de la página es `pan-y pinch-zoom` mientras la página no tiene la viñeta seleccionada, y `none` cuando la tiene. Si fuera siempre `none`, una página A4 entera bloquearía el scroll en el celular. Por eso con el dedo el primer toque solo selecciona.
- **Sí:** el resaltado se dibuja en `ui.js` después de `renderPage`, no dentro del render, así el PDF nunca lo lleva.
- **No:** persistencia. Va con la spec de persistencia.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| Mover `panelRect` a `panelGeometry.js` cambia la posición de las viñetas | El paso 1 no cambia nada más; los tests fijan las medidas y se compara a mano la vista previa y el PDF con los de antes. |
| El canvas se muestra escalado por CSS y el punto tocado no coincide con la viñeta | Las coordenadas se pasan a mm con `getBoundingClientRect` del canvas, no con su tamaño en px. |
| Rearmar la vista previa en medio de un arrastre (por ejemplo, termina de cargar una foto) corta el gesto | La selección se conserva por foto; el arrastre se retoma con un nuevo gesto. Se acepta. |
| Redibujar toda la página en cada `pointermove` es lento en páginas de 4 viñetas | La vista previa es de baja resolución y se redibuja solo esa página; si hiciera falta, se agenda el redibujo una vez por frame. |

## Qué **no** incluye esta spec

- Aviso de baja resolución en el comic.
- Zoom con la rueda o con pellizco.
- "Centrar todas".
- Reencuadre desde las miniaturas.
- Girar la foto dentro de la viñeta.
- Manejo con teclado del encuadre.
- Mover el título de la portada.
- Cambios en los cuadros o los stickers.
- Persistencia entre sesiones.

Cada una de estas, si llega, va en su propia spec.
