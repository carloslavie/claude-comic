# SPEC 06 — Exportar el PDF en A3 con dos páginas por hoja

> **Estado:** Aprobado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-09-23
> **Objetivo:** Permitir elegir, junto al botón "Descargar PDF", un formato A3 apaisado que pone dos páginas A4 del comic lado a lado en cada hoja.

## Por qué existe esta spec

Hoy `exportPdf` en `src/pdf.js` genera siempre un PDF A4 vertical con una página del comic por hoja. Para imprimir en A3 o ver el comic de a dos páginas, la persona tiene que armar el PDF con otra herramienta.

Una hoja A3 apaisada (420 × 297 mm) mide exactamente lo mismo que dos A4 verticales (210 × 297 mm) lado a lado. Por eso cada página se sigue dibujando igual que hoy, con el mismo `renderPage` y la misma resolución. Solo cambia dónde se pone cada página dentro de la hoja.

## Alcance

**Dentro:**

- Un desplegable "Formato" en la cabecera de la vista previa, a la izquierda del botón "Descargar PDF".
- Dos opciones: "A4 (1 página por hoja)" y "A3 (2 páginas por hoja)". Por defecto: A4.
- Con A4, el PDF queda exactamente igual que hoy.
- Con A3, cada hoja es A3 apaisada y lleva dos páginas del comic seguidas: la hoja 1 lleva las páginas 1 y 2, la hoja 2 lleva la 3 y la 4, y así. La portada, si hay título, cuenta como página 1.
- Cada página ocupa su mitad de la hoja sin escalar: la izquierda de 0 a 210 mm y la derecha de 210 a 420 mm.
- Sin línea ni marca entre las dos mitades.
- Si la cantidad de páginas es impar, la mitad derecha de la última hoja se pinta con el color de fondo global (`state.pageColor`), sin viñetas ni bordes.
- Con A3, el archivo se llama `<titulo-kebab>-a3.pdf` o `comic-a3.pdf`. Con A4, el nombre no cambia.
- El desplegable se deshabilita igual que el botón: sin imágenes o mientras se genera el PDF.
- La vista previa no cambia: sigue mostrando una página A4 a la vez en cualquier formato.

**Fuera (para specs futuras):**

- Vista previa de las hojas A3 (páginas de a dos).
- Agrupar como libro abierto (portada sola a la derecha y después 2-3, 4-5…).
- Imposición para imprimir y encuadernar como cuadernillo (orden 8-1, 2-7…).
- Línea o marcas de corte.
- Otros tamaños (Carta, A5…) u otras orientaciones.
- Cambiar la resolución o la calidad JPEG del PDF.
- Persistencia del formato elegido entre sesiones (va con la spec de persistencia).

## Modelo de datos

```js
// src/state.js — se agrega un campo al estado existente
const state = {
  // …campos existentes…
  pdfFormat: DEFAULT_PDF_FORMAT, // clave de PDF_FORMATS
};
```

```js
// src/pdfFormat.js — módulo nuevo, lógica pura
export const DEFAULT_PDF_FORMAT = 'a4';

// El orden de inserción es el orden del desplegable.
export const PDF_FORMATS = {
  a4: { id: 'a4', label: 'A4 (1 página por hoja)', pagesPerSheet: 1 },
  a3: { id: 'a3', label: 'A3 (2 páginas por hoja)', pagesPerSheet: 2 },
};
```

Funciones puras nuevas en `src/pdfFormat.js`:

- `buildSheets(pageCount, format)`: devuelve la lista de hojas del PDF. Cada hoja es un array de índices de página (0-based), con `null` en la mitad vacía.
  - `buildSheets(3, 'a4')` → `[[0], [1], [2]]`.
  - `buildSheets(4, 'a3')` → `[[0, 1], [2, 3]]`.
  - `buildSheets(3, 'a3')` → `[[0, 1], [2, null]]`.
  - `buildSheets(0, format)` → `[]`.
  - Un formato desconocido se trata como `a4`.
