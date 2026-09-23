# SPEC 05 — Estilo del título de la portada

> **Estado:** implementado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-09-23
> **Objetivo:** Permitir elegir desde la barra lateral el tamaño, la fuente, el color, el contorno y la posición del título de la portada.

## Por qué existe esta spec

Hoy `drawTitle` en `src/render.js` dibuja el título siempre igual. Usa Impact, blanco con contorno negro, centrado y con un tamaño máximo de 22 mm que baja solo hasta 6 mm si no entra. La persona no puede cambiar nada de eso. Además, Impact depende del sistema: en Mac o Linux puede no existir y la portada cambia según la máquina.

Esta spec agrega un estilo de título global con cinco opciones. Las fuentes van empaquetadas con la app para que el resultado sea el mismo en cualquier máquina y el PDF coincida con la vista previa.

## Alcance

**Dentro:**

- Un grupo "Estilo del título" en la barra lateral, justo debajo del campo "Título del comic".
- **Tamaño:** desplegable con Chico (14 mm), Mediano (22 mm) y Grande (32 mm). El valor es el tamaño máximo. Si el texto no entra, se sigue achicando solo hasta 6 mm, como hoy. Por defecto: Mediano.
- **Fuente:** desplegable con Bangers, Luckiest Guy, Permanent Marker y Anton. Las cuatro van empaquetadas con `@fontsource`. Por defecto: Bangers. Impact deja de usarse.
- **Posición:** desplegable con Arriba, Centro y Abajo. Siempre centrado en horizontal. Arriba y Abajo dejan una separación del 5 % del alto de la viñeta. Por defecto: Centro.
- **Color del texto:** el selector de color de SPEC 02 (paleta + `<input type="color">`). Por defecto: blanco (`#ffffff`).
- **Color del contorno:** el mismo selector. Por defecto: negro de la paleta (`#111111`).
- **Grosor del contorno:** desplegable con Sin contorno, Fino, Normal y Grueso. Normal es el grosor de hoy. Por defecto: Normal.
- Un botón "Restablecer estilo" que vuelve las seis opciones a sus valores por defecto.
- Si el título está vacío, todo el grupo queda deshabilitado. Los valores elegidos se conservan y vuelven a aplicarse al escribir un título.
- El estilo es uno solo para el comic: afecta solo a la portada.
- La vista previa y el PDF usan el mismo estilo.

**Fuera (para specs futuras):**

- Alineación horizontal del título (izquierda o derecha).
- Tamaño libre con deslizador o tamaño exacto sin ajuste automático.
- Fuentes del sistema, Google Fonts por CDN o fuentes cargadas por la persona.
- Negrita, cursiva, sombra, fondo detrás del texto u otros efectos.
- Subtítulo, autor u otro texto en la portada.
- Texto en las páginas de viñetas (globos, carteles).
- Mostrar cada opción del desplegable de fuentes con su propia fuente.
- Persistencia del estilo entre sesiones (va con la spec de persistencia).

## Modelo de datos

```js
// src/state.js — se agrega un campo al estado existente
const state = {
  title: '',
  images: [],
  pageColor: '#ffffff',
  pageColorOverrides: {},
  pageTemplateOverrides: {},
  titleStyle: { ...DEFAULT_TITLE_STYLE },
};
```

```js
// src/titleStyle.js — módulo nuevo, lógica pura
export const DEFAULT_TITLE_STYLE = {
  size: 'medium',          // clave de TITLE_SIZES
  font: 'bangers',         // clave de TITLE_FONTS
  position: 'center',      // clave de TITLE_POSITIONS
  color: '#ffffff',        // '#rrggbb', relleno del texto
  outlineColor: '#111111', // '#rrggbb'
  outline: 'normal',       // clave de TITLE_OUTLINES
};
```

Catálogos de `src/titleStyle.js` (el orden de inserción es el orden del desplegable):

