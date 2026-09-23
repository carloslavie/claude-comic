# SPEC 03 — Plantilla elegida a mano por página

> **Estado:** Aprobado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-09-23
> **Objetivo:** Permitir elegir desde un desplegable en cada página de la vista previa la plantilla (disposición y cantidad de fotos), y que las páginas sin elección sigan usando el maquetado automático.

## Por qué existe esta spec

Hoy `buildPages` elige la plantilla de cada página solo por la orientación de las imágenes. La persona no puede decidir cuántas fotos van en una página ni cómo se acomodan. SPEC 01 dejó "elegir plantilla por página a mano" fuera de alcance. Esta spec lo agrega sin tocar el catálogo de plantillas ni el render.

La elección cambia cuántas imágenes consume una página. Por eso las páginas siguientes se reacomodan solas. La decisión central es que la elección queda atada al número de página, igual que el color propio de SPEC 02.

## Alcance

**Dentro:**

- Un desplegable (`<select>`) debajo de cada canvas de páginas de viñetas en la vista previa, junto al pie y al control de color.
- Opciones del desplegable: "Automático" y las 6 plantillas del catálogo actual, ordenadas por cantidad de viñetas.
- Cada plantilla se muestra con su cantidad y un nombre legible, por ejemplo `3 · Una ancha arriba y dos abajo`.
- La opción "Automático" muestra entre paréntesis la plantilla que eligió la app, por ejemplo `Automático (3 · Una ancha arriba y dos abajo)`.
- Por defecto todas las páginas están en "Automático" y se maquetan con la regla de SPEC 01.
- Elegir una plantilla fija esa plantilla para la página. Elegir "Automático" quita la elección.
- La elección queda atada al número de página. Las páginas siguientes se reacomodan con las imágenes restantes. Sus propias elecciones se conservan.
- Las páginas en "Automático" que vienen después de una página elegida a mano aplican la regla de SPEC 01 a las imágenes que quedan.
- Las plantillas que necesitan más imágenes de las que quedan a partir de esa página aparecen deshabilitadas en el desplegable.
- Si una elección guardada deja de entrar (quedan menos imágenes que viñetas), la página usa "Automático". La elección se conserva. Si vuelven a alcanzar las imágenes, se aplica de nuevo.
- Mientras una elección no entra, el desplegable la muestra seleccionada y deshabilitada, con un aviso al lado: "No hay fotos suficientes: se usa Automático".
- Si una página deja de existir (por ejemplo, al quitar imágenes), su elección se descarta.
- La portada no tiene desplegable. Sigue siendo el título sobre la primera imagen.
- El PDF exportado usa las mismas plantillas que la vista previa.

**Fuera (para specs futuras):**

- Plantillas nuevas o editar las existentes (tamaños de viñeta, medianil).
- Elegir qué imagen va en cada viñeta o moverlas entre viñetas.
- Ajustar el recorte de una imagen dentro de su viñeta.
- Plantilla elegible para la portada.
- Atar la elección a las imágenes en lugar del número de página.
- Un botón para volver todas las páginas a "Automático" de una vez.
- Persistencia de las elecciones entre sesiones (va con la spec de persistencia).

## Modelo de datos

```js
// src/state.js — se agrega un campo al estado existente
const state = {
  title: '',
  images: [],
  pageColor: '#ffffff',
  pageColorOverrides: {},
  pageTemplateOverrides: {}, // { [pageIndex: number]: templateId }, índice 0-based
};
```

```js
// src/templates.js — cada plantilla suma un nombre legible
'3-top-wide': {
  id: '3-top-wide',
  label: 'Una ancha arriba y dos abajo',
  panels: [/* sin cambios */],
},
```

Nombres de las plantillas:

| id            | label                                        |
| ------------- | -------------------------------------------- |
| `1-full`      | Una sola viñeta                              |
| `2-rows`      | Dos apiladas                                 |
| `2-cols`      | Dos lado a lado                              |
| `3-top-wide`  | Una ancha arriba y dos abajo                 |
| `3-left-tall` | Una alta a la izquierda y dos a la derecha   |
| `4-grid`      | Grilla 2 × 2                                 |

```js
// Página resultante de src/layout.js — se agregan dos campos
{
  kind: 'panels',             // 'cover' | 'panels'
  templateId: '4-grid',       // plantilla que se dibuja
  imageIds: ['img-1', /* … */],
  layoutMode: 'manual',       // 'auto' | 'manual' | 'fallback'; 'auto' en la portada
  available: 6,               // imágenes que quedan desde esta página, incluida; 1 en la portada
}
```

