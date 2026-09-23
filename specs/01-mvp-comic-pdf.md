# SPEC 01 — MVP: carga de imágenes, maquetado automático y exportación a PDF

> **Estado:** Aprobado
> **Depende de:** —
> **Fecha:** 2026-09-23
> **Objetivo:** Una webapp que se ejecuta entera en el navegador, recibe hasta 40 imágenes, las acomoda solas en páginas A4 con estilo de historieta y descarga el resultado como PDF.

## Por qué existe esta spec

Es la primera funcionalidad del proyecto. También define el stack (Vite + JS sin framework) y la estructura base del repo. Las specs siguientes (globos de diálogo, persistencia) se apoyan en ella.

## Alcance

**Dentro:**

- Proyecto Vite con JavaScript sin framework y Vitest para tests unitarios.
- Carga de imágenes con input de archivos (selección múltiple) y arrastrando archivos a una zona de drop.
- Formatos aceptados: JPG, PNG y WebP. Máximo 40 imágenes en total.
- Lista de miniaturas con botones para subir, bajar y quitar cada imagen.
- Campo de texto para el título del comic.
- Maquetado automático con un catálogo fijo de plantillas de 1 a 4 viñetas por página. La plantilla se elige según la orientación de las imágenes.
- Cada imagen llena su viñeta con recorte centrado (cover).
- Estilo comic: borde negro en cada viñeta y medianil blanco entre viñetas.
- Portada opcional: si el título no está vacío, la primera página muestra el título sobre la primera imagen.
- Vista previa de todas las páginas, que se regenera sola ante cualquier cambio (carga, orden, quitar, título).
- Botón "Descargar PDF" que genera un PDF A4 vertical en el navegador con jsPDF.
- Mensajes de error para archivos rechazados y para el límite de 40.

**Fuera (para specs futuras):**

- Globos de diálogo y texto sobre las viñetas (SPEC propia).
- Persistencia entre sesiones, por ejemplo en IndexedDB (SPEC propia).
- Editor de viñetas: mover imágenes entre viñetas, elegir plantilla por página a mano, ajustar el recorte.
- Reordenar arrastrando las miniaturas.
- Otros tamaños de página (Carta, comic US) o selector de formato.
- Backend, cuentas de usuario o subida a un servidor.
- Tests automáticos de UI o del PDF.

## Modelo de datos

```js
// src/state.js — estado en memoria de la app
const state = {
  title: '',        // string, título del comic; vacío = sin portada
  images: [],       // ComicImage[], en el orden elegido por el usuario
};

// ComicImage
{
  id: 'img-1',               // string único generado al cargar
  name: 'foto.jpg',          // nombre original del archivo
  url: 'blob:...',           // object URL; se revoca al quitar la imagen
  bitmap: ImageBitmap,       // decodificado una sola vez al cargar
  width: 4000,               // px originales
  height: 3000,
  orientation: 'landscape',  // 'landscape' | 'portrait' | 'square'
}

// src/templates.js — plantilla de página
{
  id: '3-top-wide',
  panels: [                  // fracciones 0..1 del área útil de la página
    { x: 0, y: 0, w: 1, h: 0.5 },
    // ...
  ],
}

// Página resultante de src/layout.js
{
  kind: 'cover',             // 'cover' | 'panels'
  templateId: null,          // null en la portada
  imageIds: ['img-1'],       // uno por viñeta, en orden de panels
}
```

Convenciones:

- Orientación: `landscape` si ancho/alto > 1.2, `portrait` si ancho/alto < 0.83, `square` en el resto.
- Página A4 vertical: 210 × 297 mm. Margen exterior de 10 mm. Medianil de 4 mm entre viñetas. Borde de viñeta negro de 0.8 mm.
- Render en canvas a 150 DPI: 1240 × 1754 px por página.
- Coordenadas con origen arriba a la izquierda.

Catálogo de plantillas (`src/templates.js`):

| id            | Viñetas | Disposición                                  |
| ------------- | ------- | -------------------------------------------- |
| `1-full`      | 1       | Una viñeta que ocupa todo el área útil       |
| `2-rows`      | 2       | Dos viñetas apiladas, cada una a lo ancho    |
| `2-cols`      | 2       | Dos viñetas lado a lado, cada una a lo alto  |
| `3-top-wide`  | 3       | Una ancha arriba (50 %) y dos abajo          |
| `3-left-tall` | 3       | Una alta a la izquierda (50 %) y dos a la derecha |
| `4-grid`      | 4       | Grilla 2 × 2                                 |