- `pdfFileName(title, format = 'a4')`: se mueve desde `src/pdf.js` a este módulo para poder probarla sin jsPDF.
  - `pdfFileName('Mis Vacaciones 2024!', 'a4')` → `mis-vacaciones-2024.pdf`.
  - `pdfFileName('Mis Vacaciones 2024!', 'a3')` → `mis-vacaciones-2024-a3.pdf`.
  - `pdfFileName('', 'a3')` → `comic-a3.pdf`.

Nueva mutación en `src/state.js`:

- `setPdfFormat(format)`: guarda `format` en `state.pdfFormat`. Una clave que no está en `PDF_FORMATS` se ignora.

Firma que cambia:

- `exportPdf(pages, imagesById, title, backgrounds, titleStyle, format = 'a4', blankColor = DEFAULT_PAGE_COLOR)` en `src/pdf.js`. `blankColor` es el color de la mitad vacía; `ui.js` le pasa `state.pageColor`.

Convenciones:

- Cada página se sigue dibujando en el mismo canvas de 1240 × 1754 px (150 DPI) y se agrega como JPEG 0.85, igual que hoy.
- Con A3, cada página se agrega con `doc.addImage(…, x, 0, 210, 297)`, con `x = 0` para la mitad izquierda y `x = 210` para la derecha.
- La mitad vacía se pinta con `doc.setFillColor(blankColor)` y `doc.rect(210, 0, 210, 297, 'F')`.

## Plan de implementación

1. Crear `src/pdfFormat.js` con `DEFAULT_PDF_FORMAT`, `PDF_FORMATS`, `buildSheets` y `pdfFileName`. Quitar `pdfFileName` de `src/pdf.js` e importarla desde el módulo nuevo, llamándola con `'a4'`. Crear `tests/pdfFormat.test.js`:
   - `buildSheets` con 0, 1, 3 y 4 páginas en `a4` y en `a3`, y con un formato desconocido.
   - `pdfFileName` con título, sin título y con tildes, en `a4` y en `a3`.
   - `DEFAULT_PDF_FORMAT` existe en `PDF_FORMATS`.

   Prueba: `npm test` pasa y el PDF A4 sale igual que antes.
2. En `src/pdf.js`, agregar los parámetros `format` y `blankColor` a `exportPdf`. Recorrer `buildSheets(pages.length, format)`: cada hoja es una hoja nueva del PDF (`a4` vertical o `a3` apaisada), cada índice se dibuja con `renderPage` y se agrega en su mitad, y cada `null` se pinta con `blankColor`. Usar `pdfFileName(title, format)`. Prueba: `npm run build` termina sin errores y el PDF A4 sale igual que antes.
3. Agregar a `src/state.js` el campo `pdfFormat` y la mutación `setPdfFormat`. En `index.html`, agregar un `<select id="pdf-format">` con su `<label>` "Formato" dentro de `.preview-header`, a la izquierda de `#pdf-button`. Agrupar el desplegable y el botón en un contenedor para que queden juntos a la derecha. En `src/ui.js`, llenar el desplegable desde `PDF_FORMATS`. Al cambiarlo, llamar a `setPdfFormat` (no hace falta `refresh()`: la vista previa no cambia). Al exportar, pasar `state.pdfFormat` y `state.pageColor` a `exportPdf`. En `refresh()`, deshabilitar el desplegable con la misma condición que el botón. Agregar los estilos en `src/style.css`. Prueba manual: con A3 se descarga `comic-a3.pdf` con dos páginas por hoja.
4. Actualizar `CLAUDE.md`: el módulo `src/pdfFormat.js`, el campo y la mutación de `state.js`, la firma nueva de `exportPdf`, el desplegable de formato en `ui.js` y los tests de `pdfFormat.js`.

## Criterios de aceptación

