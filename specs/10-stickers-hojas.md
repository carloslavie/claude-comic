# SPEC 10 — Stickers: hojas de stickers con forma, listas para imprimir y recortar

> **Estado:** Aprobado
> **Depende de:** SPEC 07, SPEC 08, SPEC 09
> **Fecha:** 2026-09-24
> **Objetivo:** Habilitar la herramienta "Creá plantillas para stickers", que recorta cada foto cargada con una forma fija (círculo, cuadrado o cuadrado redondeado), con borde opcional, reencuadre a mano y copias por foto, y genera un PDF a tamaño real con los stickers acomodados en hojas A4 o A3 y una línea de corte alrededor de cada uno.

## Por qué existe esta spec

La SPEC 07 dejó la tarjeta "Creá plantillas para stickers" en el menú como "Próximamente", con el id `stickers` y el hash `#/stickers` reservados. Esta spec construye esa herramienta.

Para hacer stickers caseros se imprime una hoja de papel adhesivo y se recortan a mano. Hace falta que cada foto salga a la medida exacta, con la forma elegida, varias veces por hoja y con una guía para recortar. La herramienta lo resuelve en el navegador, igual que el comic y los cuadros: las fotos nunca salen de la máquina.

La herramienta es hermana de los cuadros: reusa el encuadre (`crop.js`), el acomodo en hojas (`packFrames`), la resolución de exportación (`exportDpi`) y el arrastre con zoom de las tarjetas, que se extrae a un módulo compartido.

## Alcance

**Dentro:**

- La tarjeta "Creá plantillas para stickers" del menú pasa a estar disponible y lleva a `#/stickers`. La pestaña dice "Stickers · PictureFactory".
- Una vista nueva con la misma estructura que los cuadros: un panel lateral con los controles y un panel de vista previa.
- **Carga de fotos:** zona para arrastrar y botón "Elegir archivos", JPG, PNG o WebP, hasta 40 fotos, con los mismos mensajes de rechazo que el comic. Las fotos son propias de esta herramienta: no se comparten con el comic ni con los cuadros.
- **Forma:** un desplegable "Forma" con, en este orden: Círculo, Cuadrado y Cuadrado redondeado. Por defecto: Círculo. La forma es una sola para todos los stickers. El cuadrado redondeado tiene esquinas con un radio del 15 % del lado.
- **Tamaño:** un desplegable "Tamaño" con, en este orden: 3 cm, 4 cm, 5 cm, 7 cm, 10 cm y Personalizado. Por defecto: 5 cm. Es el diámetro del círculo o el lado del cuadrado. El tamaño es uno solo para todos los stickers.
- **Tamaño personalizado:** al elegirlo aparece un campo "Tamaño (cm)", precargado con el tamaño que estaba elegido. Va de 2 a 19 cm, con un decimal. Un valor fuera de rango muestra el aviso "El tamaño tiene que ir de 2 a 19 cm." y no cambia el tamaño vigente.
- **Borde:** un desplegable "Borde" con Ninguno, Fino (1,5 mm) y Ancho (3 mm), por defecto Fino, y un selector de color (la paleta del comic + color libre), por defecto blanco. Aplica a todos los stickers. El borde va **dentro** del tamaño y sigue la forma: el sticker sigue midiendo lo elegido y la foto se achica. El selector de color se deshabilita con "Ninguno".
- **Hoja:** un desplegable "Hoja" con A4 y A3, por defecto A4. Todos los tamaños entran en una A4, así que nunca se deshabilita una opción.
- **Vista previa:** una tarjeta por foto, en el orden de carga, con:
  - el sticker dibujado con su forma, tamaño, borde y encuadre, y la línea de corte sobre el contorno;
  - el sticker en texto (p. ej. "Círculo de 5 cm", "Cuadrado redondeado de 4,5 cm");
  - reencuadre: arrastrar la foto con el mouse o el dedo la mueve dentro del sticker;
  - un control "Zoom" de 100 % a 300 %;
  - un campo "Copias" de 1 a 50, por defecto 1;
  - botones "Centrar" (vuelve a zoom 100 % y foto centrada) y "Quitar";
  - el aviso "Baja resolución: puede verse pixelada" si la parte visible de la foto queda por debajo de 150 DPI al tamaño del sticker. No bloquea la descarga.
