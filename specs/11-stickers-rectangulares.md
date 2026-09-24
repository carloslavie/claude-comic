# SPEC 11 — Stickers: formas rectangulares horizontales y verticales

> **Estado:** Implementado
> **Depende de:** SPEC 10
> **Fecha:** 2026-09-24
> **Objetivo:** Sumar al desplegable "Forma" de los stickers cuatro rectángulos de proporción 3:2 (horizontal y vertical, con esquinas rectas o redondeadas), donde el tamaño elegido es el lado largo.

## Por qué existe esta spec

La SPEC 10 dejó los stickers con tres formas cuadradas (círculo, cuadrado y cuadrado redondeado) y puso "formas rectangulares" fuera de alcance. Las fotos suelen ser rectangulares: con una forma cuadrada se pierde buena parte de la imagen. Un rectángulo 3:2, la proporción de una foto de cámara, recorta poco y sirve para etiquetas.

Hasta ahora un sticker era siempre cuadrado y toda la geometría usaba un único `size`. Esta spec pasa el sticker a `width` × `height`, sin cambiar cómo se ven ni cómo se exportan las formas que ya existen.

## Alcance

**Dentro:**

- El desplegable "Forma" pasa a tener, en este orden: Círculo, Cuadrado, Cuadrado redondeado, Rectángulo horizontal, Rectángulo horizontal redondeado, Rectángulo vertical y Rectángulo vertical redondeado. Por defecto sigue siendo Círculo. La forma sigue siendo una sola para todos los stickers.
- **Proporción:** los rectángulos son 3:2 fijos. El horizontal es más ancho que alto; el vertical, más alto que ancho.
- **Tamaño:** en un rectángulo, el tamaño elegido (3, 4, 5, 7, 10 cm o personalizado) es el **lado largo**. El lado corto es dos tercios del largo, **redondeado a 1 mm**. Con 5 cm: 50 × 33 mm (horizontal) o 33 × 50 mm (vertical). El desplegable "Tamaño" y el campo "Tamaño (cm)" (2 a 19 cm) no cambian.
- **Esquinas:** los rectángulos rectos tienen esquinas en ángulo recto, como el cuadrado. Los redondeados tienen esquinas con un radio del 15 % del **lado corto**. Con 50 × 33 mm, el radio es 4,95 mm.
- **Borde:** igual que en las otras formas: va dentro del tamaño y sigue la forma; el radio de la foto es el radio exterior menos el borde.
- **Texto de la tarjeta:** los rectángulos muestran las dos medidas, ancho × alto, en cm con coma decimal: "Rectángulo horizontal de 5 × 3,3 cm", "Rectángulo vertical redondeado de 2,7 × 4 cm". Las formas cuadradas siguen como antes ("Círculo de 5 cm").
- **Vista previa:** el canvas de cada tarjeta toma la proporción del sticker: el lado largo mide lo que hoy mide el lado del canvas cuadrado y el corto se achica en proporción. El arrastre, el zoom, "Centrar" y el aviso de baja resolución funcionan igual, medidos sobre el área rectangular de la foto.
- Cambiar la forma conserva el encuadre y las copias de cada foto. El encuadre se ajusta a la nueva área sin dejar huecos (lo hace `cropRect`).
- **PDF:** cada rectángulo se dibuja a tamaño real a `exportDpi(width, height)`, como JPEG 0.92, con fondo blanco fuera de la forma. La línea de corte vectorial (0,2 mm, `#999999`) sigue el contorno: `doc.rect` para los rectos y `doc.roundedRect` para los redondeados. El acomodo, la elección de orientación de la hoja, el margen, la separación, las copias y el nombre del archivo no cambian.
- El contador y el texto "Se van a generar N hojas" cuentan los rectángulos con sus medidas reales.
- El círculo, el cuadrado y el cuadrado redondeado se ven, miden y exportan igual que antes de esta spec.

**Fuera (para specs futuras):**

