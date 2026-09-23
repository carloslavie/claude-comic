# SPEC 02 — Color de fondo de las páginas: global y por página

> **Estado:** Aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-09-23
> **Objetivo:** Permitir elegir el color de fondo de las páginas del comic (margen y medianil), con un color global para todas y un color propio opcional por página desde la vista previa.

## Por qué existe esta spec

Hoy `render.js` pinta siempre el fondo de página de blanco (`#fff`). Esta spec agrega la primera personalización visual del comic. El color es parte del render compartido, así que la vista previa y el PDF siguen siendo iguales.

## Alcance

**Dentro:**

- Color de fondo de página: el color que se ve en el margen exterior y en el medianil entre viñetas.
- Un color global que se aplica a todas las páginas. Por defecto es blanco (`#ffffff`).
- Un color propio opcional por página (override) que pisa al global solo en esa página.
- Cambiar el color global no modifica las páginas que tienen color propio.
- Botón "Usar global" por página, que quita su color propio.
- Selector con una paleta de 8 colores predefinidos más un `<input type="color">` nativo para elegir cualquier color. Lo usan tanto el control global como el de cada página.
- Control global en el panel izquierdo, debajo del campo de título.
- Control por página debajo de cada canvas de la vista previa, junto al pie (`3 · 4-grid`).
- La portada se colorea igual que cualquier otra página: es la página 1.
- El color propio queda atado al número de página. Si esa página deja de existir (por ejemplo, al quitar imágenes), su color propio se descarta.
- El PDF exportado usa los mismos colores que la vista previa.

**Fuera (para specs futuras):**

- Color del borde de las viñetas (sigue negro `#000`).
- Color o estilo del título de la portada (sigue blanco con contorno negro).
- Grosor del borde, tamaño del medianil o del margen.
- Degradados, texturas o imágenes de fondo.
- Persistencia de los colores entre sesiones (va con la spec de persistencia).
- Temas o combinaciones de colores guardadas.
- Atar el color a las imágenes en lugar del número de página.

## Modelo de datos

```js
// src/state.js — se agregan dos campos al estado existente
const state = {
  title: '',
  images: [],
  pageColor: '#ffffff',     // string '#rrggbb', color global de fondo
  pageColorOverrides: {},   // { [pageIndex: number]: '#rrggbb' }, índice 0-based
};
```

```js
// src/colors.js — módulo nuevo, lógica pura
export const DEFAULT_PAGE_COLOR = '#ffffff';

export const PALETTE = [
  { name: 'Blanco',  value: '#ffffff' },
  { name: 'Negro',   value: '#111111' },
  { name: 'Amarillo', value: '#ffd23f' },
  { name: 'Rojo',    value: '#e63946' },
  { name: 'Azul',    value: '#1d70b8' },
  { name: 'Verde',   value: '#2a9d8f' },
  { name: 'Naranja', value: '#f4a261' },
  { name: 'Crema',   value: '#f5ecd7' },
];

// resolvePageColor(index, pageColor, overrides) → '#rrggbb'
//   Devuelve overrides[index] si existe; si no, pageColor.
// prunePageColorOverrides(overrides, pageCount) → nuevo objeto
//   Devuelve una copia sin las claves >= pageCount. No muta la entrada.
```

Convenciones:

- Todos los colores se guardan como `#rrggbb` en minúsculas. Es el formato que devuelve `<input type="color">`.
- El índice de página es 0-based. La portada, si existe, es el índice 0. En la UI se muestra 1-based, como hoy.
- `renderPage` recibe el color ya resuelto. No conoce el estado ni los overrides.

Nuevas mutaciones en `src/state.js`:

- `setPageColor(color)`: cambia el color global.
- `setPageColorOverride(index, color)`: fija el color propio de una página.
- `clearPageColorOverride(index)`: quita el color propio de una página.
- `prunePageColors(pageCount)`: reemplaza `pageColorOverrides` por el resultado de `prunePageColorOverrides`.

## Plan de implementación

1. Crear `src/colors.js` con `DEFAULT_PAGE_COLOR`, `PALETTE`, `resolvePageColor` y `prunePageColorOverrides`. Agregar `tests/colors.test.js`: resolución sin override, con override, índice inexistente, poda que conserva los índices válidos y que no muta la entrada. Prueba: `npm test` pasa.
2. Agregar a `src/state.js` los campos `pageColor` y `pageColorOverrides` y las mutaciones `setPageColor`, `setPageColorOverride`, `clearPageColorOverride` y `prunePageColors`. La app sigue funcionando igual porque nadie los usa todavía.
3. Cambiar `renderPage` en `src/render.js` a `renderPage(page, imagesById, canvas, title = '', background = DEFAULT_PAGE_COLOR)`. El fondo usa `background` en lugar de `#fff`. Prueba manual: la vista previa se ve igual que antes (blanca).
4. Cambiar `exportPdf` en `src/pdf.js` a `exportPdf(pages, imagesById, title, backgrounds)`, donde `backgrounds` es un array de `#rrggbb` con un color por página. En `src/ui.js`, calcular ese array con `resolvePageColor` al exportar y usar `resolvePageColor` también en `renderPreview`. Prueba manual: con los valores por defecto, la vista previa y el PDF siguen blancos.
5. Crear en `src/ui.js` un componente reutilizable `createColorPicker({ value, onChange, label })`. Devuelve un contenedor con los 8 botones de la paleta y el `<input type="color">`. Cada botón de la paleta tiene `aria-label` con el nombre del color y `aria-pressed="true"` si coincide con el valor actual. Agregar los estilos en `src/style.css`.
6. Agregar el control global en `index.html`, en el panel izquierdo, debajo del título, con la etiqueta "Color de fondo". Al cambiar llama a `setPageColor` y `refresh()`. Prueba manual: elegir amarillo pinta todas las páginas de la vista previa.
7. En `renderPreview`, llamar a `prunePageColors(pages.length)` después de `buildPages`. Agregar debajo de cada canvas un control por página con `createColorPicker` y un botón "Usar global". El botón queda deshabilitado si la página no tiene color propio. Al elegir un color se llama a `setPageColorOverride`. Solo se redibuja el canvas de esa página y se actualiza su control, sin reconstruir la vista previa, para que el selector nativo no se cierre mientras se arrastra. "Usar global" llama a `clearPageColorOverride` y redibuja esa página. Prueba manual: pintar la página 2 de rojo y cambiar el global a azul deja la página 2 roja y el resto azul.
8. Actualizar `CLAUDE.md`: agregar `src/colors.js`, los nuevos campos y mutaciones de `state.js`, la nueva firma de `renderPage` y `exportPdf`, y `tests/colors.test.js` en la lista de lógica cubierta por tests.