- **Copias:** un valor fuera de 1..50 se ajusta al extremo más cercano y un decimal se redondea, al salir del campo (`change`). Un campo vacío o que no es un número vuelve al valor anterior. Cambiar las copias no rearma la vista previa: solo actualiza el contador y el texto de hojas.
- Sin fotos, la vista previa muestra "Cargá fotos para ver los stickers." y "Descargar PDF" está deshabilitado.
- En el panel lateral, el contador "N fotos · M stickers" ("1 foto · 1 sticker" en singular), donde M es la suma de las copias.
- Junto al botón "Descargar PDF", el texto "Se van a generar N hojas A4" ("Se va a generar 1 hoja A4" con una sola; A3 en lugar de A4 con esa hoja).
- **PDF:**
  - Cada sticker se dibuja a tamaño real, a `exportDpi` (300 DPI con todos los tamaños), como JPEG 0.92, con fondo blanco fuera de la forma.
  - Cada foto se dibuja una sola vez y la misma imagen se reusa en todas sus copias.
  - Hojas A4 o A3 con margen de 10 mm y 5 mm entre stickers, igual que los cuadros.
  - Los stickers se acomodan en filas, de izquierda a derecha y de arriba hacia abajo, en el orden de carga y con las copias de cada foto seguidas. No se reordenan.
  - La orientación de la hoja es una sola para todo el PDF: se usa la que da menos hojas; si empatan, vertical.
  - Una línea de corte continua de 0,2 mm, gris `#999999`, justo sobre el contorno de cada sticker (círculo, cuadrado o cuadrado redondeado), trazada como vector.
  - El archivo se llama `stickers.pdf` con A4 y `stickers-a3.pdf` con A3.
  - Mientras se genera, el botón y el desplegable "Hoja" se deshabilitan.
- El arrastre y el zoom de las tarjetas se mueven de `src/frameUi.js` a `src/cropControls.js`, sin cambios de comportamiento. Los usan los cuadros y los stickers.
- El trabajo de stickers se conserva en memoria al ir al menú y volver, igual que el comic y los cuadros. Al recargar se pierde.
- El comic y los cuadros se ven y funcionan igual que antes de esta spec.

**Fuera (para specs futuras):**

- Recorte siguiendo el contorno de la figura (die-cut), con quitado de fondo.
- Formas rectangulares, ovaladas, de estrella u otras.
- Forma, tamaño o borde distintos por sticker.
- Etiquetas precortadas comerciales (plantillas tipo Avery).
- Archivos para plotter de corte (Cricut, Silhouette) y marcas de registro.
- Línea de corte punteada, de otro color o desplazada del contorno; sangrado.
- Control del radio del cuadrado redondeado.
- Llenar la hoja automáticamente repitiendo las fotos.
- Separación entre stickers distinta de 5 mm u optimizar el acomodo.
- Hoja Carta u otras hojas.
- Cambiar el orden de las fotos.
- Vista previa de las hojas del PDF.
- Exportar como imagen PNG con transparencia.
- Texto, filtros o decoraciones sobre la foto.
- Compartir fotos con el comic o los cuadros.
- Persistencia entre sesiones.

## Modelo de datos

### Formas, tamaños y bordes — `src/stickerSizes.js` (módulo nuevo, lógica pura)

Todas las medidas en mm. Los stickers son siempre cuadrados (el círculo se inscribe en el cuadrado), así que no tienen orientación.