- Otras proporciones (2:1, 4:3…) o ancho y alto libres.
- Girar un sticker suelto (forma u orientación por sticker).
- Óvalos, estrellas u otras formas.
- Control del radio del redondeo.
- Girar los stickers en la hoja para que entren más.
- Cambios en el comic o los cuadros.
- Persistencia entre sesiones.

## Modelo de datos

### Formas — `src/stickerSizes.js`

Cada forma dice su formato (cuadrado, horizontal o vertical) y sus esquinas. El orden de inserción sigue siendo el orden del desplegable.

```js
export const STICKER_SHAPES = {
  circle: { id: 'circle', label: 'Círculo', format: 'square', corners: 'circle' },
  square: { id: 'square', label: 'Cuadrado', format: 'square', corners: 'straight' },
  rounded: { id: 'rounded', label: 'Cuadrado redondeado', format: 'square', corners: 'rounded' },
  landscape: { id: 'landscape', label: 'Rectángulo horizontal', format: 'landscape', corners: 'straight' },
  'landscape-rounded': { id: 'landscape-rounded', label: 'Rectángulo horizontal redondeado', format: 'landscape', corners: 'rounded' },
  portrait: { id: 'portrait', label: 'Rectángulo vertical', format: 'portrait', corners: 'straight' },
  'portrait-rounded': { id: 'portrait-rounded', label: 'Rectángulo vertical redondeado', format: 'portrait', corners: 'rounded' },
};
export const DEFAULT_STICKER_SHAPE = 'circle'; // sin cambios
export const ROUNDED_RADIUS = 0.15; // fracción del lado corto
export const RECT_RATIO = 2 / 3; // lado corto / lado largo de los rectángulos
```

`STICKER_SIZES`, `CUSTOM_STICKER_LIMITS`, `STICKER_BORDERS` y `COPIES_LIMITS` no cambian.

### El sticker pasa de `size` a `width` × `height`

El objeto sticker (en mm) pasa de `{ size, shape, border, borderColor }` a:

```js
{ width: 50, height: 33, shape: 'landscape', border: 1.5, borderColor: '#ffffff' }
```

En las formas cuadradas `width === height`.

### Funciones nuevas y cambiadas

Una clave de forma desconocida sigue usando `DEFAULT_STICKER_SHAPE` en todas.

- **Nueva** `stickerDimensions(shapeId, size)` → `{ width, height }` en mm. Formato cuadrado: `size × size`. Horizontal: `size × round(size * RECT_RATIO)`. Vertical: `round(size * RECT_RATIO) × size`.
  - `stickerDimensions('circle', 50)` → `{ width: 50, height: 50 }`.
  - `stickerDimensions('landscape', 50)` → `{ width: 50, height: 33 }`.
  - `stickerDimensions('portrait-rounded', 40)` → `{ width: 27, height: 40 }`.
  - `stickerDimensions('landscape', 30)` → `{ width: 30, height: 20 }`.
  - `stickerDimensions('landscape', 100)` → `{ width: 100, height: 67 }`.
  - `stickerDimensions('xyz', 50)` → `{ width: 50, height: 50 }`.
- **Cambia** `shapeRadius(shapeId, width, height)`: radio de las esquinas en mm. `circle` → `min(width, height) / 2`; esquinas rectas → `0`; redondeadas → `min(width, height) * ROUNDED_RADIUS`.
  - `shapeRadius('circle', 50, 50)` → `25`; `shapeRadius('square', 50, 50)` → `0`; `shapeRadius('rounded', 50, 50)` → `7.5`.
  - `shapeRadius('landscape', 50, 33)` → `0`; `shapeRadius('landscape-rounded', 50, 33)` → `4.95` (con `toBeCloseTo`).
- **Cambia** `stickerFor(size, shapeId, borderId, borderColor)` → `{ width, height, shape, border, borderColor }`, con `width` y `height` de `stickerDimensions`.
  - `stickerFor(50, 'circle', 'fino', '#ffffff')` → `{ width: 50, height: 50, shape: 'circle', border: 1.5, borderColor: '#ffffff' }`.
  - `stickerFor(50, 'landscape', 'fino', '#ffffff')` → `{ width: 50, height: 33, shape: 'landscape', border: 1.5, borderColor: '#ffffff' }`.
