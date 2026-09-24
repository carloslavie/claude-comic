# SPEC 08 — Cuadros: una foto por cuadro, lista para imprimir y enmarcar

> **Estado:** Implementado
> **Depende de:** SPEC 02, SPEC 07
> **Fecha:** 2026-09-24
> **Objetivo:** Habilitar la herramienta "Creá imágenes para cuadros", que recorta cada foto cargada a la medida de un marco (con paspartú opcional y reencuadre a mano) y genera un PDF a tamaño real con los cuadros acomodados en hojas A4 o A3 con marcas de corte.

## Por qué existe esta spec

La SPEC 07 dejó la tarjeta "Creá imágenes para cuadros" en el menú como "Próximamente", con el id `cuadros` y el hash `#/cuadros` reservados. Esta spec construye esa herramienta.

Para enmarcar una foto hay que imprimirla a la medida exacta del marco, con la parte de la foto que se quiere mostrar. Hoy eso obliga a usar un editor de imágenes y a calcular medidas a mano. La herramienta lo resuelve en el navegador, igual que el comic: las fotos nunca salen de la máquina.

Esta spec cubre **una foto por cuadro**. El collage (varias fotos en un mismo cuadro) va en una spec posterior, que se apoya en esta.

## Alcance

**Dentro:**

- La tarjeta "Creá imágenes para cuadros" del menú pasa a estar disponible y lleva a `#/cuadros`. La pestaña dice "Cuadros · PictureFactory".
- Una vista nueva con la misma estructura que el comic: un panel lateral con los controles y un panel de vista previa.
- **Carga de fotos:** zona para arrastrar y botón "Elegir archivos", JPG, PNG o WebP, hasta 40 fotos, con los mismos mensajes de rechazo que el comic. Las fotos son propias de esta herramienta: no se comparten con el comic.
- **Medida:** un desplegable con, en este orden: 10 × 15 cm, 13 × 18 cm, 15 × 20 cm, 20 × 25 cm, 20 × 30 cm, A4 (21 × 29,7 cm) y Personalizada. Por defecto: 13 × 18 cm. La medida es una sola para todas las fotos.
- **Medida personalizada:** al elegirla aparecen dos campos, "Ancho (cm)" y "Alto (cm)", precargados con la medida que estaba elegida. Cada lado va de 5 a 40 cm y el lado corto no puede pasar de 27 cm. Un valor fuera de rango muestra el aviso "La medida tiene que ir de 5 a 40 cm, con el lado corto de hasta 27 cm." y no cambia la medida vigente.
- **Orientación:** cada cuadro es vertical u horizontal según su foto: una foto apaisada da un cuadro horizontal y una vertical o cuadrada, uno vertical. Cada cuadro tiene un botón "Girar" que cambia su orientación.
- **Paspartú:** un desplegable "Paspartú" con Ninguno, Fino (1 cm), Medio (2 cm) y Ancho (4 cm), por defecto Ninguno, y un selector de color (la paleta del comic + color libre), por defecto blanco. Aplica a todos los cuadros. El paspartú va **dentro** de la medida: el cuadro sigue midiendo lo elegido y la foto se achica. Si el paspartú no deja al menos 2 cm de foto en el lado corto, se achica solo. El selector de color se deshabilita con "Ninguno".
- **Hoja:** un desplegable "Hoja" con A4 y A3, por defecto A4. Si algún cuadro de la medida elegida no entra en una A4 (20 × 25, 20 × 30, A4 y las personalizadas grandes), la opción A4 se deshabilita, la hoja pasa a A3 y se muestra "Esta medida necesita hoja A3.". Al volver a una medida chica, la hoja queda en A3 hasta que se cambie a mano.
- **Vista previa:** una tarjeta por foto, en el orden de carga, con:
  - el cuadro dibujado con su medida, orientación, paspartú y encuadre;
  - la medida del cuadro en texto (p. ej. "13 × 18 cm, vertical");
  - reencuadre: arrastrar la foto con el mouse o el dedo la mueve dentro del cuadro;
  - un control "Zoom" de 100 % a 300 %;
  - botones "Girar", "Centrar" (vuelve a zoom 100 % y foto centrada) y "Quitar";
  - el aviso "Baja resolución: puede verse pixelada" si la parte visible de la foto queda por debajo de 150 DPI a la medida del cuadro. No bloquea la descarga.