## Criterios de aceptación

- [ ] `npm test` pasa, incluido `tests/colors.test.js`.
- [ ] `npm run build` termina sin errores.
- [ ] Sin tocar ningún color, la vista previa y el PDF se ven igual que antes de esta spec (fondo blanco).
- [ ] El control global muestra 8 colores de paleta y un selector libre, debajo del campo de título.
- [ ] Elegir un color global cambia el fondo (margen y medianil) de todas las páginas sin color propio.
- [ ] Elegir un color con el selector libre (por ejemplo `#7b2cbf`) lo aplica igual que un color de la paleta.
- [ ] Cada página de la vista previa tiene su propio selector y un botón "Usar global" debajo del canvas.
- [ ] Elegir un color en la página 2 cambia solo la página 2.
- [ ] Con la página 2 personalizada, cambiar el color global no cambia la página 2.
- [ ] "Usar global" en la página 2 la vuelve al color global actual. Después, el botón queda deshabilitado.
- [ ] El botón de la paleta que coincide con el color activo se ve marcado y tiene `aria-pressed="true"`.
- [ ] Con título, la portada (página 1) se puede colorear igual que las demás.
- [ ] Mientras se arrastra el selector nativo de una página, el selector no se cierra y el canvas se actualiza.
- [ ] Si la página 3 tiene color propio y se quitan imágenes hasta que hay 2 páginas, al volver a tener 3 páginas la página 3 usa el color global.
- [ ] Reordenar imágenes no cambia qué número de página tiene color propio.
- [ ] El borde de las viñetas sigue negro y el título de la portada sigue blanco con contorno negro, con cualquier color de fondo.
- [ ] El PDF descargado tiene en cada página el mismo color de fondo que la vista previa.

## Decisiones

- **Sí:** solo el fondo de página (margen y medianil). Tiene el mayor impacto visual con un solo control.
- **No (en esta spec):** color de borde. Duplica los controles. Se puede agregar después sin romper este modelo.
- **Sí:** paleta de 8 colores más `<input type="color">`. La paleta da colores rápidos con look comic y el selector libre cubre el resto.
- **No:** solo paleta fija o solo selector libre. La primera limita demasiado. La segunda obliga a elegir color por color.
- **Sí:** el color propio queda atado al número de página. Es predecible y simple: "la página 3 es roja".
- **No:** atarlo a la primera imagen de la página. Confunde cuando el maquetado reagrupa las imágenes.
- **No:** resetear los colores propios ante cualquier cambio de imágenes. Hace perder trabajo al usuario.
- **Sí:** global + override por página. Cambiar el global no pisa las páginas personalizadas. "Usar global" las devuelve.
- **No:** que el global borre todos los overrides. Hace perder trabajo con un solo clic.
- **Sí:** descartar los overrides de páginas que dejan de existir. Evita que un color "reaparezca" en una página nueva inesperadamente.
- **Sí:** la portada se trata como una página más.
- **Sí:** `renderPage` recibe el color ya resuelto. El render sigue sin conocer el estado.
- **Sí:** lógica de resolución y poda en `src/colors.js`, pura y con tests, siguiendo el criterio de SPEC 01.
- **Sí:** al cambiar el color de una página se redibuja solo ese canvas. Reconstruir toda la vista previa cerraría el selector nativo en cada evento `input`.
- **No:** persistencia de colores. Va con la spec de persistencia prevista en SPEC 01.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| Con fondo negro (`#111111`) el borde negro de las viñetas casi no se ve | Se acepta en esta spec. El color de borde queda como spec futura. |
| Reconstruir la vista previa en cada evento `input` cierra el selector nativo | El cambio por página redibuja solo su canvas y su control (paso 7). |
| Un cambio global con muchas páginas redibuja todo en cada evento `input` | `schedulePreview` ya agrupa los redibujos a uno por frame. |
| Los overrides quedan desfasados si el número de páginas cambia | `prunePageColors(pages.length)` se llama en cada `renderPreview`. |

## Qué **no** incluye esta spec

- Color del borde de las viñetas.
- Color o estilo del título de la portada.
- Cambios de grosor de borde, medianil o margen.
- Degradados, texturas o imágenes de fondo.
- Persistencia de los colores entre sesiones.
- Temas o combinaciones guardadas.
- Colores atados a imágenes.

Cada una de estas, si llega, va en su propia spec.