```js
// El orden de inserción es el orden del desplegable.
export const STICKER_SHAPES = {
  circle: { id: 'circle', label: 'Círculo' },
  square: { id: 'square', label: 'Cuadrado' },
  rounded: { id: 'rounded', label: 'Cuadrado redondeado' },
};
export const DEFAULT_STICKER_SHAPE = 'circle';
export const ROUNDED_RADIUS = 0.15; // fracción del lado

// El orden de inserción es el orden del desplegable. Claves no numéricas para
// que JavaScript no las reordene.
export const STICKER_SIZES = {
  '3cm': { id: '3cm', label: '3 cm', size: 30 },
  '4cm': { id: '4cm', label: '4 cm', size: 40 },
  '5cm': { id: '5cm', label: '5 cm', size: 50 },
  '7cm': { id: '7cm', label: '7 cm', size: 70 },
  '10cm': { id: '10cm', label: '10 cm', size: 100 },
  custom: { id: 'custom', label: 'Personalizado' }, // usa stickerState.customSize
};
export const DEFAULT_STICKER_SIZE = '5cm';
export const CUSTOM_STICKER_LIMITS = { min: 20, max: 190 }; // mm

// El orden de inserción es el orden del desplegable.
export const STICKER_BORDERS = {
  none: { id: 'none', label: 'Ninguno', width: 0 },
  fino: { id: 'fino', label: 'Fino (1,5 mm)', width: 1.5 },
  ancho: { id: 'ancho', label: 'Ancho (3 mm)', width: 3 },
};
export const DEFAULT_STICKER_BORDER = 'fino';
export const DEFAULT_BORDER_COLOR = '#ffffff';

export const COPIES_LIMITS = { min: 1, max: 50 };
```

Funciones:

- `resolveStickerSize(sizeId, customSize)`: el tamaño en mm. `'custom'` devuelve `customSize`. Una clave desconocida usa `DEFAULT_STICKER_SIZE`.
  - `resolveStickerSize('5cm', 80)` → `50`; `resolveStickerSize('custom', 80)` → `80`; `resolveStickerSize('xyz', 80)` → `50`.
- `normalizeCustomStickerSize(mm)`: el tamaño redondeado a 1 mm, o `null` si no es un número o queda fuera de `CUSTOM_STICKER_LIMITS`.
  - `normalizeCustomStickerSize(45)` → `45`; `normalizeCustomStickerSize(190)` → `190`; `normalizeCustomStickerSize(45.4)` → `45`.
  - `normalizeCustomStickerSize(19)` → `null`; `normalizeCustomStickerSize(191)` → `null`; `normalizeCustomStickerSize(NaN)` → `null`.
- `normalizeCopies(value)`: entero entre `COPIES_LIMITS.min` y `COPIES_LIMITS.max`, o `null` si no es un número.
  - `normalizeCopies(3)` → `3`; `normalizeCopies(0)` → `1`; `normalizeCopies(80)` → `50`; `normalizeCopies(2.6)` → `3`; `normalizeCopies(NaN)` → `null`.
- `shapeRadius(shapeId, side)`: radio de las esquinas en mm. `circle` → `side / 2`; `square` → `0`; `rounded` → `side * ROUNDED_RADIUS`. Una clave desconocida usa `DEFAULT_STICKER_SHAPE`.
  - `shapeRadius('circle', 50)` → `25`; `shapeRadius('square', 50)` → `0`; `shapeRadius('rounded', 50)` → `7.5`.
- `stickerFor(size, shapeId, borderId, borderColor)`: `{ size, shape, border, borderColor }`, con `border` en mm (`0` con una clave desconocida) y `shape` validada (una clave desconocida usa `DEFAULT_STICKER_SHAPE`).
  - `stickerFor(50, 'circle', 'fino', '#ffffff')` → `{ size: 50, shape: 'circle', border: 1.5, borderColor: '#ffffff' }`.
- `stickerPhotoArea(sticker)`: el área de la foto dentro del borde, `{ x, y, side, radius }` en mm: `x = y = border`, `side = size - 2 * border`, `radius = max(0, shapeRadius(shape, size) - border)`.
  - Círculo 50 con borde 1,5 → `{ x: 1.5, y: 1.5, side: 47, radius: 23.5 }`.
  - Redondeado 50 con borde 3 → `{ x: 3, y: 3, side: 44, radius: 4.5 }`.
  - Cuadrado 50 sin borde → `{ x: 0, y: 0, side: 50, radius: 0 }`.
- `expandCopies(images, size)`: la lista para `packFrames`, `[{ id, width: size, height: size }]`, con cada foto repetida `copies` veces, en orden.
  - Fotos `a` (2 copias) y `b` (1 copia) con 50 → `[{ id: 'a', … }, { id: 'a', … }, { id: 'b', … }]`.
- `stickerText(shapeId, size)`: `"Círculo de 5 cm"`, `"Cuadrado redondeado de 4,5 cm"` (cm con coma decimal, sin decimal si es entero).
- `stickersFileName(sheetId)`: `'stickers.pdf'` con A4 (o clave desconocida) y `'stickers-a3.pdf'` con A3.