- Sin fotos, la vista previa muestra "Cargá fotos para ver los cuadros." y "Descargar PDF" está deshabilitado.
- Junto al botón "Descargar PDF", el texto "Se van a generar N hojas A4" ("Se va a generar 1 hoja A4" con una sola; A3 en lugar de A4 con esa hoja).
- **PDF:**
  - Cada cuadro se dibuja a tamaño real, a 300 DPI, como JPEG 0.92.
  - Hojas A4 o A3 con margen de 10 mm y 5 mm entre cuadros.
  - Los cuadros se acomodan en filas, de izquierda a derecha y de arriba hacia abajo, en el orden de carga. No se reordenan.
  - La orientación de la hoja (vertical u horizontal) es una sola para todo el PDF: se usa la que da menos hojas; si empatan, vertical.
  - Un cuadro que no entra en la hoja en su orientación se pone girado 90° en esa hoja. Una vez recortado queda igual.
  - Marcas de corte en las cuatro esquinas de cada cuadro, por fuera del cuadro.
  - El archivo se llama `cuadros.pdf` con A4 y `cuadros-a3.pdf` con A3.
  - Mientras se genera, el botón y los controles de hoja se deshabilitan.
- El trabajo de cuadros se conserva en memoria al ir al menú y volver, igual que el comic. Al recargar se pierde.
- El comic se ve y funciona igual que antes de esta spec.

**Fuera (para specs futuras):**

- Collage: varias fotos en un mismo cuadro, con plantillas.
- La herramienta de plantillas para stickers.
- Medida, paspartú o color distintos por cuadro.
- Cambiar el orden de las fotos.
- Optimizar el acomodo en la hoja (reordenar o girar cuadros para ahorrar papel).
- Medidas que no entran en una A3 (30 × 40, 40 × 50…) y hojas del tamaño del cuadro para imprenta.
- Vista previa de las hojas del PDF.
- Exportar como imagen JPG o PNG.
- Filtros, ajustes de color, texto o bordes decorativos sobre la foto.
- Compartir fotos con el comic.
- Persistencia entre sesiones.

## Modelo de datos

### Medidas y paspartú — `src/frameSizes.js` (módulo nuevo, lógica pura)

Todas las medidas en mm. Cada medida guarda su lado corto y su lado largo; la orientación decide cuál es el ancho.

```js
// El orden de inserción es el orden del desplegable.
export const FRAME_SIZES = {
  '10x15': { id: '10x15', label: '10 × 15 cm', short: 100, long: 150 },
  '13x18': { id: '13x18', label: '13 × 18 cm', short: 130, long: 180 },
  '15x20': { id: '15x20', label: '15 × 20 cm', short: 150, long: 200 },
  '20x25': { id: '20x25', label: '20 × 25 cm', short: 200, long: 250 },
  '20x30': { id: '20x30', label: '20 × 30 cm', short: 200, long: 300 },
  a4: { id: 'a4', label: 'A4 (21 × 29,7 cm)', short: 210, long: 297 },
  custom: { id: 'custom', label: 'Personalizada' }, // usa frameState.customSize
};
export const DEFAULT_FRAME_SIZE = '13x18';

export const CUSTOM_SIZE_LIMITS = { min: 50, max: 400, maxShort: 270 }; // mm

// El orden de inserción es el orden del desplegable.
export const MATS = {
  none: { id: 'none', label: 'Ninguno', width: 0 },
  fino: { id: 'fino', label: 'Fino (1 cm)', width: 10 },
  medio: { id: 'medio', label: 'Medio (2 cm)', width: 20 },
  ancho: { id: 'ancho', label: 'Ancho (4 cm)', width: 40 },
};
export const DEFAULT_MAT = 'none';
export const DEFAULT_MAT_COLOR = '#ffffff';
export const MIN_PHOTO_MM = 20; // lado corto mínimo de la foto dentro del paspartú
```

Funciones:

- `frameOrientation(imageW, imageH)`: `'landscape'` si `getOrientation` da `landscape`; si no, `'portrait'`.
  - `frameOrientation(4000, 3000)` → `'landscape'`; `frameOrientation(3000, 4000)` → `'portrait'`; `frameOrientation(1000, 1000)` → `'portrait'`.