- **Cambia** `stickerPhotoArea(sticker)` → `{ x, y, width, height, radius }` (reemplaza `side`): `x = y = border`, `width = sticker.width - 2 * border`, `height = sticker.height - 2 * border`, `radius = max(0, shapeRadius(shape, sticker.width, sticker.height) - border)`.
  - Círculo 50 con borde 1,5 → `{ x: 1.5, y: 1.5, width: 47, height: 47, radius: 23.5 }`.
  - Redondeado 50 con borde 3 → `{ x: 3, y: 3, width: 44, height: 44, radius: 4.5 }`.
  - Horizontal 50 × 33 con borde 1,5 → `{ x: 1.5, y: 1.5, width: 47, height: 30, radius: 0 }`.
  - Horizontal redondeado 50 × 33 con borde 3 → `{ x: 3, y: 3, width: 44, height: 27, radius: 1.95 }` (radio con `toBeCloseTo`).
- **Cambia** `expandCopies(images, width, height)`: cada foto repetida `copies` veces como `{ id, width, height }`, en orden.
- **Cambia** `stickerText(shapeId, size)`: formas cuadradas igual que antes; rectángulos con `ancho × alto` de `stickerDimensions`, en cm con coma decimal y sin decimal si es entero.
  - `stickerText('circle', 50)` → `'Círculo de 5 cm'`.
  - `stickerText('landscape', 50)` → `'Rectángulo horizontal de 5 × 3,3 cm'`.
  - `stickerText('portrait-rounded', 40)` → `'Rectángulo vertical redondeado de 2,7 × 4 cm'`.
  - `stickerText('landscape', 45)` → `'Rectángulo horizontal de 4,5 × 3 cm'`.

`resolveStickerSize`, `normalizeCustomStickerSize`, `normalizeCopies` y `stickersFileName` no cambian. `stickerState` no cambia: `shape` guarda la clave nueva y `size` sigue siendo el lado largo.

Con 10 mm de margen y 5 mm entre stickers, entran 25 rectángulos de 5 cm por A4 (horizontales en hoja apaisada, verticales en hoja vertical). Con el máximo de 19 cm (190 × 127 mm), el rectángulo entra derecho en A4 vertical y apaisada, así que `packFrames` nunca lo gira.

### Módulos con DOM

- `src/stickerRender.js`: `renderSticker(image, sticker, canvas, { cutLine })` toma la escala del ancho del canvas (`canvas.width / sticker.width`) y el canvas tiene la proporción del sticker. `shapePath(ctx, x, y, width, height, radius)` traza un rectángulo con esquinas de radio `radius` (acotado a `min(width, height) / 2`); con `width === height` y radio = lado / 2 sigue siendo el círculo. Dibuja el recorte de `cropRect(image.width, image.height, area.width, area.height, image.crop)`.
- `src/stickerPdf.js`: el canvas mide `width` × `height` a `exportDpi(width, height)`. `doc.addImage(…, x, y, width, height, id)`. Línea de corte: `doc.circle` para el círculo, `doc.roundedRect(x, y, width, height, r, r, 'S')` si el radio es mayor que 0 y `doc.rect(x, y, width, height, 'S')` si no.
- `src/stickerUi.js`: `createStickerCard()` arma el canvas con el lado largo en `PREVIEW_SIDE` y el corto en proporción; usa `area.width` / `area.height` para `cropDpi`, `attachCropDrag` y `createZoomControl`, y `outer = { width: sticker.width, height: sticker.height }`. El texto de hojas usa `expandCopies(images, width, height)`.
- `src/style.css`: si la tarjeta de sticker fuerza un canvas cuadrado, se ajusta para respetar la proporción del canvas.

## Plan de implementación