Regla de maquetado (`buildPages(images, title)`), recorriendo las imágenes en orden:

1. Si `title` no está vacío y hay al menos una imagen, la primera página es `cover` con la primera imagen. Esa imagen también aparece luego en las páginas de viñetas.
2. Si quedan 4 o más imágenes y las 4 siguientes son `portrait`, se usa `4-grid` con esas 4.
3. Si no, si quedan 3 o más: se usa `3-top-wide` si la siguiente es `landscape`. En otro caso se usa `3-left-tall`. Consume 3 imágenes.
4. Si quedan 2: se usa `2-rows` si la primera de las dos es `landscape`. En otro caso se usa `2-cols`.
5. Si queda 1: se usa `1-full`.
6. Con 0 imágenes, `buildPages` devuelve `[]`.

## Plan de implementación

Requisito previo: el directorio debe ser un repositorio git (`git init`) para que `/spec-impl` pueda crear la rama.

1. Crear el proyecto Vite sin framework: `package.json` con scripts `dev`, `build`, `preview` y `test`, `index.html`, `src/main.js`, `src/style.css` y `.gitignore`. Instalar `vite`, `vitest` y `jspdf`. Prueba manual: `npm run dev` abre una página con el título "Web Comic".
2. Crear `src/templates.js` con el catálogo de las seis plantillas y `src/orientation.js` con `getOrientation(width, height)`. Agregar `tests/orientation.test.js`. Prueba: `npm test` pasa.
3. Crear `src/layout.js` con `buildPages(images, title)` según la regla del modelo de datos. Es una función pura: no toca DOM ni canvas. Agregar `tests/layout.test.js` con casos de 0, 1, 2, 3, 4 y 7 imágenes, con y sin título, y con distintas orientaciones. Prueba: `npm test` pasa.
4. Crear `src/state.js` con el estado y las funciones `addFiles(files)`, `moveImage(id, delta)`, `removeImage(id)` y `setTitle(text)`. `addFiles` valida el tipo, respeta el límite de 40, decodifica con `createImageBitmap` y devuelve la lista de archivos rechazados con su motivo. `removeImage` revoca el object URL.
5. Armar la UI de carga en `index.html` y `src/ui.js`: input múltiple, zona de drop, campo de título, lista de miniaturas con botones ↑, ↓ y ✕, y zona de mensajes. Prueba manual: cargar, reordenar y quitar imágenes actualiza la lista.
6. Crear `src/render.js` con `renderPage(page, imagesById, canvas)`. Dibuja fondo blanco, viñetas con recorte cover y borde negro, y la portada con el título centrado en blanco con contorno negro sobre la imagen. Prueba manual: una página de prueba se ve bien en un canvas.
7. Conectar la vista previa en `src/ui.js`: ante cada cambio de estado se llama a `buildPages` y se dibuja cada página en un canvas escalado dentro del área de vista previa. Prueba manual: cambiar orden o título regenera las páginas.
8. Crear `src/pdf.js` con `exportPdf(pages, imagesById, title)`. Dibuja cada página con `renderPage` en un canvas de 1240 × 1754 px, la agrega a jsPDF como JPEG de calidad 0.85 en A4 vertical y descarga el archivo. El nombre es el título en kebab-case más `.pdf`, o `comic.pdf` si no hay título. Conectar el botón "Descargar PDF": queda deshabilitado sin imágenes y muestra "Generando…" mientras exporta.
9. Actualizar `CLAUDE.md` con el stack, los comandos (`npm run dev`, `npm test`, `npm run build`) y la estructura de `src/`.

## Criterios de aceptación