- `resolveFrameSize(sizeId, customSize)`: `{ short, long }` en mm. `'custom'` devuelve `customSize`. Una clave desconocida usa `DEFAULT_FRAME_SIZE`.
- `frameDimensions({ short, long }, orientation)`: `{ width, height }` en mm.
  - `frameDimensions({ short: 130, long: 180 }, 'portrait')` → `{ width: 130, height: 180 }`; con `'landscape'` → `{ width: 180, height: 130 }`.
- `normalizeCustomSize(aMm, bMm)`: `{ short, long }` redondeado a mm enteros, o `null` si algún lado no es un número, está fuera de 50..400 o el corto pasa de 270.
  - `normalizeCustomSize(250, 180)` → `{ short: 180, long: 250 }`.
  - `normalizeCustomSize(300, 300)` → `null`; `normalizeCustomSize(40, 100)` → `null`; `normalizeCustomSize(NaN, 100)` → `null`.
- `effectiveMat(matId, width, height)`: grosor real del paspartú en mm: `min(MATS[matId].width, (min(width, height) - MIN_PHOTO_MM) / 2)`, nunca menor que 0. Una clave desconocida vale `0`.
  - `effectiveMat('ancho', 100, 150)` → `40`; `effectiveMat('ancho', 50, 50)` → `15`; `effectiveMat('fino', 130, 180)` → `10`.
- `photoArea(width, height, mat)`: `{ x: mat, y: mat, width: width - 2 * mat, height: height - 2 * mat }` en mm.

### Encuadre — `src/crop.js` (módulo nuevo, lógica pura)

El encuadre de cada foto es `{ zoom, centerX, centerY }`: `zoom` de 1 a 3 y el centro de la parte visible en fracciones 0..1 de la foto.

```js
export const DEFAULT_CROP = { zoom: 1, centerX: 0.5, centerY: 0.5 };
export const ZOOM_MIN = 1;
export const ZOOM_MAX = 3;
export const LOW_DPI = 150;
```

Funciones (`imageW`/`imageH` en px, `photoW`/`photoH` en mm, solo importa su proporción salvo en `cropDpi`):

- `cropRect(imageW, imageH, photoW, photoH, crop)`: rectángulo de la foto que se ve, `{ sx, sy, sw, sh }` en px. A zoom 1 es el recorte cover; a zoom `z`, `sw` y `sh` se dividen por `z`. El rectángulo nunca sale de la foto: el centro se ajusta si hace falta. El zoom se limita a `ZOOM_MIN..ZOOM_MAX`.
  - `cropRect(4000, 3000, 100, 150, DEFAULT_CROP)` → `{ sx: 1000, sy: 0, sw: 2000, sh: 3000 }`.
  - `cropRect(4000, 3000, 100, 150, { zoom: 2, centerX: 0.5, centerY: 0.5 })` → `{ sx: 1500, sy: 750, sw: 1000, sh: 1500 }`.
  - `cropRect(4000, 3000, 100, 150, { zoom: 1, centerX: 0, centerY: 0.5 })` → `{ sx: 0, sy: 0, sw: 2000, sh: 3000 }`.
- `clampCrop(imageW, imageH, photoW, photoH, crop)`: el mismo encuadre con el zoom limitado y el centro ajustado para que coincida con `cropRect`.
- `panCrop(imageW, imageH, photoW, photoH, crop, dx, dy)`: encuadre después de arrastrar. `dx` y `dy` son el desplazamiento del puntero en fracciones del ancho y el alto del área de la foto en pantalla. La foto sigue al puntero: arrastrar a la derecha mueve el centro hacia la izquierda (`centerX - dx * sw / imageW`). Devuelve el encuadre ajustado con `clampCrop`.
- `cropDpi(imageW, imageH, photoW, photoH, crop)`: resolución de impresión de la parte visible: `sw / (photoW / 25.4)`.
  - `cropDpi(4000, 3000, 100, 150, DEFAULT_CROP)` → `508` (redondeado).
- `isLowResolution(dpi)`: `dpi < LOW_DPI`.

### Hojas y acomodo — `src/sheetLayout.js` (módulo nuevo, lógica pura)

```js
// El orden de inserción es el orden del desplegable. Medidas en vertical.
export const FRAME_SHEETS = {
  a4: { id: 'a4', label: 'A4', width: 210, height: 297 },
  a3: { id: 'a3', label: 'A3', width: 297, height: 420 },
};
export const DEFAULT_FRAME_SHEET = 'a4';
export const SHEET_MARGIN_MM = 10;
export const FRAME_GAP_MM = 5;
export const CUT_MARK = { offset: 1, length: 1.2 }; // mm desde la esquina del cuadro
```

