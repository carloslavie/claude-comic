# CLAUDE.md

Este archivo orienta a Claude Code (claude.ai/code) cuando trabaja con el código de este repositorio.

## Idioma

Responder siempre al usuario en español en este proyecto.

## Proyecto

**Web Comic**: una aplicación web para cargar imágenes y acomodarlas automáticamente como páginas de un libro de historietas.

Corre entera en el navegador: las imágenes nunca salen de la máquina y no hay backend.

## Stack y comandos

Vite + JavaScript sin framework (ES modules). Vitest para los tests unitarios. jsPDF para generar el PDF. No hay configuración de lint.

- `npm run dev`: servidor de desarrollo.
- `npm test`: ejecuta los tests una vez (`vitest run`). Para un solo archivo: `npx vitest run tests/layout.test.js`.
- `npm run build`: build de producción en `dist/`. `npm run preview` lo sirve.

Los tests cubren solo la lógica pura (`orientation.js`, `layout.js` y `colors.js`). La UI, el render en canvas y el PDF se verifican a mano (ver los criterios de aceptación de `specs/01-mvp-comic-pdf.md`).

## Arquitectura

Flujo de datos: `state.images` → `buildPages()` → `renderPage()` por página, en un canvas. El color de fondo de cada página se resuelve con `resolvePageColor()` y se le pasa a `renderPage()`. La vista previa y el PDF usan el mismo render, así que lo que se ve es lo que se exporta.

- `src/main.js`: punto de entrada; carga los estilos y llama a `initUI()`.
- `src/state.js`: estado en memoria (`title`, `images`, `pageColor`, `pageColorOverrides`) y sus mutaciones (`addFiles`, `moveImage`, `removeImage`, `setTitle`, `setPageColor`, `setPageColorOverride`, `clearPageColorOverride`, `prunePageColors`). `addFiles` valida el tipo (JPG/PNG/WebP), aplica el límite de 40 y decodifica cada archivo a `ImageBitmap` una sola vez. `pageColorOverrides` guarda el color propio de cada página por índice (0-based).
- `src/orientation.js`: `getOrientation(w, h)` → `landscape` (>1.2), `portrait` (<0.83) o `square`.
- `src/colors.js`: `DEFAULT_PAGE_COLOR` (`#ffffff`), `PALETTE` (8 colores), `resolvePageColor(index, pageColor, overrides)` (color propio de la página o el global) y `prunePageColorOverrides(overrides, pageCount)` (descarta los índices de páginas que ya no existen).
- `src/templates.js`: catálogo fijo de 6 plantillas (`1-full`, `2-rows`, `2-cols`, `3-top-wide`, `3-left-tall`, `4-grid`). Las viñetas están en fracciones 0..1 del área útil, sin medianil.
- `src/layout.js`: `buildPages(images, title)`, función pura que elige plantilla según la orientación. Con título, la primera página es la portada.
- `src/render.js`: `renderPage(page, imagesById, canvas, title, background)`. Toma la escala del ancho del canvas. Pinta el fondo (margen y medianil) con `background`. Aplica margen (10 mm), medianil (4 mm), borde (0.8 mm), recorte cover y el título de la portada.
- `src/ui.js`: DOM y eventos. Después de cada cambio de estado, `refresh()` redibuja las miniaturas y agenda la vista previa (una vez por frame). `createColorPicker()` arma el selector de color (paleta + `<input type="color">`), que se usa para el color global y para el de cada página. Cambiar el color de una página redibuja solo su canvas, sin reconstruir la vista previa, para no cerrar el selector nativo.
- `src/pdf.js`: `exportPdf(pages, imagesById, title, backgrounds)` dibuja cada página con su color de fondo a 1240 × 1754 px (150 DPI), la agrega como JPEG 0.85 en A4 vertical y descarga `<titulo-kebab>.pdf` o `comic.pdf`.
- `tests/`: tests de Vitest.

## Flujo de trabajo: desarrollo guiado por specs

El repo usa un flujo guiado por specs con dos skills del proyecto. Vienen de `Klerith/fernando-skills` y sus versiones están fijadas en `skills-lock.json`. `.claude/skills/*` son enlaces simbólicos a `.agents/skills/*`.

- `/spec <descripción de la funcionalidad en una oración>`: diseña una spec mediante preguntas aclaratorias y la guarda como `specs/NN-slug.md` con estado `Borrador`. No escribe código. La primera vez también crea `specs/.spec-config.yml` (`AutoCreateBranch: true`).
- `/spec-impl <NN-slug>`: implementa una spec solo si su estado significa "Aprobado". Solo la persona cambia el estado a Aprobado. La skill crea la rama `spec-NN-slug` o se cambia a ella. Implementa el plan paso a paso y se detiene después de cada paso para revisar el diff. Nunca hace commit por su cuenta.

Convenciones que aplican estas skills:

- Las specs siguen `.agents/skills/spec/template.md`. Empiezan con un encabezado (Estado / Depende de / Fecha / Objetivo en una oración). Después vienen Alcance (Dentro / Fuera), Modelo de datos, Plan de implementación, Criterios de aceptación y Decisiones. Riesgos es opcional. Cierran con una sección "Qué no incluye".
- Las specs se numeran en orden y con dos dígitos (`01-`, `02-`, …). Una spec nueva usa el mismo idioma y los mismos nombres de estado que las existentes. Estados en español: `Borrador`, `En revisión`, `Aprobado`, `Implementado`, `Obsoleto`.
- Durante la implementación, seguir la spec al pie de la letra. Ante pedidos fuera de alcance o ambigüedades, consultar al usuario en lugar de improvisar.