1. En `src/stickerSizes.js`, agregar las cuatro formas, `format` y `corners`, `RECT_RATIO` y `stickerDimensions`, y cambiar `shapeRadius`, `stickerFor`, `stickerPhotoArea`, `expandCopies` y `stickerText` como dice el modelo de datos. Actualizar `tests/stickerSizes.test.js`: los ejemplos de esta spec, el orden de las 7 formas del desplegable, y con `packFrames` + `expandCopies`: 25 rectángulos horizontales de 50 mm entran en 1 hoja A4 apaisada y 26 necesitan 2; un rectángulo horizontal y uno vertical de 190 mm entran en A4 sin girar. Los tests que ya existían para las formas cuadradas se adaptan a la firma nueva con los mismos resultados. En el mismo paso, adaptar `src/stickerRender.js`, `src/stickerPdf.js` y `src/stickerUi.js` a `width` × `height` para que la app siga funcionando. Prueba: `npm test` y `npm run build` pasan y, a mano, el círculo, el cuadrado y el cuadrado redondeado se ven y exportan igual que antes.
2. A mano, con las formas nuevas: ajustar el canvas de la tarjeta a la proporción del sticker (y `src/style.css` si hace falta). Prueba manual: los criterios de vista previa de esta spec (formas, texto, arrastre, zoom, "Centrar", aviso de resolución, contador y texto de hojas).
3. Verificar el PDF con las formas nuevas. Prueba manual: los criterios de PDF de esta spec.
4. Actualizar `CLAUDE.md`: las siete formas de los stickers, el sticker en `width` × `height`, `stickerDimensions`, `RECT_RATIO` y las firmas nuevas de `shapeRadius`, `stickerPhotoArea` y `expandCopies`.

## Criterios de aceptación

- [x] `npm test` pasa, incluidos los casos nuevos de `tests/stickerSizes.test.js`.
- [x] `npm run build` termina sin errores.
- [x] El desplegable "Forma" tiene, en este orden: Círculo, Cuadrado, Cuadrado redondeado, Rectángulo horizontal, Rectángulo horizontal redondeado, Rectángulo vertical y Rectángulo vertical redondeado, con Círculo elegido al abrir.
- [x] Con "Rectángulo horizontal" y 5 cm, la tarjeta dice "Rectángulo horizontal de 5 × 3,3 cm" y el sticker se ve más ancho que alto, con esquinas rectas.
- [x] Con "Rectángulo vertical redondeado" y 4 cm, la tarjeta dice "Rectángulo vertical redondeado de 2,7 × 4 cm" y el sticker se ve más alto que ancho, con esquinas redondeadas también en el borde y en la foto.
- [x] Con "Personalizado" en 4,5 y "Rectángulo horizontal", la tarjeta dice "Rectángulo horizontal de 4,5 × 3 cm".
- [x] Con borde Ancho y color Negro, los rectángulos muestran un borde negro de 3 mm dentro del tamaño, parejo en los cuatro lados y en las esquinas redondeadas.
- [x] En un rectángulo, arrastrar la foto la mueve dentro del sticker sin dejar huecos, con mouse y con el dedo; el zoom y "Centrar" funcionan igual que en las otras formas.
- [x] Una foto de 300 × 300 px en un rectángulo horizontal de 10 cm muestra "Baja resolución: puede verse pixelada". Una de 4000 × 3000 px en 5 cm no lo muestra.
- [x] Cambiar de Círculo a un rectángulo y volver conserva las copias y el zoom de cada foto.
- [x] Con 1 foto, "Rectángulo horizontal", 5 cm y 25 copias en A4, el texto dice "Se va a generar 1 hoja A4"; con 26 copias, "Se van a generar 2 hojas A4".
- [x] Con 1 foto con 25 copias en "Rectángulo horizontal" de 5 cm y hoja A4, el PDF tiene 1 hoja A4 apaisada con 5 filas de 5 stickers.
- [x] Con 1 foto con 25 copias en "Rectángulo vertical" de 5 cm y hoja A4, el PDF tiene 1 hoja A4 vertical con 5 filas de 5 stickers.
- [x] Cada rectángulo del PDF tiene una línea de corte gris continua justo sobre su contorno, recta o redondeada según la forma.
- [x] Impreso al 100 %, un rectángulo horizontal de 5 cm mide 50 × 33 mm sobre la línea de corte.
- [x] Cada rectángulo del PDF se ve igual que en su tarjeta: forma, borde, encuadre y zoom. Fuera de la forma, la hoja queda blanca.
- [x] Con "Personalizado" en 19 cm, un rectángulo horizontal y uno vertical se exportan en A4 sin girar y sin errores.
- [x] El círculo, el cuadrado y el cuadrado redondeado se ven, miden y exportan igual que antes de esta spec (mismo texto, mismas medidas, 15 círculos de 5 cm por A4).
- [x] El comic y los cuadros funcionan igual que antes de esta spec.