Área útil: A4 190 × 277 mm, A3 277 × 400 mm (horizontal: al revés).

Funciones:

- `frameFits({ short, long }, sheetId)`: `true` si el cuadro entra en el área útil de la hoja en alguna orientación: `short <= lado corto útil` y `long <= lado largo útil`.
  - A4: `10x15`, `13x18` y `15x20` → `true`; `20x25`, `20x30` y `a4` → `false`. A3: todas las del catálogo → `true`.
- `packFrames(frames, sheetId)`: acomoda los cuadros. `frames` es `[{ id, width, height }]` en mm, en orden. Devuelve `{ orientation, sheets }` o `null` si algún cuadro no entra. `sheets` es `[[{ id, x, y, width, height, rotated }]]`, con `x`/`y` en mm desde la esquina de la hoja (margen incluido) y `width`/`height` lo que ocupa en la hoja (girado si `rotated`).
  - Para cada orientación de hoja (vertical y horizontal), acomoda en filas: si el cuadro no entra en el área útil tal cual pero sí girado, va girado (`rotated: true`). Si no entra en el ancho que queda en la fila, empieza una fila nueva debajo de la más alta, a `FRAME_GAP_MM`. Si la fila nueva no entra en el alto, empieza una hoja nueva.
  - Devuelve la orientación con menos hojas; si empatan, `'portrait'`.
  - 2 cuadros 100 × 150 en A4 → `orientation: 'landscape'`, 1 hoja, en `x = 10` y `x = 115`, `y = 10`.
  - 4 cuadros 130 × 180 en A3 → `orientation: 'portrait'`, 1 hoja con 2 filas de 2.
  - 1 cuadro 200 × 150 en A4 → `orientation: 'portrait'` (empate), 1 hoja, `rotated: true`, ocupa 150 × 200.
  - 1 cuadro 200 × 250 en A4 → `null`.
  - `[]` → `{ orientation: 'portrait', sheets: [] }`.
- `cutMarks({ x, y, width, height })`: las 8 líneas de las marcas de corte, `[{ x1, y1, x2, y2 }]` en mm. En cada esquina, una línea horizontal y una vertical sobre la prolongación de los bordes, de `CUT_MARK.offset` a `CUT_MARK.offset + CUT_MARK.length` hacia afuera del cuadro. Con 5 mm entre cuadros, las marcas de dos vecinos no se tocan.
- `framesFileName(sheetId)`: `'cuadros.pdf'` con A4 (o clave desconocida) y `'cuadros-a3.pdf'` con A3.

### Estado — `src/frameState.js` (módulo nuevo)

```js
export const frameState = {
  images: [], // FrameImage[], en el orden de carga
  size: DEFAULT_FRAME_SIZE, // clave de FRAME_SIZES
  customSize: { short: 130, long: 180 }, // mm, se usa con size === 'custom'
  mat: DEFAULT_MAT, // clave de MATS
  matColor: DEFAULT_MAT_COLOR, // '#rrggbb'
  sheet: DEFAULT_FRAME_SHEET, // clave de FRAME_SHEETS
};

// FrameImage
{
  id: 'frame-1',
  name: 'foto.jpg',
  url: 'blob:…',
  bitmap: ImageBitmap,
  width: 4000, // px
  height: 3000, // px
  orientation: 'landscape', // del cuadro: 'portrait' | 'landscape', inicial con frameOrientation()
  crop: { zoom: 1, centerX: 0.5, centerY: 0.5 },
}
```

Mutaciones:

- `addFrameFiles(files)`: igual que `addFiles` del comic (tipos `ACCEPTED_TYPES`, límite `MAX_IMAGES`, importados de `src/state.js`, y los mismos motivos de rechazo `type` / `limit` / `decode`). Cada foto nueva lleva `orientation` de `frameOrientation()` y `crop` igual a `DEFAULT_CROP`.
- `removeFrameImage(id)`: la quita y revoca su object URL.
- `setFrameSize(sizeId)`: ignora claves desconocidas. Al elegir `'custom'`, `customSize` toma la medida que estaba elegida.
- `setCustomFrameSize(aMm, bMm)`: guarda `normalizeCustomSize(aMm, bMm)` en `customSize`. Si da `null`, no cambia nada y devuelve `false`; si no, devuelve `true`.
- `setMat(matId)` y `setMatColor(color)`.
- `setFrameSheet(sheetId)`: ignora claves desconocidas y también `'a4'` si la medida vigente no entra en A4.
- `toggleFrameOrientation(id)`: cambia `portrait` ↔ `landscape`.
- `setFrameCrop(id, crop)` y `resetFrameCrop(id)` (vuelve a `DEFAULT_CROP`).
- Después de `setFrameSize` y `setCustomFrameSize`, si `frameFits(medida, sheet)` da `false`, `sheet` pasa a `'a3'`.