Con 5 mm entre stickers y 10 mm de margen, entran 15 círculos de 5 cm por A4 (3 × 5) y 24 de 4 cm (4 × 6).

### Estado — `src/stickerState.js` (módulo nuevo)

```js
export const stickerState = {
  images: [], // StickerImage[], en el orden de carga
  size: DEFAULT_STICKER_SIZE, // clave de STICKER_SIZES
  customSize: 50, // mm, se usa con size === 'custom'
  shape: DEFAULT_STICKER_SHAPE, // clave de STICKER_SHAPES
  border: DEFAULT_STICKER_BORDER, // clave de STICKER_BORDERS
  borderColor: DEFAULT_BORDER_COLOR, // '#rrggbb'
  sheet: DEFAULT_FRAME_SHEET, // clave de FRAME_SHEETS
};

// StickerImage
{
  id: 'sticker-1',
  name: 'foto.jpg',
  url: 'blob:…',
  bitmap: ImageBitmap,
  width: 4000, // px
  height: 3000, // px
  crop: { zoom: 1, centerX: 0.5, centerY: 0.5 },
  copies: 1,
}
```

Mutaciones:

- `addStickerFiles(files)`: igual que `addFrameFiles` (tipos `ACCEPTED_TYPES`, límite `MAX_IMAGES`, importados de `src/state.js`, y los mismos motivos de rechazo `type` / `limit` / `decode`). Cada foto nueva lleva `crop` igual a `DEFAULT_CROP` y `copies: 1`.
- `removeStickerImage(id)`: la quita y revoca su object URL.
- `setStickerSize(sizeId)`: ignora claves desconocidas. Al elegir `'custom'`, `customSize` toma el tamaño que estaba elegido.
- `setCustomStickerSize(mm)`: guarda `normalizeCustomStickerSize(mm)`. Si da `null`, no cambia nada y devuelve `false`; si no, devuelve `true`.
- `setStickerShape(shapeId)`, `setStickerBorder(borderId)` y `setStickerSheet(sheetId)`: ignoran claves desconocidas.
- `setStickerBorderColor(color)`.
- `setStickerCrop(id, crop)` y `resetStickerCrop(id)` (vuelve a `DEFAULT_CROP`).
- `setStickerCopies(id, value)`: guarda `normalizeCopies(value)`. Si da `null`, no cambia nada y devuelve `false`; si no, devuelve `true`.
- `currentStickerSize()`: `resolveStickerSize(stickerState.size, stickerState.customSize)`.

### Controles compartidos de tarjeta — `src/cropControls.js` (módulo nuevo, con DOM)

Sale de `createFrameCard()` en `src/frameUi.js`, sin cambios de comportamiento:

- `attachCropDrag(canvas, { image, area, outer, setCrop, onChange })`: el arrastre con pointer events y `setPointerCapture`. `area` es `{ width, height }` del área de la foto en mm y `outer` `{ width, height }` del canvas en mm; con eso mide el desplazamiento en fracciones del área en pantalla y llama a `setCrop(image.id, panCrop(…))` y después a `onChange()`.
- `createZoomControl({ image, area, setCrop, onChange })`: el `<label>` con el rango de 100 a 300 % y el texto "Zoom N %". Devuelve `{ element, sync }`; `sync()` pone el rango y el texto según `image.crop.zoom` (lo usa "Centrar").
- `makeCardButton(label, ariaLabel, onClick)`: se mueve tal cual.

Las clases CSS de la tarjeta (`frame-card-zoom`, `frame-card-actions`, `is-dragging`) no cambian; los stickers las reusan.

### Módulos con DOM

