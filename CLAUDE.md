# CLAUDE.md

Este archivo orienta a Claude Code (claude.ai/code) cuando trabaja con el código de este repositorio.

## Idioma

Responder siempre al usuario en español en este proyecto.

## Proyecto

**PictureFactory**: una aplicación web con varias herramientas para trabajar con fotos. Abre en un menú inicial desde el que se elige la herramienta. Por ahora la única disponible es el creador de comics, que carga imágenes y las acomoda automáticamente como páginas de un libro de historietas. "Crear imágenes para cuadros" y "Crear plantillas para stickers" aparecen en el menú como "Próximamente".

Corre entera en el navegador: las imágenes nunca salen de la máquina y no hay backend.

## Stack y comandos

Vite + JavaScript sin framework (ES modules). Vitest para los tests unitarios. jsPDF para generar el PDF. Las fuentes del título (Bangers, Luckiest Guy, Permanent Marker, Anton, Kosugi Maru, M PLUS Rounded 1c y Dela Gothic One) vienen de `@fontsource` y se empaquetan con la app, sin pedidos externos. No hay configuración de lint.

- `npm run dev`: servidor de desarrollo.
- `npm test`: ejecuta los tests una vez (`vitest run`). Para un solo archivo: `npx vitest run tests/layout.test.js`.
- `npm run build`: build de producción en `dist/`. `npm run preview` lo sirve.

Los tests cubren solo la lógica pura (`orientation.js`, `layout.js`, `colors.js`, `titleStyle.js`, `pdfFormat.js` y `tools.js`). La UI, el menú, el render en canvas y el PDF se verifican a mano (ver los criterios de aceptación de `specs/01-mvp-comic-pdf.md`).

## Arquitectura

Navegación: `index.html` tiene una vista por pantalla, cada una con `data-view="<view>"`: el menú (`<section data-view="home">`) y el comic (`<div id="comic-view" data-view="comic">`). Las vistas se muestran y se ocultan con el atributo `hidden` y nunca se destruyen. La ruta sale del hash: `#/` o sin hash es el menú y `#/comic` es el comic. Cualquier otro hash, incluidos los reservados `#/cuadros` y `#/stickers` de las herramientas no disponibles, se reemplaza por `#/` con `history.replaceState`. `initUI()` se llama una sola vez al arrancar, aunque se entre por el menú, así que el trabajo del comic se conserva en memoria entre vistas. Una regla CSS con `display` en una vista le gana a `hidden`, así que necesita su propia regla `[hidden] { display: none; }` (como `#comic-view[hidden]`).

Flujo de datos del comic: `state.images` (+ `state.pageTemplateOverrides`) → `buildPages()` → `renderPage()` por página, en un canvas. El color de fondo de cada página se resuelve con `resolvePageColor()` y se le pasa a `renderPage()`, junto con `state.titleStyle`. La vista previa y el PDF usan el mismo render, así que lo que se ve es lo que se exporta.