### Módulos con DOM

- `src/frameRender.js`: `renderFrame(image, frame, canvas)`. `frame` es `{ width, height, mat, matColor }` en mm, con `mat` ya resuelto con `effectiveMat`. Toma la escala del ancho del canvas, pinta todo el cuadro con `matColor` y dibuja en el área de la foto el rectángulo `cropRect` de la foto.
- `src/framePdf.js`: `exportFramesPdf(images, options)`, con `options = { size, mat, matColor, sheet }` ya resueltos. Arma los cuadros con `frameDimensions`, los acomoda con `packFrames` y crea un `jsPDF` con la hoja y la orientación elegidas. Cada cuadro se dibuja con `renderFrame` en un canvas a 300 DPI (`round(mm / 25.4 * 300)` px); si `rotated`, se dibuja girado 90° en un canvas con los lados cambiados. Se agrega como JPEG 0.92 en `x`, `y`. Las marcas de corte se trazan con `doc.line`, 0.2 mm, gris `#999999`. Cede el hilo entre cuadros. Descarga con `framesFileName(sheet)`.
- `src/frameUi.js`: `initFramesUI()`, DOM y eventos de la vista `#frames-view`. Después de cada cambio de estado, `refresh()` vuelve a armar las tarjetas y el texto de hojas. El arrastre (`pointerdown` / `pointermove` / `pointerup` con `setPointerCapture`) y el zoom redibujan solo el canvas de esa tarjeta y su aviso de resolución, una vez por frame.
- `src/colorPicker.js`: `createColorPicker()` se mueve acá desde `src/ui.js`, sin cambios, y se exporta. La usan el comic y los cuadros.
- `src/messages.js`: `showMessages()`, `showErrors()` y `names()` se mueven acá desde `src/ui.js`, sin cambios, y se exportan.

Convenciones:

- La vista es `<div id="frames-view" data-view="cuadros" hidden>`, con su propia regla `#frames-view[hidden] { display: none; }`.
- `initFramesUI()` se llama una sola vez al arrancar, igual que `initUI()`.
- Los canvas de la vista previa llevan `touch-action: none` para que el arrastre con el dedo no desplace la página.
- El texto de la medida de cada tarjeta usa cm con coma decimal: "21 × 29,7 cm, vertical".

## Plan de implementación