- `src/stickerRender.js`: `renderSticker(image, sticker, canvas, { cutLine = false } = {})`. Toma la escala del ancho del canvas. Borra el canvas (transparente), pinta la forma exterior con `borderColor`, recorta a la forma del área de la foto (`stickerPhotoArea`) y dibuja ahí el rectángulo `cropRect(image.width, image.height, side, side, image.crop)`. Con `cutLine`, traza el contorno exterior con una línea de 1 px `#999999` (la vista previa lo usa; el PDF no, porque traza la línea como vector).
- `src/stickerPdf.js`: `exportStickersPdf(images, { size, shape, border, borderColor, sheet })`. Arma la lista con `expandCopies`, la acomoda con `packFrames` y crea un `jsPDF` con la hoja y la orientación que devuelve. Dibuja cada foto una sola vez en un canvas de `exportDpi(size, size)`, pintado de blanco antes de `renderSticker`, y la convierte a JPEG 0.92. La agrega en cada posición con `doc.addImage(…, alias = image.id)`, así jsPDF la guarda una vez. Traza la línea de corte con `doc.circle`, `doc.rect` o `doc.roundedRect`, 0,2 mm, `#999999`. Cede el hilo entre fotos. Descarga con `stickersFileName(sheet)`.
- `src/stickerUi.js`: `initStickersUI()`, DOM y eventos de `#stickers-view`. Desplegables Forma, Tamaño (con "Tamaño (cm)" para Personalizado, validado en `change`), Borde (el color va en un `<fieldset>` que se deshabilita con "Ninguno") y Hoja. `refresh()` actualiza los controles, el contador y el texto de hojas y agenda las tarjetas (una vez por frame). Cambiar forma, tamaño, borde o su color rearma todas las tarjetas. Cada tarjeta (`createStickerCard()`) usa `attachCropDrag`, `createZoomControl` y `makeCardButton`; el arrastre, el zoom y "Centrar" redibujan solo esa tarjeta y su aviso de resolución; "Copias" actualiza el contador y el texto de hojas sin rearmar; "Quitar" rearma toda la vista previa.

Convenciones:

- La vista es `<div id="stickers-view" data-view="stickers" hidden>`, con su propia regla `#stickers-view[hidden] { display: none; }`.
- `initStickersUI()` se llama una sola vez al arrancar, después de `initFramesUI()`.
- Los canvas de la vista previa llevan `touch-action: none`.
- El campo "Tamaño (cm)" es un `<input type="number" min="2" max="19" step="0.1">` y se lee con `valueAsNumber * 10`, igual que "Ancho (cm)" y "Alto (cm)" de los cuadros.
- El campo "Copias" es un `<input type="number" min="1" max="50" step="1">`.

## Plan de implementación

1. Crear `src/stickerSizes.js` y `tests/stickerSizes.test.js`: `resolveStickerSize`, `normalizeCustomStickerSize`, `normalizeCopies`, `shapeRadius`, `stickerFor`, `stickerPhotoArea`, `expandCopies`, `stickerText` y `stickersFileName` con los ejemplos de esta spec, y que los valores por defecto existen en sus catálogos. Sumar un test de `packFrames` con `expandCopies`: 15 stickers de 50 mm en A4 dan 1 hoja y 16 dan 2. Prueba: `npm test` pasa.
2. Crear `src/cropControls.js` con `attachCropDrag`, `createZoomControl` y `makeCardButton`, y usarlos desde `createFrameCard()` en `src/frameUi.js`. Prueba: `npm test` y `npm run build` pasan y, a mano, en Cuadros el arrastre (mouse y dedo), el zoom, "Centrar" y los botones funcionan igual que antes.
3. Crear `src/stickerState.js` con `stickerState` y sus mutaciones. Prueba: `npm run build` pasa.
4. En `index.html`, agregar `<div id="stickers-view" data-view="stickers" hidden>` con el panel lateral (zona de carga, mensajes, desplegables "Forma", "Tamaño" con el campo personalizado oculto, "Borde" con el lugar del selector de color, "Hoja" y el contador) y el panel de vista previa (encabezado con el texto de hojas y "Descargar PDF", texto de vacío y contenedor de tarjetas). Crear `src/stickerRender.js` y `src/stickerUi.js` con la carga, los controles y las tarjetas con el sticker dibujado, el texto, "Copias", "Quitar", el contador y el texto de hojas; "Descargar PDF" queda deshabilitado en este paso. En `src/tools.js`, poner `stickers.available = true`, y en `tests/tools.test.js` cambiar el caso de `#/stickers` (→ `{ view: 'stickers', hash: '#/stickers' }`), sumar `documentTitle('stickers')` → `'Stickers · PictureFactory'` y un hash desconocido que sigue yendo al menú. En `src/main.js`, llamar a `initStickersUI()` después de `initFramesUI()`. Agregar los estilos de la vista en `src/style.css`. Prueba manual: desde el menú se entra a Stickers, se cargan fotos y cada una aparece con la forma, el tamaño y el borde elegidos.
5. En `src/stickerUi.js`, agregar a cada tarjeta el arrastre, el control "Zoom", "Centrar" y el aviso de baja resolución, con `src/cropControls.js`. Prueba manual: arrastrar y hacer zoom cambian solo esa tarjeta sin salirse de la foto; "Centrar" vuelve al recorte automático.
6. Crear `src/stickerPdf.js` y conectar "Descargar PDF" en `src/stickerUi.js`: deshabilitado sin fotos y mientras se genera, junto con el desplegable "Hoja". Prueba manual: los criterios de PDF de esta spec.
7. Actualizar `CLAUDE.md`: la herramienta de stickers disponible (ya no hay herramientas "Próximamente"), la vista `#stickers-view` y el hash `#/stickers`, los módulos nuevos (`stickerSizes.js`, `stickerState.js`, `stickerRender.js`, `stickerPdf.js`, `stickerUi.js`, `cropControls.js`), el cambio en `frameUi.js` y el test nuevo.