- `src/main.js`: punto de entrada; carga las fuentes de `@fontsource` y los estilos, y llama a `initUI()` y después a `initHome()`.
- `src/tools.js`: herramientas del menú y reglas de navegación, lógica pura. `APP_NAME` (`PictureFactory`) y `TOOLS` (`comic`, `cuadros`, `stickers`, cada una con `title`, `description`, `tabTitle` y `available`; el orden de inserción es el orden de las tarjetas). `toolHash(id)` → `#/<id>`. `resolveRoute(hash)` → `{ view, hash }`: `view` es `home` o el id de una herramienta disponible y `hash` es el que tiene que quedar en la URL. `documentTitle(view)` → `PictureFactory` o `<tabTitle> · PictureFactory`. Habilitar una herramienta es poner `available: true` y agregar su vista.
- `src/home.js`: `initHome()` arma las tarjetas del menú en `#tool-list` desde `TOOLS`, con íconos SVG en línea definidos por id de herramienta. La tarjeta disponible es `<a class="tool-card">`. Las no disponibles son `<div class="tool-card is-soon" aria-disabled="true">`, sin `href` ni `tabindex`, con la etiqueta "Próximamente". Aplica la ruta al arrancar y en cada `hashchange`: corrige el hash, muestra la vista, muestra el enlace "← Inicio" (`#home-link`) solo fuera del menú y pone `document.title`.
- `src/state.js`: estado en memoria (`title`, `images`, `pageColor`, `pageColorOverrides`, `pageTemplateOverrides`, `titleStyle`, `pdfFormat`) y sus mutaciones (`addFiles`, `moveImage`, `removeImage`, `setTitle`, `setPageColor`, `setPageColorOverride`, `clearPageColorOverride`, `prunePageColors`, `setPageTemplateOverride`, `clearPageTemplateOverride`, `prunePageTemplates`, `setTitleStyle`, `resetTitleStyle`, `setPdfFormat`). `addFiles` valida el tipo (JPG/PNG/WebP), aplica el límite de 40 y decodifica cada archivo a `ImageBitmap` una sola vez. `pageColorOverrides` guarda el color propio de cada página y `pageTemplateOverrides` la plantilla elegida a mano, ambos por índice de página (0-based, la portada cuenta). `titleStyle` es uno solo para el comic: `setTitleStyle(partial)` cambia solo las opciones que recibe. `setPdfFormat(format)` ignora las claves que no están en `PDF_FORMATS`.
- `src/orientation.js`: `getOrientation(w, h)` → `landscape` (>1.2), `portrait` (<0.83) o `square`.
- `src/colors.js`: `DEFAULT_PAGE_COLOR` (`#ffffff`), `PALETTE` (8 colores), `resolvePageColor(index, pageColor, overrides)` (color propio de la página o el global) y `prunePageColorOverrides(overrides, pageCount)` (descarta los índices de páginas que ya no existen).
- `src/titleStyle.js`: estilo del título de la portada. `DEFAULT_TITLE_STYLE` (`size`, `font`, `position`, `color`, `outlineColor`, `outline`) y los catálogos `TITLE_SIZES` (tamaño máximo en mm: 14 / 22 / 32), `TITLE_FONTS` (pila de fuentes CSS), `TITLE_POSITIONS` y `TITLE_OUTLINES` (grosor como fracción del tamaño de letra). El orden de inserción es el orden del desplegable. `titleBlockTop(position, rectY, rectH, blockH)` es la `y` superior del bloque de texto (arriba y abajo dejan 5 % del alto).
- `src/templates.js`: catálogo fijo de 8 plantillas (`1-full`, `2-rows`, `2-cols`, `3-top-wide`, `3-bottom-wide`, `3-left-tall`, `3-right-tall`, `4-grid`), cada una con un `label` legible para el desplegable. Las viñetas están en fracciones 0..1 del área útil, sin medianil. El orden de `panels` define qué imagen va en cada viñeta (`imageIds[i]` en `panels[i]`). El orden de inserción define el orden dentro de cada grupo del desplegable. `3-bottom-wide` y `3-right-tall` solo se eligen a mano: la regla automática no las usa.
- `src/layout.js`: `buildPages(images, title, templateOverrides = {})`, función pura. Cada página usa la plantilla elegida si entra en las imágenes que quedan; si no, la regla automática según la orientación. Con título, la primera página es la portada (ignora cualquier elección). Cada página trae `layoutMode` (`auto`, `manual` o `fallback` si la elección no entra) y `available` (imágenes que quedan desde ella, incluida). `prunePageTemplateOverrides(overrides, pageCount)` descarta los índices de páginas que ya no existen.
- `src/render.js`: `renderPage(page, imagesById, canvas, title, background, titleStyle = DEFAULT_TITLE_STYLE)`. Toma la escala del ancho del canvas. Pinta el fondo (margen y medianil) con `background`. Aplica margen (10 mm), medianil (4 mm), borde (0.8 mm), recorte cover y el título de la portada. El título usa el tamaño máximo del estilo y se achica hasta 6 mm si no entra; una clave desconocida en `titleStyle` usa el valor por defecto.
- `src/ui.js`: DOM y eventos del comic, dentro de `#comic-view`. Después de cada cambio de estado, `refresh()` redibuja las miniaturas y agenda la vista previa (una vez por frame). `createColorPicker()` arma el selector de color (paleta + `<input type="color">`), que se usa para el color global y para el de cada página. Cambiar el color de una página redibuja solo su canvas, sin reconstruir la vista previa, para no cerrar el selector nativo. `createTemplateControl()` arma el desplegable de plantilla de cada página de viñetas ("Automático" + las 8 plantillas, ordenadas por cantidad de viñetas, deshabilitadas si no entran) y el aviso de `fallback`; cambiarlo llama a `refresh()` y reconstruye toda la vista previa, porque reacomoda las páginas siguientes. El `<fieldset id="title-style">` tiene los controles del estilo del título (`renderTitleStyleControls()`: Tamaño, Fuente, Posición, dos selectores de color y Grosor del contorno) y el botón "Restablecer estilo", que los vuelve a armar. El fieldset se deshabilita sin título. `loadTitleFont()` carga la fuente del título con `document.fonts.load`, porque el canvas no espera a las fuentes: se llama al escribir el título, al cambiar de fuente, al restablecer y antes de exportar. El desplegable `#pdf-format`, junto a "Descargar PDF", se arma desde `PDF_FORMATS` y se deshabilita igual que el botón. Cambiarlo solo llama a `setPdfFormat`: la vista previa sigue en A4.
- `src/pdfFormat.js`: formato de hoja del PDF, lógica pura. `DEFAULT_PDF_FORMAT` (`a4`) y `PDF_FORMATS` (`a4`: 1 página por hoja; `a3`: 2 páginas por hoja). `buildSheets(pageCount, format)` reparte las páginas en hojas seguidas (`[[0, 1], [2, null]]` con A3 y 3 páginas); un formato desconocido se trata como A4. `pdfFileName(title, format)` arma `<titulo-kebab>.pdf` o `comic.pdf`, con sufijo `-a3` en A3.
- `src/pdf.js`: `exportPdf(pages, imagesById, title, backgrounds, titleStyle, format = 'a4', blankColor)` dibuja cada página con su color de fondo y la portada con el estilo del título a 1240 × 1754 px (150 DPI) y la agrega como JPEG 0.85 de 210 × 297 mm. Con A4, una página por hoja vertical. Con A3, hojas apaisadas con la página izquierda en `x = 0` y la derecha en `x = 210`; la mitad vacía de la última hoja se pinta con `blankColor` (el color de fondo global). Descarga el archivo con `pdfFileName`.
- `tests/`: tests de Vitest.