- `auto`: la página no tiene elección y usa la regla de SPEC 01.
- `manual`: la página usa la plantilla elegida.
- `fallback`: la página tiene elección, pero no entra y usa la regla de SPEC 01.

Firmas en `src/layout.js`:

- `buildPages(images, title, templateOverrides = {})`: el tercer parámetro es opcional. Sin él, el resultado es el mismo que hoy (con los campos nuevos).
- `prunePageTemplateOverrides(overrides, pageCount)`: devuelve una copia sin las claves `>= pageCount`. No muta la entrada.

Nuevas mutaciones en `src/state.js`:

- `setPageTemplateOverride(index, templateId)`: fija la plantilla de una página.
- `clearPageTemplateOverride(index)`: vuelve la página a "Automático".
- `prunePageTemplates(pageCount)`: reemplaza `pageTemplateOverrides` por el resultado de `prunePageTemplateOverrides`.

Convenciones:

- El índice de página es 0-based y cuenta la portada, igual que `pageColorOverrides`. En la UI se muestra 1-based.
- Una elección en el índice de la portada se ignora al maquetar. Un `templateId` que no existe en `TEMPLATES` también se ignora (la página queda en `auto`).
- Una elección entra si la cantidad de viñetas de la plantilla es menor o igual a `available`.

## Plan de implementación

1. Agregar `label` a cada plantilla de `src/templates.js` con los nombres de la tabla. Prueba: `npm test` pasa y la app se ve igual.
2. Agregar a `buildPages` en `src/layout.js` los campos `layoutMode` y `available` en cada página, sin cambiar el maquetado. Actualizar los `toEqual` de `tests/layout.test.js` que comparan páginas completas para incluir los campos nuevos. Prueba: `npm test` pasa.
3. Agregar el parámetro `templateOverrides` a `buildPages`: si la página tiene una elección válida que entra, usa esa plantilla y consume sus imágenes; si no entra, marca `fallback` y aplica la regla de SPEC 01. Agregar `prunePageTemplateOverrides`. Agregar tests: elección respetada, reacomodo de las páginas siguientes, elección conservada en una página posterior, `fallback` cuando faltan imágenes, elección ignorada en la portada, id inexistente ignorado y poda que no muta la entrada. Prueba: `npm test` pasa.
4. Agregar a `src/state.js` el campo `pageTemplateOverrides` y las mutaciones `setPageTemplateOverride`, `clearPageTemplateOverride` y `prunePageTemplates`. En `src/ui.js`, pasar `state.pageTemplateOverrides` a `buildPages` en `renderPreview` y al exportar el PDF. En `renderPreview`, llamar a `prunePageTemplates(pages.length)` después de `buildPages`. La app sigue igual porque nadie fija elecciones todavía.
5. En `renderPreview`, agregar debajo de cada canvas de páginas `panels` un `<select>` con `aria-label` "Plantilla de la página N". Opciones: "Automático (…)" y las 6 plantillas como `N · label`, deshabilitadas si su cantidad de viñetas supera `available`. En `manual` y `fallback` queda seleccionada la elección guardada; en `auto`, "Automático". En `fallback` se muestra el aviso "No hay fotos suficientes: se usa Automático". Al evento `change` se llama a `setPageTemplateOverride` o `clearPageTemplateOverride` y a `refresh()`. Agregar los estilos en `src/style.css`. Prueba manual: con 7 imágenes horizontales, elegir `4-grid` en la página 1 deja 2 páginas: `4-grid` y `3-top-wide`.
6. Actualizar `CLAUDE.md`: el nuevo campo y mutaciones de `state.js`, el `label` de `templates.js`, la nueva firma de `buildPages`, los campos nuevos de la página, `prunePageTemplateOverrides` y el desplegable en `ui.js`.

## Criterios de aceptación

