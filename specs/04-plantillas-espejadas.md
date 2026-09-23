# SPEC 04 — Plantillas espejadas de 3 viñetas

> **Estado:** Implementado
> **Depende de:** SPEC 01, SPEC 03
> **Fecha:** 2026-09-23
> **Objetivo:** Agregar al catálogo dos plantillas de 3 viñetas, espejo de las existentes, que se puedan elegir desde el desplegable de cada página.

## Por qué existe esta spec

SPEC 03 permite elegir la plantilla de cada página, pero dejó las plantillas nuevas fuera de alcance. El catálogo tiene la viñeta ancha solo arriba y la alta solo a la izquierda. Esta spec suma las dos versiones espejadas. No toca la regla automática: solo amplía lo que se puede elegir a mano.

## Alcance

**Dentro:**

- Plantilla `3-right-tall`: "Una alta a la derecha y dos a la izquierda".
- Plantilla `3-bottom-wide`: "Una ancha abajo y dos arriba".
- En las dos, la imagen 1 va en la viñeta grande. Es el espejo exacto de `3-left-tall` y `3-top-wide`.
- Las dos aparecen en el desplegable de SPEC 03 con el formato `3 · nombre`.
- Cada plantilla nueva aparece en el grupo de 3 junto a su espejo, en este orden: `3-top-wide`, `3-bottom-wide`, `3-left-tall`, `3-right-tall`.
- Se deshabilitan cuando quedan menos de 3 imágenes y pasan a `fallback` cuando dejan de entrar, como el resto.
- El PDF exportado usa las plantillas nuevas igual que la vista previa.

**Fuera (para specs futuras):**

- Que la regla automática de SPEC 01 elija las plantillas nuevas.
- Otras plantillas nuevas (por ejemplo, de 4 o 5 viñetas con otra disposición).
- Editar los tamaños de viñeta o el medianil.
- Elegir qué imagen va en cada viñeta.

## Modelo de datos

Esta spec no agrega campos al estado ni a la página. Solo suma dos entradas a `TEMPLATES` en `src/templates.js`:

```js
'3-bottom-wide': {
  id: '3-bottom-wide',
  label: 'Una ancha abajo y dos arriba',
  panels: [
    { x: 0, y: 0.5, w: 1, h: 0.5 },   // imagen 1: la ancha de abajo
    { x: 0, y: 0, w: 0.5, h: 0.5 },   // imagen 2: arriba a la izquierda
    { x: 0.5, y: 0, w: 0.5, h: 0.5 }, // imagen 3: arriba a la derecha
  ],
},
'3-right-tall': {
  id: '3-right-tall',
  label: 'Una alta a la derecha y dos a la izquierda',
  panels: [
    { x: 0.5, y: 0, w: 0.5, h: 1 },   // imagen 1: la alta de la derecha
    { x: 0, y: 0, w: 0.5, h: 0.5 },   // imagen 2: arriba a la izquierda
    { x: 0, y: 0.5, w: 0.5, h: 0.5 }, // imagen 3: abajo a la izquierda
  ],
},
```

Convenciones:

- El orden del array `panels` define qué imagen va en cada viñeta: `render.js` dibuja `imageIds[i]` en `panels[i]`.
- El desplegable ordena por cantidad de viñetas con un `sort` estable. Dentro del grupo de 3, el orden sale del orden de inserción en `TEMPLATES`. Por eso `3-bottom-wide` va después de `3-top-wide` y `3-right-tall` después de `3-left-tall`.

## Plan de implementación

1. Agregar `3-bottom-wide` y `3-right-tall` a `src/templates.js`, en el orden del modelo de datos. Prueba: `npm test` pasa y, sin tocar ningún desplegable, la app se ve igual.
2. Agregar tests en `tests/layout.test.js`:
   - Con 3 imágenes y la elección `3-bottom-wide` en la página 1, la página queda `manual` con `3-bottom-wide`. Lo mismo con `3-right-tall`.
   - Con 2 imágenes, las dos elecciones quedan en `fallback`.
   - La regla automática no devuelve nunca las plantillas nuevas (por ejemplo, con `LLL`, `PPP` y `SSS`).
   - Las viñetas de cada plantilla nueva caben en 0..1 y cubren el área útil sin solaparse (la suma de áreas da 1).

   Prueba: `npm test` pasa.
3. Actualizar `CLAUDE.md`: el catálogo pasa a 8 plantillas con los ids nuevos, y el desplegable de `ui.js` muestra "Automático" + las 8 plantillas.

## Criterios de aceptación

- [x] `npm test` pasa, incluidos los tests nuevos de `tests/layout.test.js`.
- [x] `npm run build` termina sin errores.
- [x] Sin tocar ningún desplegable, la vista previa y el PDF tienen las mismas páginas y plantillas que antes de esta spec.
- [x] El desplegable muestra, en este orden: Automático, `1 · Una sola viñeta`, `2 · Dos apiladas`, `2 · Dos lado a lado`, `3 · Una ancha arriba y dos abajo`, `3 · Una ancha abajo y dos arriba`, `3 · Una alta a la izquierda y dos a la derecha`, `3 · Una alta a la derecha y dos a la izquierda`, `4 · Grilla 2 × 2`.
- [x] Con 3 imágenes y sin título, elegir `3 · Una ancha abajo y dos arriba` dibuja la imagen 1 abajo a todo el ancho, la 2 arriba a la izquierda y la 3 arriba a la derecha.
- [x] Con 3 imágenes y sin título, elegir `3 · Una alta a la derecha y dos a la izquierda` dibuja la imagen 1 a la derecha a toda la altura, la 2 arriba a la izquierda y la 3 abajo a la izquierda.
- [x] En las dos plantillas nuevas, el margen (10 mm), el medianil (4 mm) y el borde se ven iguales que en las plantillas existentes.
- [x] En una página donde quedan 2 imágenes, las dos plantillas nuevas están deshabilitadas.
- [x] El PDF descargado con las plantillas nuevas coincide con la vista previa.

## Decisiones

- **Sí:** las plantillas nuevas solo se eligen a mano. La regla de SPEC 01 no cambia, así que el maquetado automático y sus tests quedan iguales.
- **No:** sumarlas a la regla automática. Obliga a inventar un criterio de orientación nuevo; va en otra spec si hace falta.
- **Sí:** la imagen 1 va en la viñeta grande, como espejo exacto de `3-left-tall` y `3-top-wide`. Elegido por la persona.
- **No:** orden de lectura (las dos chicas primero). Es más natural para leer, pero rompe la simetría con las plantillas existentes.
- **Sí:** ids `3-right-tall` y `3-bottom-wide`, siguiendo el patrón `N-posición-forma` de los existentes.
- **Sí:** cada plantilla nueva va junto a su espejo en el desplegable. Se comparan más fácil.
- **Sí:** el orden del desplegable sale del orden de inserción en `TEMPLATES`. No hace falta tocar `ui.js`.
- **No:** cambios en `render.js`, `layout.js` o `ui.js`. Ya funcionan con cualquier plantilla del catálogo.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| Una elección guardada queda en `fallback` sin aviso si un id está mal escrito | `buildPages` ignora ids que no existen (SPEC 03). Los tests del paso 2 usan los ids reales. |
| El orden del desplegable cambia si alguien reordena `TEMPLATES` | El criterio de aceptación del orden lo detecta en la prueba manual. |

## Qué **no** incluye esta spec

- Plantillas nuevas en la regla automática.
- Otras plantillas además de estas dos.
- Tamaños de viñeta o medianil editables.
- Elegir qué imagen va en cada viñeta.

Cada una de estas, si llega, va en su propia spec.