## Criterios de aceptación

- [ ] `npm test` pasa, incluidos `tests/stickerSizes.test.js` y los cambios de `tests/tools.test.js`.
- [ ] `npm run build` termina sin errores.
- [ ] En el menú, la tarjeta "Creá plantillas para stickers" ya no dice "Próximamente", se puede enfocar con Tab y lleva a `#/stickers`.
- [ ] En `#/stickers`, la pestaña dice "Stickers · PictureFactory" y se ve el enlace "← Inicio". Abrir la app directo en `#/stickers` muestra la herramienta.
- [ ] Un hash desconocido (p. ej. `#/xyz`) sigue mandando al menú.
- [ ] Sin fotos, se ve "Cargá fotos para ver los stickers." y "Descargar PDF" está deshabilitado.
- [ ] Cargar un archivo que no es JPG/PNG/WebP o pasar de 40 fotos muestra los mismos mensajes que en el comic.
- [ ] El desplegable "Forma" tiene Círculo, Cuadrado y Cuadrado redondeado, con Círculo elegido al abrir.
- [ ] El desplegable "Tamaño" tiene, en este orden: 3 cm, 4 cm, 5 cm, 7 cm, 10 cm y Personalizado, con 5 cm elegido al abrir.
- [ ] Con una foto cargada al abrir, la tarjeta dice "Círculo de 5 cm" y el sticker se ve redondo con un borde blanco fino y la línea de corte gris.
- [ ] Cambiar a "Cuadrado redondeado" cambia la forma de todas las tarjetas, con esquinas redondeadas también en el borde y en la foto.
- [ ] Al elegir "Personalizado", aparece "Tamaño (cm)" con 5. Con 4,5 todas las tarjetas dicen "… de 4,5 cm". Con 1 o 20 aparece "El tamaño tiene que ir de 2 a 19 cm." y los stickers no cambian.
- [ ] El desplegable "Borde" tiene Ninguno, Fino (1,5 mm) y Ancho (3 mm), con Fino elegido al abrir y el selector de color habilitado. Con "Ninguno" el selector se deshabilita y la foto llega hasta la línea de corte.
- [ ] Con borde Ancho y color Negro, todos los stickers muestran un borde negro de 3 mm dentro del tamaño, siguiendo la forma.
- [ ] Arrastrar la foto de una tarjeta la mueve dentro del sticker, sin dejar nunca un hueco sin foto. Funciona con mouse y con el dedo en un celular, sin desplazar la página.
- [ ] El zoom va de 100 % a 300 %. "Centrar" vuelve a 100 % con la foto centrada.
- [ ] Una foto de 300 × 300 px en un sticker de 10 cm muestra "Baja resolución: puede verse pixelada". Una de 4000 × 3000 px en 5 cm no lo muestra.
- [ ] "Copias" empieza en 1. Escribir 0 lo deja en 1, 80 lo deja en 50 y 2,6 lo deja en 3; borrarlo vuelve al valor anterior.
- [ ] Con 2 fotos, una con 3 copias, el contador dice "2 fotos · 4 stickers".
- [ ] Con 1 foto, 5 cm y 15 copias en A4, el texto dice "Se va a generar 1 hoja A4"; con 16 copias, "Se van a generar 2 hojas A4".
- [ ] Cambiar las copias no mueve el foco del campo ni rearma las tarjetas.
- [ ] "Quitar" saca la foto y actualiza el contador y el texto de hojas.
- [ ] El desplegable "Hoja" tiene A4 y A3, con A4 elegido al abrir, y ninguna opción se deshabilita con ningún tamaño.
- [ ] Con 1 foto con 15 copias en círculo de 5 cm y hoja A4, el PDF `stickers.pdf` tiene 1 hoja A4 vertical con 5 filas de 3 stickers.
- [ ] Con hoja A3 el archivo se llama `stickers-a3.pdf`.
- [ ] Las copias de cada foto salen seguidas y en el orden de carga.
- [ ] Cada sticker del PDF tiene una línea de corte gris continua justo sobre su contorno (círculo, cuadrado o redondeado según la forma).
- [ ] Impreso al 100 %, un círculo de 5 cm mide 5 cm de diámetro sobre la línea de corte.
- [ ] Cada sticker del PDF se ve igual que en su tarjeta: forma, borde, encuadre y zoom. Fuera de la forma, la hoja queda blanca.
- [ ] Un PDF con 40 fotos de 4000 × 3000 px y 10 copias cada una se genera sin errores en Chrome de escritorio.
- [ ] Mientras se genera el PDF, "Descargar PDF" y "Hoja" están deshabilitados.
- [ ] Con fotos cargadas, un encuadre cambiado, copias y borde elegidos, ir al menú y volver a Stickers los muestra igual.
- [ ] Las fotos cargadas en Stickers no aparecen en el comic ni en los cuadros, ni al revés.
- [ ] En Cuadros, el arrastre, el zoom, "Girar", "Centrar" y "Quitar" funcionan igual que antes de esta spec.
- [ ] El comic funciona igual que antes de esta spec.