1. Crear `src/frameSizes.js` y `tests/frameSizes.test.js`: `frameOrientation`, `resolveFrameSize` (catálogo, `custom` y clave desconocida), `frameDimensions`, `normalizeCustomSize` (válida, al revés, fuera de rango, corto > 270, `NaN`), `effectiveMat` (normal, achicado, clave desconocida), `photoArea` y que `DEFAULT_FRAME_SIZE` y `DEFAULT_MAT` existen en sus catálogos. Prueba: `npm test` pasa.
2. Crear `src/crop.js` y `tests/crop.test.js`: `cropRect` con los ejemplos de esta spec, con foto más alta que el área y con zoom fuera de rango; `clampCrop`; `panCrop` (sigue al puntero y no sale de la foto); `cropDpi` e `isLowResolution`. Prueba: `npm test` pasa.
3. Crear `src/sheetLayout.js` y `tests/sheetLayout.test.js`: `frameFits` con todo el catálogo en A4 y A3; `packFrames` con los ejemplos de esta spec, con 3 cuadros 100 × 150 en A4 (2 hojas apaisadas), con cambio de fila y de hoja y con lista vacía; `cutMarks` (8 líneas, fuera del cuadro, sin tocar las de un vecino a 5 mm); `framesFileName`. Prueba: `npm test` pasa.
4. Mover `createColorPicker` a `src/colorPicker.js` y `showMessages` / `showErrors` / `names` a `src/messages.js`, e importarlas desde `src/ui.js`. Prueba: `npm test` y `npm run build` pasan y el comic funciona igual (color global y por página, mensajes de rechazo).
5. Crear `src/frameState.js` con `frameState` y sus mutaciones. Prueba: `npm run build` pasa.
6. En `index.html`, agregar `<div id="frames-view" data-view="cuadros" hidden>` con el panel lateral (zona de carga, mensajes, desplegable "Medida" con los campos de medida personalizada ocultos, desplegable "Paspartú" con el lugar del selector de color, desplegable "Hoja" con su aviso y contador de fotos) y el panel de vista previa (encabezado con el texto de hojas y "Descargar PDF", texto de vacío y contenedor de tarjetas). Crear `src/frameRender.js` y `src/frameUi.js` con la carga, los controles y las tarjetas con el cuadro dibujado, la medida en texto, "Quitar" y el texto de hojas; el botón "Descargar PDF" queda deshabilitado en este paso. En `src/tools.js`, poner `cuadros.available = true`, y actualizar `tests/tools.test.js` (`resolveRoute('#/cuadros')` → `{ view: 'cuadros', hash: '#/cuadros' }` y `documentTitle('cuadros')` → `'Cuadros · PictureFactory'`; `#/stickers` sigue yendo al menú). En `src/main.js`, llamar a `initFramesUI()` después de `initUI()`. Agregar los estilos de la vista en `src/style.css`. Prueba manual: desde el menú se entra a Cuadros, se cargan fotos y cada una aparece como cuadro con la medida, el paspartú y la hoja elegidos.
7. En `src/frameUi.js`, agregar a cada tarjeta el arrastre, el control "Zoom", "Girar", "Centrar" y el aviso de baja resolución. Prueba manual: arrastrar y hacer zoom cambian solo esa tarjeta sin salirse de la foto; "Centrar" vuelve al recorte automático; "Girar" cambia la orientación y el texto de la medida.
8. Crear `src/framePdf.js` y conectar "Descargar PDF" en `src/frameUi.js`: deshabilitado sin fotos y mientras se genera, junto con el desplegable "Hoja". Prueba manual: los criterios de PDF de esta spec.
9. Actualizar `CLAUDE.md`: la herramienta de cuadros disponible, la vista `#frames-view` y el hash `#/cuadros`, los módulos nuevos (`frameSizes.js`, `crop.js`, `sheetLayout.js`, `frameState.js`, `frameRender.js`, `framePdf.js`, `frameUi.js`, `colorPicker.js`, `messages.js`) y los tests nuevos.

## Criterios de aceptación