- [ ] `npm run dev` levanta la app sin errores en la consola del navegador.
- [ ] `npm test` pasa todos los tests de `tests/orientation.test.js` y `tests/layout.test.js`.
- [ ] `npm run build` termina sin errores.
- [ ] Se pueden cargar imágenes con el input de archivos y también arrastrándolas a la zona de drop.
- [ ] Un archivo que no es JPG, PNG ni WebP se rechaza y aparece un mensaje con su nombre.
- [ ] Al intentar pasar de 40 imágenes se aceptan solo las primeras hasta completar 40 y aparece un mensaje con la cantidad rechazada.
- [ ] Los botones ↑ y ↓ cambian el orden de la imagen y la vista previa se regenera.
- [ ] El botón ✕ quita la imagen de la lista y de la vista previa.
- [ ] Con 7 imágenes horizontales y sin título se generan 3 páginas: `3-top-wide`, `3-top-wide` y `1-full`.
- [ ] Con 4 imágenes verticales se genera 1 página `4-grid`.
- [ ] Con título no vacío la primera página es la portada con el título sobre la primera imagen.
- [ ] Con el título vacío no hay portada.
- [ ] Cada viñeta está llena, sin franjas vacías, y la imagen conserva su proporción (se recorta, no se deforma).
- [ ] Cada viñeta tiene borde negro y hay medianil blanco entre viñetas.
- [ ] El botón "Descargar PDF" está deshabilitado cuando no hay imágenes.
- [ ] El PDF descargado tiene tamaño A4 vertical y la misma cantidad y el mismo orden de páginas que la vista previa.
- [ ] El PDF se llama `<titulo-en-kebab-case>.pdf`, o `comic.pdf` si no hay título.
- [ ] Exportar 40 imágenes termina sin que se cuelgue la pestaña.
- [ ] No se hace ninguna petición de red con las imágenes (se verifica en la pestaña Network de DevTools).

## Decisiones

- **Sí:** Vite + JavaScript sin framework. Es un MVP chico y no necesita estado reactivo complejo.
- **No:** React + TypeScript. Suma setup que el MVP no necesita. Se puede reconsiderar si llega el editor.
- **No:** HTML sin build. Complica los tests y el manejo de dependencias.
- **Sí:** todo en el navegador, sin backend. Deploy estático y las imágenes nunca salen de la máquina.
- **No:** PDF generado en servidor. Pide hosting y almacenamiento sin necesidad.
- **Sí:** catálogo fijo de plantillas elegidas por orientación. Es predecible y se puede testear.
- **No:** grilla fija de N viñetas. Se ve poco como una historieta.
- **No:** mosaico dinámico libre. Es demasiado complejo para un MVP.
- **Sí:** recorte centrado (cover). Da un look comic limpio, sin franjas vacías.
- **No:** encajar sin recortar (contain). Deja huecos en las viñetas.
- **Sí:** el mismo render en canvas para la vista previa y el PDF. Garantiza que lo que se ve sea lo que se exporta.
- **No:** DOM/CSS + html2canvas. Es más frágil y puede diferir del PDF.
- **Sí:** A4 vertical fijo. Se imprime en cualquier impresora.
- **Sí:** límite de 40 imágenes y solo JPG/PNG/WebP. Evita que el navegador se quede sin memoria.
- **Sí:** reordenar con botones ↑ y ↓. Es lo más simple y accesible. El arrastre queda fuera.
- **Sí:** portada con el título sobre la primera imagen, solo si hay título.
- **Sí:** la imagen de la portada también aparece en las páginas de viñetas. Así ninguna foto queda solo como fondo.
- **Sí:** Vitest solo para la lógica pura (orientación y maquetado). La UI y el PDF se verifican a mano.
- **No (en esta spec):** globos de diálogo y persistencia. Cada una es un dominio grande y va en su propia spec.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| Fotos muy grandes (por ejemplo 40 de 12 MP) agotan la memoria | Límite de 40. El PDF se arma con páginas JPEG a 150 DPI y no con las imágenes originales. |
| El PDF pesa demasiado | JPEG de calidad 0.85 por página. Con 150 DPI cada página queda en cientos de KB. |
| La exportación bloquea la UI unos segundos | El botón muestra "Generando…" y queda deshabilitado. Se cede el hilo entre páginas con `await`. |
| Una imagen corrupta falla al decodificar | `createImageBitmap` en `try/catch`. La imagen se rechaza con un mensaje y no rompe la carga del resto. |
| Una imagen con rotación EXIF sale girada | `createImageBitmap` con `imageOrientation: 'from-image'`. |

## Qué **no** incluye esta spec

- Globos de diálogo y texto sobre las viñetas.
- Persistencia entre sesiones.
- Editor manual de viñetas, plantillas o recorte.
- Reordenar arrastrando.
- Tamaños de página distintos de A4 vertical.
- Backend, cuentas o subida a servidor.
- Tests automáticos de UI o del PDF.

Cada una de estas, si llega, va en su propia spec.