- [ ] `npm test` pasa, incluidos los tests nuevos de `tests/layout.test.js`.
- [ ] `npm run build` termina sin errores.
- [ ] Sin tocar ningún desplegable, la vista previa y el PDF tienen las mismas páginas y plantillas que antes de esta spec.
- [ ] Cada página de viñetas tiene un desplegable debajo del canvas. La portada no tiene.
- [ ] El desplegable ofrece "Automático" y las 6 plantillas, en orden de 1 a 4 viñetas, con el formato `N · nombre`.
- [ ] En una página sin elección, la opción seleccionada es "Automático (N · nombre)" con la plantilla que se ve en el canvas.
- [ ] Con 7 imágenes horizontales y sin título, elegir `4 · Grilla 2 × 2` en la página 1 deja 2 páginas: `4-grid` con las imágenes 1 a 4 y `3-top-wide` con las 5 a 7.
- [ ] Con 7 imágenes, página 1 en `2 · Dos apiladas` y página 3 en `1 · Una sola viñeta`, cambiar la página 1 a `4 · Grilla 2 × 2` deja la página 3 en `1 · Una sola viñeta` si todavía existe.
- [ ] En una página donde quedan 2 imágenes, las opciones de 3 y 4 viñetas están deshabilitadas.
- [ ] Si la página 2 tiene `4 · Grilla 2 × 2` y se quitan imágenes hasta que le quedan 3, la página 2 se dibuja en automático, el desplegable muestra `4 · Grilla 2 × 2` deshabilitada y aparece el aviso "No hay fotos suficientes: se usa Automático".
- [ ] En ese mismo caso, al volver a cargar imágenes hasta que alcancen, la página 2 vuelve a `4-grid` y el aviso desaparece.
- [ ] Elegir "Automático" en una página con elección la devuelve a la regla de SPEC 01.
- [ ] Si la página 3 tiene elección y se quitan imágenes hasta que hay 2 páginas, al volver a tener 3 páginas la página 3 está en "Automático".
- [ ] El color propio de una página (SPEC 02) se mantiene al cambiar su plantilla.
- [ ] El PDF descargado tiene las mismas plantillas y el mismo orden de imágenes que la vista previa.

## Decisiones

- **Sí:** un solo desplegable con "Automático" y las 6 plantillas. La plantilla ya define la cantidad de fotos.
- **No:** dos desplegables (cantidad y disposición). Suma un control para llegar al mismo resultado.
- **No (en esta spec):** plantillas nuevas. Amplía el catálogo y el render; va en otra spec si hace falta.
- **Sí:** la elección queda atada al número de página. Es coherente con el color propio de SPEC 02 y predecible.
- **No:** resetear las páginas siguientes al cambiar una. Hace perder trabajo.
- **No:** atar la elección a la primera imagen de la página. Confunde cuando el maquetado reagrupa.
- **Sí:** deshabilitar las plantillas que no entran y caer a "Automático" si una elección guardada deja de entrar, conservándola. No se pierde trabajo al quitar una foto por un rato.
- **No:** viñetas vacías cuando faltan imágenes. Deja páginas incompletas en el PDF.
- **No:** bajar solo a la plantilla más grande que entre. Es menos predecible que volver a la regla automática.
- **Sí:** aviso visible cuando una elección no entra. Si no, la persona ve una plantilla distinta a la elegida sin saber por qué.
- **Sí:** descartar las elecciones de páginas que dejan de existir, igual que los colores de SPEC 02.
- **Sí:** la portada queda fija. Elegirle plantilla obliga a definir dónde va el título en cada una.
- **Sí:** la opción "Automático" muestra la plantilla que eligió la app. Así se ve qué hay antes de cambiarlo.
- **Sí:** `buildPages` sigue siendo pura y recibe las elecciones como parámetro. El maquetado manual se prueba con Vitest.
- **Sí:** `prunePageTemplateOverrides` nuevo en `src/layout.js`, en lugar de generalizar `prunePageColorOverrides`. No toca el código de SPEC 02.
- **Sí:** el cambio del desplegable reconstruye toda la vista previa. El `<select>` ya se cerró cuando llega `change`, y el cambio afecta a las páginas siguientes.
- **No:** persistencia de las elecciones. Va con la spec de persistencia.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| Agregar o quitar el título corre todos los índices en uno: las elecciones y colores quedan en otra página | Se acepta, igual que en SPEC 02. La elección de un índice que pasa a ser portada se ignora. |
| Una elección en una página cambia todas las siguientes y sorprende | Las páginas siguientes en "Automático" muestran qué plantilla se eligió. Sus elecciones propias se conservan. |
| Los tests existentes con `toEqual` fallan por los campos nuevos | El paso 2 los actualiza sin cambiar el maquetado esperado. |
| Las elecciones quedan desfasadas si cambia el número de páginas | `prunePageTemplates(pages.length)` se llama en cada `renderPreview`. |

## Qué **no** incluye esta spec

- Plantillas nuevas o editables.
- Elegir o mover imágenes entre viñetas.
- Ajuste del recorte.
- Plantilla para la portada.
- Elecciones atadas a imágenes.
- Botón para volver todo a "Automático".
- Persistencia de las elecciones entre sesiones.

Cada una de estas, si llega, va en su propia spec.