- [ ] `npm test` pasa, incluidos los tests nuevos de `tests/pdfFormat.test.js`.
- [ ] `npm run build` termina sin errores.
- [ ] A la izquierda de "Descargar PDF" hay un desplegable "Formato" con, en este orden: "A4 (1 página por hoja)" y "A3 (2 páginas por hoja)".
- [ ] Al abrir la app, el formato elegido es A4.
- [ ] Sin imágenes, el desplegable y el botón están deshabilitados. Mientras se genera el PDF, también.
- [ ] Con A4, el PDF descargado tiene las mismas hojas, el mismo tamaño y el mismo nombre que antes de esta spec.
- [ ] Con A3 y 4 páginas, el PDF tiene 2 hojas A3 apaisadas (420 × 297 mm): la primera con las páginas 1 y 2, la segunda con la 3 y la 4.
- [ ] Con A3 y título, la portada queda en la mitad izquierda de la primera hoja.
- [ ] Con A3 y 3 páginas, la mitad derecha de la segunda hoja está pintada con el color de fondo global, sin viñetas ni bordes.
- [ ] Con A3 y 1 sola página, el PDF tiene 1 hoja A3 con la página a la izquierda y la mitad derecha con el color de fondo global.
- [ ] Con A3, cada página se ve igual que en la vista previa: plantilla, color de fondo propio, título y proporción, sin estirarse.
- [ ] Con A3, no hay ninguna línea ni marca entre las dos mitades.
- [ ] Con A3 y el título "Mis Vacaciones", el archivo se llama `mis-vacaciones-a3.pdf`. Sin título, `comic-a3.pdf`.
- [ ] Cambiar el formato no modifica la vista previa.

## Decisiones

- **Sí:** el desplegable va junto al botón "Descargar PDF". Solo afecta a la exportación, así que queda junto a la acción que la usa. Elegido por la persona.
- **No:** ponerlo en la barra lateral, después de las imágenes o debajo del color de fondo. Queda lejos del botón que lo usa.
- **Sí:** A3 apaisado con dos A4 verticales sin escalar. Mide justo el doble de un A4, así que las páginas se reusan tal cual y se ven igual que en la vista previa.
- **Sí:** pares seguidos (1-2, 3-4…). Es simple y sirve para imprimir y recortar. Elegido por la persona.
- **No:** agrupar como libro abierto con la portada sola. Cambia según haya título o no; va en otra spec si hace falta.
- **No:** imposición para cuadernillo. Es otro problema (orden de impresión y doblado).
- **Sí:** la mitad vacía se pinta con el color de fondo global. Elegido por la persona.
- **No:** mitad en blanco fijo, ni dejar la última hoja en A4. Mezclar tamaños de hoja complica la impresión.
- **Sí:** sin línea de corte. Los márgenes de 10 mm de cada página ya dejan 20 mm libres en el centro. Elegido por la persona.
- **Sí:** sufijo `-a3` en el nombre del archivo. No pisa la versión A4 en Descargas. Elegido por la persona.
- **Sí:** la vista previa no cambia. A3 solo afecta al PDF y no hay que tocar la vista previa. Elegido por la persona.
- **Sí:** dos `addImage` por hoja en lugar de un canvas A3 combinado. Mantiene el mismo canvas, la misma resolución y el mismo peso por página que hoy.
- **Sí:** `buildSheets` y `pdfFileName` en `src/pdfFormat.js`, un módulo puro. Se prueban con Vitest sin cargar jsPDF.
- **Sí:** `pdfFormat` en `state` y no una variable local de `ui.js`. Sigue el patrón del resto de las opciones y queda listo para la spec de persistencia.
- **No:** persistencia del formato. Va con la spec de persistencia.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| El visor o la impresora rotan la hoja A3 apaisada y las páginas quedan de costado | El PDF declara la hoja como apaisada (`a3`, `landscape`). Al imprimir, la persona elige la orientación en el diálogo de la impresora. |
| Media página de diferencia en `x` deja una franja o un solapamiento entre las mitades | Las dos mitades usan exactamente 210 mm de ancho y `x = 0` / `x = 210`, sobre una hoja de 420 mm. |
| Se rompe el nombre del archivo A4 al mover `pdfFileName` | Los tests nuevos cubren el nombre A4 con y sin título. |

## Qué **no** incluye esta spec

- Vista previa de las hojas A3.
- Agrupar como libro abierto.
- Imposición para cuadernillo.
- Línea o marcas de corte.
- Otros tamaños u orientaciones de hoja.
- Cambios de resolución o calidad del PDF.
- Persistencia del formato entre sesiones.

Cada una de estas, si llega, va en su propia spec.