| Catálogo          | Clave       | `label`          | Valor                                        |
| ----------------- | ----------- | ---------------- | -------------------------------------------- |
| `TITLE_SIZES`     | `small`     | Chico            | `maxMm: 14`                                  |
|                   | `medium`    | Mediano          | `maxMm: 22`                                  |
|                   | `large`     | Grande           | `maxMm: 32`                                  |
| `TITLE_FONTS`     | `bangers`   | Bangers          | `family: '"Bangers", "Impact", sans-serif'`  |
|                   | `luckiest`  | Luckiest Guy     | `family: '"Luckiest Guy", "Impact", sans-serif'` |
|                   | `marker`    | Permanent Marker | `family: '"Permanent Marker", "Impact", sans-serif'` |
|                   | `anton`     | Anton            | `family: '"Anton", "Impact", sans-serif'`    |
| `TITLE_POSITIONS` | `top`       | Arriba           | —                                            |
|                   | `center`    | Centro           | —                                            |
|                   | `bottom`    | Abajo            | —                                            |
| `TITLE_OUTLINES`  | `none`      | Sin contorno     | `ratio: 0`                                   |
|                   | `thin`      | Fino             | `ratio: 0.07`                                |
|                   | `normal`    | Normal           | `ratio: 0.14`                                |
|                   | `thick`     | Grueso           | `ratio: 0.22`                                |

- `ratio` es el grosor del contorno como fracción del tamaño de letra. `0.14` es el valor de hoy.
- El tamaño mínimo sigue siendo 6 mm para todos los tamaños.

Función pura nueva en `src/titleStyle.js`:

- `titleBlockTop(position, rectY, rectH, blockH)`: devuelve la `y` del borde superior del bloque de texto dentro de la viñeta.
  - `top`: `rectY + 0.05 * rectH`.
  - `center`: `rectY + (rectH - blockH) / 2`.
  - `bottom`: `rectY + 0.95 * rectH - blockH`.
  - Una posición desconocida se trata como `center`.

Nuevas mutaciones en `src/state.js`:

- `setTitleStyle(partial)`: mezcla `partial` con `state.titleStyle`, por ejemplo `setTitleStyle({ size: 'large' })`.
- `resetTitleStyle()`: reemplaza `state.titleStyle` por una copia de `DEFAULT_TITLE_STYLE`.

Firmas que cambian:

- `renderPage(page, imagesById, canvas, title, background, titleStyle = DEFAULT_TITLE_STYLE)` en `src/render.js`.
- `exportPdf(pages, imagesById, title, backgrounds, titleStyle)` en `src/pdf.js`.

Convenciones:

- En `drawTitle`, la altura del bloque es `líneas × tamaño × 1.1`, igual que hoy.
- Con grosor `none` no se llama a `strokeText`.
- Una clave desconocida en `titleStyle` usa el valor de `DEFAULT_TITLE_STYLE` para ese campo.

## Plan de implementación

1. Crear `src/titleStyle.js` con `DEFAULT_TITLE_STYLE`, los cuatro catálogos y `titleBlockTop`. Crear `tests/titleStyle.test.js`:
   - `titleBlockTop` con `top`, `center`, `bottom` y una posición desconocida.
   - Cada clave de `DEFAULT_TITLE_STYLE` que apunta a un catálogo existe en ese catálogo.

   Prueba: `npm test` pasa y la app se ve igual.