- [x] `npm test` pasa, incluidos `tests/frameSizes.test.js`, `tests/crop.test.js`, `tests/sheetLayout.test.js` y los cambios de `tests/tools.test.js`.
- [x] `npm run build` termina sin errores.
- [x] En el menú, la tarjeta "Creá imágenes para cuadros" ya no dice "Próximamente", se puede enfocar con Tab y lleva a `#/cuadros`.
- [x] En `#/cuadros`, la pestaña dice "Cuadros · PictureFactory" y se ve el enlace "← Inicio". Abrir la app directo en `#/cuadros` muestra la herramienta.
- [x] `#/stickers` sigue mandando al menú.
- [x] Sin fotos, se ve "Cargá fotos para ver los cuadros." y "Descargar PDF" está deshabilitado.
- [x] Cargar un archivo que no es JPG/PNG/WebP o pasar de 40 fotos muestra los mismos mensajes que en el comic.
- [x] El desplegable "Medida" tiene, en este orden: 10 × 15 cm, 13 × 18 cm, 15 × 20 cm, 20 × 25 cm, 20 × 30 cm, A4 (21 × 29,7 cm) y Personalizada, con 13 × 18 cm elegido al abrir.
- [x] Con una foto apaisada y una vertical cargadas, la primera sale "13 × 18 cm, horizontal" y la segunda "13 × 18 cm, vertical". Una foto cuadrada sale vertical.
- [x] "Girar" en una tarjeta cambia su orientación y no cambia las demás.
- [x] Al elegir "Personalizada", aparecen "Ancho (cm)" y "Alto (cm)" con 13 y 18. Con 25 × 18 todos los cuadros pasan a esa medida. Con 30 × 30 o 4 × 10 aparece el aviso de rango y los cuadros no cambian.
- [x] El desplegable "Paspartú" tiene Ninguno, Fino (1 cm), Medio (2 cm) y Ancho (4 cm), con Ninguno elegido al abrir y el selector de color deshabilitado.
- [x] Con paspartú Medio y color Negro, todos los cuadros muestran un borde negro de 2 cm dentro de la medida y la foto se achica.
- [x] Con medida personalizada 5 × 5 cm y paspartú Ancho, la foto sigue ocupando 2 cm de lado.
- [x] Arrastrar la foto de una tarjeta la mueve dentro del cuadro, sin dejar nunca un hueco sin foto. Funciona con mouse y con el dedo en un celular, sin desplazar la página.
- [x] El zoom va de 100 % a 300 %. "Centrar" vuelve a 100 % con la foto centrada.
- [x] Una foto de 800 × 600 px en un cuadro 20 × 30 cm muestra "Baja resolución: puede verse pixelada". Una de 4000 × 3000 px en 13 × 18 cm no lo muestra. Hacer zoom sobre una foto puede hacer aparecer el aviso.
- [x] "Quitar" saca la foto y actualiza el texto de hojas.
- [x] El desplegable "Hoja" tiene A4 y A3, con A4 elegido al abrir. Con 20 × 25 cm, A4 está deshabilitado, la hoja pasa a A3 y se ve "Esta medida necesita hoja A3.".
- [x] Con 2 fotos verticales en 10 × 15 cm y hoja A4, el texto dice "Se va a generar 1 hoja A4" y el PDF tiene 1 hoja A4 apaisada con los dos cuadros uno al lado del otro.
- [x] Con 4 fotos verticales en 13 × 18 cm y hoja A3, el PDF tiene 1 hoja A3 vertical con 2 filas de 2 cuadros.
- [x] Impreso al 100 %, un cuadro de 13 × 18 cm mide 13 × 18 cm entre sus marcas de corte.
- [x] Cada cuadro del PDF tiene marcas de corte en sus cuatro esquinas, por fuera del cuadro, sin tocar las de sus vecinos.
- [x] Cada cuadro del PDF se ve igual que en su tarjeta: encuadre, zoom, orientación y paspartú.
- [x] Con hoja A4 el archivo se llama `cuadros.pdf` y con A3, `cuadros-a3.pdf`.
- [x] Mientras se genera el PDF, "Descargar PDF" y "Hoja" están deshabilitados.
- [x] Con fotos cargadas, un encuadre cambiado y paspartú elegido, ir al menú y volver a Cuadros los muestra igual.
- [x] Las fotos cargadas en Cuadros no aparecen en el comic, ni al revés.
- [x] El comic funciona igual que antes de esta spec, incluidos los selectores de color y los mensajes de rechazo.

## Decisiones