## Flujo de trabajo: desarrollo guiado por specs

El repo usa un flujo guiado por specs con dos skills del proyecto. Vienen de `Klerith/fernando-skills` y sus versiones están fijadas en `skills-lock.json`. `.claude/skills/*` son enlaces simbólicos a `.agents/skills/*`.

- `/spec <descripción de la funcionalidad en una oración>`: diseña una spec mediante preguntas aclaratorias y la guarda como `specs/NN-slug.md` con estado `Borrador`. No escribe código. La primera vez también crea `specs/.spec-config.yml` (`AutoCreateBranch: true`).
- `/spec-impl <NN-slug>`: implementa una spec solo si su estado significa "Aprobado". Solo la persona cambia el estado a Aprobado. La skill crea la rama `spec-NN-slug` o se cambia a ella. Implementa el plan paso a paso y se detiene después de cada paso para revisar el diff. Nunca hace commit por su cuenta.

Convenciones que aplican estas skills:

- Las specs siguen `.agents/skills/spec/template.md`. Empiezan con un encabezado (Estado / Depende de / Fecha / Objetivo en una oración). Después vienen Alcance (Dentro / Fuera), Modelo de datos, Plan de implementación, Criterios de aceptación y Decisiones. Riesgos es opcional. Cierran con una sección "Qué no incluye".
- Las specs se numeran en orden y con dos dígitos (`01-`, `02-`, …). Una spec nueva usa el mismo idioma y los mismos nombres de estado que las existentes. Estados en español: `Borrador`, `En revisión`, `Aprobado`, `Implementado`, `Obsoleto`.
- Durante la implementación, seguir la spec al pie de la letra. Ante pedidos fuera de alcance o ambigüedades, consultar al usuario en lugar de improvisar.