2. Instalar `@fontsource/bangers`, `@fontsource/luckiest-guy`, `@fontsource/permanent-marker` y `@fontsource/anton` como dependencias. Importarlas en `src/main.js`. Prueba: `npm run build` termina sin errores y la app se ve igual.
3. Agregar a `src/state.js` el campo `titleStyle` y las mutaciones `setTitleStyle` y `resetTitleStyle`. En `src/render.js`, agregar el parámetro `titleStyle` a `renderPage` y usarlo en `drawTitle`: tamaño máximo, familia, color, color y grosor del contorno, y `titleBlockTop` para la posición. Quitar las constantes `TITLE_FONT` y `TITLE_MAX_SIZE_MM`. En `src/pdf.js`, recibir `titleStyle` y pasarlo a `renderPage`. En `src/ui.js`, pasar `state.titleStyle` en la vista previa y al exportar. Antes del primer dibujo y antes de exportar, esperar `document.fonts.load` de la fuente elegida. Prueba manual: la portada se ve en Bangers, centrada, blanca con contorno negro.
4. En `index.html`, agregar debajo del campo de título un `<fieldset id="title-style">` con la leyenda "Estilo del título". En `src/ui.js`, llenarlo con los desplegables Tamaño, Fuente y Posición, armados desde los catálogos. Al cambiar Fuente, esperar `document.fonts.load` de la nueva fuente antes de `refresh()`. En el evento `input` del título y al iniciar, poner `fieldset.disabled` en `true` si el título está vacío. Agregar los estilos en `src/style.css`. Prueba manual: cambiar cada desplegable cambia la portada.
5. Agregar al fieldset dos `createColorPicker`: "Color del texto" y "Color del contorno". Agregar el desplegable "Grosor del contorno". Cada cambio llama a `setTitleStyle` y a `refresh()`. Prueba manual: elegir amarillo y contorno rojo grueso se ve en la portada.
6. Agregar el botón "Restablecer estilo". Al hacer clic llama a `resetTitleStyle()`, vuelve a armar los controles del fieldset con los valores por defecto y llama a `refresh()`.
7. Actualizar `CLAUDE.md`: el módulo `src/titleStyle.js`, el campo y las mutaciones de `state.js`, las firmas nuevas de `renderPage` y `exportPdf`, el fieldset de `ui.js`, las fuentes de `@fontsource` y los tests de `titleStyle.js`.

## Criterios de aceptación

- [x] `npm test` pasa, incluidos los tests nuevos de `tests/titleStyle.test.js`.
- [x] `npm run build` termina sin errores.
- [x] Debajo de "Título del comic" hay un grupo "Estilo del título" con: Tamaño, Fuente, Posición, Color del texto, Color del contorno, Grosor del contorno y el botón "Restablecer estilo".
- [x] Con el título vacío, todos los controles del grupo están deshabilitados.
- [x] Con un título escrito, los valores por defecto son: Mediano, Bangers, Centro, texto blanco, contorno negro y grosor Normal.
- [x] Con el título "Hola", la letra en Grande es más alta que en Mediano, y en Mediano es más alta que en Chico.
- [x] Con un título de 60 caracteres en Grande, el texto entra entero dentro de la viñeta de la portada.
- [x] Cada una de las 4 fuentes se ve distinta en la portada y ninguna cae en Impact ni en una fuente genérica.
- [x] Con la red desconectada (DevTools → Offline) y la página recargada desde `npm run preview`, las 4 fuentes se siguen viendo bien.
- [x] Con posición Arriba, el título queda en la parte superior de la portada. Con Abajo, en la parte inferior. En los dos casos no toca el borde de la viñeta.
- [x] Elegir un color de la paleta o del `<input type="color">` cambia el relleno del título.
- [x] Elegir otro color de contorno cambia el contorno del título.
- [x] Con "Sin contorno", el título no tiene contorno. Con Fino, Normal y Grueso, el contorno se ve cada vez más grueso.
- [x] "Restablecer estilo" vuelve los seis valores a los de por defecto, en los controles y en la portada.
- [x] Borrar el título y volver a escribirlo conserva el estilo elegido.
- [x] Las páginas de viñetas se ven igual que antes de esta spec.
- [x] El PDF descargado muestra la portada con el mismo tamaño, fuente, posición, colores y contorno que la vista previa.

## Decisiones