## Decisiones

- **Sí:** formas fijas (círculo, cuadrado y cuadrado redondeado). Elegido por la persona. Reusan el recorte de `crop.js`.
- **No:** recorte siguiendo la silueta (die-cut). Necesita quitar el fondo de la foto: es una spec aparte y mucho más grande.
- **Sí:** una forma, un tamaño y un borde para todos los stickers. Elegido por la persona. El acomodo queda en una grilla simple.
- **No:** forma o tamaño por sticker. Suma controles por tarjeta y mezcla tamaños en la hoja.
- **Sí:** se recortan a mano con una línea de corte sobre el contorno. Elegido por la persona. Sirve con papel adhesivo común.
- **No:** etiquetas precortadas. Obliga a calzar plantillas de marcas concretas.
- **No:** plotter de corte. Necesita marcas de registro y otro formato: merece su propia spec.
- **Sí:** línea continua de 0,2 mm `#999999`, justo sobre el contorno, trazada como vector. Elegido por la persona. Es la misma línea que las marcas de corte de los cuadros y el vector queda nítido a cualquier zoom.
- **No:** solo marcas en las esquinas. No sirven para círculos ni redondeados.
- **Sí:** copias por foto, de 1 a 50, en un campo de cada tarjeta. Elegido por la persona. Con 40 fotos el tope es 2000 stickers.
- **No:** llenar la hoja repitiendo las fotos. Es menos predecible que elegir cuántas.
- **Sí:** un valor de copias fuera de rango se ajusta al extremo y uno vacío vuelve al anterior. Nunca queda un valor inválido y no hace falta un aviso.
- **Sí:** catálogo de tamaños (3, 4, 5, 7 y 10 cm) + personalizado. Elegido por la persona.
- **Sí:** el personalizado va de 2 a 19 cm. Elegido por la persona. 19 cm es el área útil de una A4 (190 mm), así la hoja A4 nunca queda deshabilitada.
- **Sí:** círculo de 5 cm por defecto. Elegido por la persona. Es el sticker más común y entran 15 por A4.
- **Sí:** el radio del cuadrado redondeado es el 15 % del lado, fijo. Elegido por la persona. Se ve igual en cualquier tamaño.
- **Sí:** el radio de la foto dentro del borde es el radio exterior menos el borde. El borde queda de grosor parejo también en las esquinas.
- **Sí:** borde opcional (Ninguno, Fino 1,5 mm, Ancho 3 mm) con color, por defecto Fino blanco, dentro del tamaño. Elegido por la persona. Es el borde clásico de un sticker y disimula un corte imperfecto.
- **No:** achicar el borde si deja poca foto, como el paspartú de los cuadros. Con el mínimo de 2 cm y un borde de 3 mm siempre quedan 14 mm de foto.
- **Sí:** vista previa con una tarjeta por foto, como los cuadros. Elegido por la persona. Las hojas se resumen en "Se van a generar N hojas".
- **No:** vista previa de las hojas del PDF. Puede ir en otra spec.
- **Sí:** hojas A4 y A3, por defecto A4. Elegido por la persona. Reusa `FRAME_SHEETS`.
- **No:** hoja Carta. Puede ir en otra spec.
- **Sí:** 10 mm de margen y 5 mm entre stickers, con `packFrames` tal cual. Elegido por la persona. No hay que tocar el acomodo de los cuadros y 5 mm es cómodo para cortar con tijera.
- **Sí:** 300 DPI (`exportDpi`) y JPEG 0.92, con fondo blanco fuera de la forma. El papel es blanco y JPEG no tiene transparencia.
- **Sí:** cada foto se dibuja una vez y se reusa en sus copias con un alias de jsPDF. Con 50 copias el PDF no se multiplica por 50 ni en tiempo ni en peso.
- **Sí:** el arrastre y el zoom se extraen a `src/cropControls.js` en un paso propio, probado con los cuadros antes de seguir. Elegido por la persona. Evita dos copias del mismo código, como se hizo con `colorPicker.js`.
- **No:** duplicar el arrastre en `stickerUi.js`.
- **Sí:** fotos y estado propios de la herramienta (`stickerState`), separados del comic y los cuadros. Mismo criterio que la SPEC 08.
- **Sí:** formas, tamaños, copias y geometría en un módulo puro (`stickerSizes.js`) probado con Vitest, igual que el resto de la lógica.
- **Sí:** `home.js` conserva el soporte para tarjetas "Próximamente" aunque ya no quede ninguna. Sirve para la próxima herramienta.
- **No:** persistencia. Va con la spec de persistencia.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| Extraer el arrastre y el zoom rompe los cuadros | El paso 2 los mueve sin cambios de comportamiento y se prueba Cuadros antes de seguir. Hay un criterio de aceptación para eso. |
| La línea de corte vectorial y la imagen del sticker no coinciden y queda un filo blanco o de otro color | La imagen se agrega exactamente en `x`, `y`, `size` y la línea usa las mismas medidas en mm. El borde (Fino por defecto) disimula una diferencia de décimas. |
| Un PDF con 2000 stickers es pesado o lento | Cada foto se dibuja y se embebe una sola vez (alias de jsPDF); las copias son referencias. Se cede el hilo entre fotos. |
| La impresora escala el PDF ("ajustar a la página") y el sticker no mide lo que tiene que medir | Criterio de aceptación que mide un sticker impreso al 100 %. El margen de 10 mm deja lugar para los márgenes no imprimibles. |
| Cambiar las copias rearma las tarjetas y el campo pierde el foco | "Copias" solo actualiza el contador y el texto de hojas. Hay un criterio de aceptación para eso. |
| El arrastre con el dedo desplaza la página en lugar de la foto | `touch-action: none` en los canvas y `setPointerCapture`, igual que los cuadros. |

## Qué **no** incluye esta spec

- Recorte siguiendo la silueta de la figura.
- Otras formas (rectángulo, óvalo, estrella…).
- Forma, tamaño o borde por sticker.
- Etiquetas precortadas o archivos para plotter de corte.
- Otros estilos de línea de corte o sangrado.
- Control del radio del redondeo.
- Llenar la hoja automáticamente.
- Otra separación entre stickers u optimizar el acomodo.
- Hoja Carta u otras hojas.
- Cambiar el orden de las fotos.
- Vista previa de las hojas del PDF.
- Exportar como PNG.
- Texto, filtros o decoraciones.
- Compartir fotos con el comic o los cuadros.
- Persistencia entre sesiones.

Cada una de estas, si llega, va en su propia spec.