- **Sí:** esta spec cubre una foto por cuadro, y el collage va en una spec posterior. Elegido por la persona.
- **No:** foto sola y collage juntos. Suma plantillas, varias fotos por cuadro y otra UI: el plan queda demasiado largo para revisar.
- **Sí:** PDF a tamaño real con marcas de corte. Sirve para imprimir en casa o llevar a una imprenta, y reusa jsPDF. Elegido por la persona.
- **No:** exportar JPG/PNG. Puede ir en otra spec.
- **Sí:** reencuadre arrastrando, con zoom de 100 % a 300 % y "Centrar". Elegido por la persona.
- **No:** solo recorte centrado automático, ni encajar la foto sin recortar.
- **Sí:** varias fotos con la misma medida y el mismo paspartú. Elegido por la persona.
- **No:** medida o paspartú por foto. Suma controles por tarjeta; puede ir en otra spec.
- **Sí:** catálogo de medidas + medida personalizada. Elegido por la persona.
- **Sí:** el catálogo llega hasta A4 y la medida personalizada hasta 27 × 40 cm, para que todo entre en una A3 con margen. Elegido por la persona.
- **No:** 30 × 40 ni hojas del tamaño del cuadro. 30 × 40 no entra en una A3 ni sin margen, y mezclar tamaños de hoja complica imprimir.
- **Sí:** 13 × 18 cm como medida por defecto. Es una medida de marco común y entran dos por A4.
- **Sí:** orientación automática según la foto, con "Girar" por cuadro. Recorta lo menos posible sin sacar el control. Elegido por la persona.
- **Sí:** paspartú opcional con cuatro grosores fijos y color con la paleta del comic. Elegido por la persona.
- **Sí:** el paspartú va dentro de la medida. El cuadro impreso entra en el marco comprado. Elegido por la persona.
- **Sí:** el paspartú se achica solo si no deja 2 cm de foto. Evita cuadros sin foto con medidas personalizadas chicas.
- **Sí:** varios cuadros por hoja, en filas y en el orden de carga, con 10 mm de margen y 5 mm entre cuadros. Es predecible. Elegido por la persona.
- **No:** reordenar o girar cuadros para ahorrar papel. Es menos predecible.
- **Sí:** la orientación de la hoja se elige sola, una para todo el PDF, la que da menos hojas. Con hoja vertical fija entraba un solo 10 × 15 por A4. Elegido por la persona.
- **Sí:** un cuadro que no entra derecho se pone girado 90° en la hoja. Así 15 × 20 horizontal entra en A4, y recortado queda igual. Elegido por la persona.
- **Sí:** si la medida no entra en A4, A4 se deshabilita y la hoja pasa a A3. No hay forma de pedir un PDF imposible.
- **No:** volver solo a A4 al elegir una medida chica. Cambiaría una elección de la persona sin avisar.
- **Sí:** las marcas de corte arrancan a 1 mm de la esquina y miden 1,2 mm. Con 5 mm entre cuadros, las de dos vecinos no se tocan.
- **Sí:** 300 DPI y JPEG 0.92 en el PDF. Un cuadro se mira de cerca y colgado: necesita más calidad que una página del comic. Elegido por la persona.
- **Sí:** aviso de baja resolución por debajo de 150 DPI, sin bloquear la descarga. Elegido por la persona.
- **Sí:** vista previa de un cuadro por foto, sin vista de hojas; las hojas se resumen en "Se van a generar N hojas". Elegido por la persona.
- **No:** vista previa de las hojas del PDF. Puede ir en otra spec.
- **Sí:** el orden es el de carga, sin subir ni bajar. Solo cambia cómo se llenan las hojas. Elegido por la persona.
- **Sí:** fotos y estado propios de la herramienta (`frameState`), separados del comic. La SPEC 07 dejó compartir fotos fuera de alcance. Elegido por la persona.
- **Sí:** `addFrameFiles` repite la carga del comic e importa `ACCEPTED_TYPES` y `MAX_IMAGES` de `src/state.js`. Son pocas líneas y así no se toca la carga del comic.
- **Sí:** mover `createColorPicker` y los mensajes de rechazo a módulos propios. Los usan dos herramientas y se mueven sin cambios.
- **Sí:** medidas, encuadre y acomodo en módulos puros (`frameSizes.js`, `crop.js`, `sheetLayout.js`) probados con Vitest, igual que el resto de la lógica.
- **No:** persistencia. Va con la spec de persistencia.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| La impresora escala el PDF ("ajustar a la página") y el cuadro no mide lo que tiene que medir | Hay un criterio de aceptación que mide un cuadro impreso al 100 %. El margen de 10 mm deja lugar para los márgenes no imprimibles de la mayoría de las impresoras. |
| Canvas de 300 DPI grandes (un A4 son 2480 × 3508 px) hacen lenta la exportación o se quedan sin memoria | Se reusa un solo canvas, se dibuja un cuadro por vez y se cede el hilo entre cuadros, igual que el PDF del comic. |
| El arrastre con el dedo desplaza la página en lugar de la foto | `touch-action: none` en los canvas y `setPointerCapture` en el arrastre. |
| Redibujar todas las tarjetas en cada `pointermove` traba la vista previa | El arrastre y el zoom redibujan solo el canvas de esa tarjeta, una vez por frame. |
| Mover `createColorPicker` y los mensajes rompe el comic | El paso 4 los mueve sin cambios y se prueba el comic antes de seguir. |
| La vista previa y el PDF encuadran distinto | Los dos usan `renderFrame` y `cropRect`, y el encuadre se guarda en fracciones de la foto, no en px de pantalla. |

## Qué **no** incluye esta spec

- Collage de varias fotos en un cuadro.
- La herramienta de stickers.
- Medida, paspartú o color distintos por cuadro.
- Cambiar el orden de las fotos.
- Optimizar el acomodo en la hoja.
- Medidas mayores que una A3 u hojas del tamaño del cuadro.
- Vista previa de las hojas del PDF.
- Exportar como JPG o PNG.
- Filtros, ajustes de color, texto o bordes decorativos.
- Compartir fotos con el comic.
- Persistencia entre sesiones.

Cada una de estas, si llega, va en su propia spec.