- **Sí:** tres tamaños fijos (Chico 14 / Mediano 22 / Grande 32 mm) que fijan el máximo. El ajuste automático sigue garantizando que el título entre en la portada.
- **No:** deslizador en mm. El valor elegido y el que se ve pueden no coincidir, y eso confunde.
- **No:** tamaño exacto sin ajuste. El título se puede salir de la viñeta o de la página.
- **Sí:** fuentes empaquetadas con `@fontsource`. Se ven igual en cualquier máquina y no hacen pedidos externos. Respeta que la app corra entera en el navegador.
- **No:** fuentes del sistema. El resultado cambia según la máquina.
- **No:** Google Fonts por CDN. Hace pedidos externos y no funciona sin conexión.
- **Sí:** Bangers pasa a ser la fuente por defecto y Impact deja de usarse. Elegido por la persona. La portada por defecto cambia respecto de hoy.
- **Sí:** Impact queda solo como respaldo en la pila de fuentes, por si una fuente no carga.
- **Sí:** esperar `document.fonts.load` antes de dibujar. El canvas no espera las fuentes solo, y sin esto el primer dibujo o el PDF salen con la fuente de respaldo.
- **Sí:** una sola spec para las cinco opciones. Todas son estilo del título y tocan los mismos archivos. Elegido por la persona.
- **Sí:** posición Arriba / Centro / Abajo, siempre centrada en horizontal, con separación del 5 %.
- **No:** grilla de 3 × 3 posiciones. Suma casos de ajuste de líneas sin un pedido claro.
- **Sí:** reusar `createColorPicker` y `PALETTE` de SPEC 02. Mantiene la misma interfaz para todos los colores.
- **Sí:** el negro por defecto del contorno es `#111111`, el negro de la paleta, en lugar del `#000` de hoy. Así el botón Negro aparece marcado. La diferencia no se nota.
- **Sí:** grosor en 4 opciones, con "Sin contorno" incluido.
- **Sí:** controles deshabilitados sin título, con los valores guardados. Se ve que existen y no se pierde lo elegido.
- **No:** ocultar los controles sin título. La barra lateral salta al escribir el título.
- **Sí:** botón "Restablecer estilo". Con seis opciones, volver atrás a mano es tedioso.
- **Sí:** "Restablecer estilo" vuelve a armar los controles. `createColorPicker` solo se actualiza cuando el usuario elige un color.
- **Sí:** un `<fieldset>` para el grupo. `disabled` en el fieldset deshabilita todos los controles de adentro, incluidos los de los selectores de color.
- **Sí:** catálogos y `titleBlockTop` en `src/titleStyle.js`, un módulo puro. La posición se prueba con Vitest, igual que `colors.js`.
- **No:** mostrar cada fuente con su propia letra en el desplegable. Los `<option>` no respetan `font-family` en todos los navegadores.
- **No:** persistencia del estilo. Va con la spec de persistencia.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| El canvas dibuja antes de que cargue la fuente y el título sale en la fuente de respaldo | Esperar `document.fonts.load` al iniciar, al cambiar de fuente y antes de exportar el PDF. |
| Una fuente no tiene algún carácter (por ejemplo, tildes o `ñ`) | Las cuatro incluyen el subconjunto latino. Si falta un carácter, el navegador usa la fuente de respaldo solo para ese carácter. |
| Las fuentes suman peso al build | Son 4 archivos woff2 chicos. Se cargan solo los subconjuntos que usa el texto (`unicode-range`). |
| Con posición Arriba o Abajo y contorno Grueso, el contorno toca el borde de la viñeta | La separación del 5 % del alto (unos 14 mm) es mayor que el contorno más grueso (0.22 × 32 mm ≈ 7 mm). |
| La portada por defecto cambia (Bangers en lugar de Impact) y sorprende | Decisión aceptada por la persona. El cambio es solo en la portada. |

## Qué **no** incluye esta spec

- Alineación horizontal del título.
- Tamaño libre o exacto.
- Fuentes del sistema, por CDN o cargadas por la persona.
- Negrita, cursiva, sombra, fondo u otros efectos.
- Subtítulo, autor u otro texto.
- Texto en las páginas de viñetas.
- Vista previa de cada fuente en el desplegable.
- Persistencia del estilo entre sesiones.

Cada una de estas, si llega, va en su propia spec.