## Decisiones

- **Sí:** cuatro formas nuevas (horizontal y vertical, rectas y redondeadas). Elegido por la persona.
- **No:** una sola forma "Rectángulo" con un control de orientación o "Girar" por tarjeta. La forma es una sola para todos los stickers, igual que en la SPEC 10; con dos opciones en el desplegable no hace falta otro control.
- **Sí:** proporción 3:2 fija. Elegido por la persona. Es la de una foto de cámara: recorta poco.
- **No:** ancho y alto libres u otras proporciones. Cambia el control de tamaño y los catálogos: puede ir en otra spec.
- **Sí:** el tamaño elegido es el lado largo. Elegido por la persona. Un rectángulo de 5 cm nunca es más grande que el cuadrado de 5 cm, y el máximo de 19 cm sigue entrando en A4 sin tocar `CUSTOM_STICKER_LIMITS`.
- **Sí:** el lado corto se redondea a 1 mm. Elegido por la persona. Lo impreso coincide con el texto y con la regla.
- **Sí:** el radio de los redondeados es el 15 % del lado corto. Elegido por la persona. Las esquinas se ven como las del cuadrado redondeado de ese lado y nunca se comen el lado corto. Para las formas cuadradas da lo mismo que antes.
- **Sí:** el texto muestra ancho × alto en los rectángulos. Elegido por la persona. Queda claro qué se va a imprimir.
- **Sí:** desplegable agrupado por forma (cada rectángulo seguido de su versión redondeada). Elegido por la persona.
- **Sí:** el sticker pasa de `size` a `width` × `height` y las formas llevan `format` y `corners`. Así la geometría, el render y el PDF tratan igual las siete formas, sin casos especiales por rectángulo.
- **Sí:** `packFrames` sin cambios. Todos los rectángulos entran derechos en A4, así que nunca se giran.
- **Sí:** el refactor a `width` × `height` y las formas nuevas van en el mismo primer paso, porque cambiar las firmas rompe el render y el PDF si no se adaptan juntos.
- **No:** persistencia. Va con la spec de persistencia.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| Pasar de `size` a `width` × `height` cambia cómo se ven o exportan las formas cuadradas | Los tests existentes se conservan con los mismos resultados y hay criterios de aceptación para las tres formas cuadradas. |
| `packFrames` gira un rectángulo y el PDF lo dibuja sin girar | Test: con 190 mm ningún rectángulo sale con `rotated`. `stickerPdf.js` sigue sin girar imágenes. |
| La línea de corte vectorial y la imagen no coinciden en el lado corto | La imagen se agrega en `x`, `y`, `width`, `height` y la línea usa las mismas medidas en mm; el lado corto es un número entero de mm. |
| El CSS de la tarjeta estira el canvas rectangular a un cuadrado | El paso 2 revisa `.sticker-card canvas` y se verifica a mano que la proporción se respeta. |

## Qué **no** incluye esta spec

- Otras proporciones o ancho y alto libres.
- Forma u orientación por sticker.
- Óvalos, estrellas u otras formas.
- Control del radio del redondeo.
- Girar stickers en la hoja para aprovecharla mejor.
- Cambios en el comic o los cuadros.
- Persistencia entre sesiones.

Cada una de estas, si llega, va en su propia spec.
