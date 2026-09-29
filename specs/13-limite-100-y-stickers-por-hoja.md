# SPEC 13 — Límite de 100 fotos y stickers por hoja

> **Estado:** Implementado
> **Depende de:** SPEC 01, SPEC 08, SPEC 10, SPEC 11
> **Fecha:** 2026-09-29
> **Objetivo:** Subir de 40 a 100 el máximo de fotos en las tres herramientas y mostrar en los stickers cuántos entran por hoja según la forma, el tamaño y la hoja elegidos.

## Por qué existe esta spec

El límite de 40 fotos viene de la SPEC 01 y lo comparten el comic, los cuadros y los stickers (`MAX_IMAGES` en `src/state.js`). Para hacer muchos stickers distintos, 40 fotos se queda corto.

En los stickers, hoy solo se ve cuántas hojas se van a generar, y solo con fotos cargadas. No se sabe de antemano cuántos stickers entran en una hoja, que es lo que decide qué tamaño conviene para aprovechar el papel.

Son dos cambios chicos e independientes. Van juntos en una sola spec por decisión de la persona.

## Alcance

**Dentro:**

- **Límite de 100:** `MAX_IMAGES` pasa de 40 a 100. Aplica al comic, los cuadros y los stickers, que ya importan la misma constante. El mensaje de rechazo pasa a decir "Se alcanzó el límite de 100 imágenes…" (sale de la constante, no cambia el texto armado en `messages.js`).
- **Textos de las zonas de carga:** los tres textos de ayuda de `index.html` pasan de "máximo 40" a "máximo 100": "JPG, PNG o WebP · máximo 100 imágenes" (comic) y "JPG, PNG o WebP · máximo 100 fotos" (cuadros y stickers).
- **Stickers por hoja:** en la herramienta de stickers, debajo del desplegable "Hoja", un texto nuevo dice cuántos stickers entran en una hoja: "Entran 15 stickers por hoja A4". Con uno solo: "Entra 1 sticker por hoja A4".
- **Cuándo se ve:** siempre, también sin fotos cargadas, porque solo depende de la forma, el tamaño y la hoja.
- **Cuándo se actualiza:** al cambiar la forma, el tamaño (incluido un tamaño personalizado válido) o la hoja. El borde no cambia la cantidad (va dentro del tamaño) y las copias tampoco.
- **Qué número muestra:** la cantidad máxima que entra en una hoja, probando la hoja vertical y la apaisada, con el mismo margen (10 mm) y la misma separación (5 mm) que usa el PDF. El texto no menciona la orientación.
- **Cálculo puro:** una función nueva en `src/sheetLayout.js`, con tests, que coincide con `packFrames`: esa cantidad de copias entra en una hoja y una más pide dos.

**Fuera (para specs futuras):**

- Achicar las fotos al cargarlas para ahorrar memoria.
- Un límite distinto por herramienta.
- Mostrar la orientación de la hoja o las dos cantidades (vertical y apaisada).
- Capacidad por hoja en los cuadros.
- Sugerir el tamaño que mejor aprovecha la hoja.
- Girar stickers en la hoja o cambiar el margen o la separación.
- Persistencia entre sesiones.

## Modelo de datos

No hay estructuras de estado nuevas. `stickerState` no cambia.

### Límite — `src/state.js`

```js
export const MAX_IMAGES = 100; // antes 40
```

`addFiles`, `addFrameFiles` y `addStickerFiles` no cambian: ya usan `MAX_IMAGES`.

### Capacidad de una hoja — `src/sheetLayout.js`

- **Nueva** `sheetCapacity(width, height, sheetId)` → cantidad de piezas de `width` × `height` mm (sin girar) que entran en una hoja. Usa el área útil de la hoja (`usableArea`, sin márgenes) y `FRAME_GAP_MM`. Por cada orientación de la hoja (vertical: área útil tal cual; apaisada: ancho y alto intercambiados) calcula `floor((anchoÚtil + 5) / (width + 5)) × floor((altoÚtil + 5) / (height + 5))` y devuelve la mayor de las dos. Devuelve `0` si la pieza no entra en ninguna. Una hoja desconocida se trata como A4, como en el resto del módulo.
  - `sheetCapacity(50, 50, 'a4')` → `15` (círculo de 5 cm).
  - `sheetCapacity(30, 30, 'a4')` → `40`.
  - `sheetCapacity(70, 70, 'a4')` → `6`.
  - `sheetCapacity(100, 100, 'a4')` → `2`.
  - `sheetCapacity(190, 190, 'a4')` → `1`.
  - `sheetCapacity(50, 33, 'a4')` → `25` (rectángulo horizontal de 5 cm: 21 en vertical, 25 en apaisada).
  - `sheetCapacity(33, 50, 'a4')` → `25` (rectángulo vertical de 5 cm).
  - `sheetCapacity(50, 50, 'a3')` → `35`.
  - `sheetCapacity(50, 50, 'xyz')` → `15`.
  - `sheetCapacity(300, 300, 'a4')` → `0`.

### Módulos con DOM

- `index.html`: los tres textos "máximo 40" pasan a "máximo 100". En los stickers, un `<p id="stickers-capacity" class="hint"></p>` nuevo justo después del `<label>` de "Hoja".
- `src/stickerUi.js`: una función `capacityText()` arma el texto con `sheetCapacity(width, height, stickerState.sheet)`, donde `width` y `height` salen de `stickerFor(currentStickerSize(), stickerState.shape, …)`, y la etiqueta de la hoja de `FRAME_SHEETS`. `updateCounts()` también actualiza `#stickers-capacity`, así se actualiza con `refresh()` (forma, tamaño, borde, fotos) y al cambiar la hoja.

## Plan de implementación

1. En `src/state.js`, cambiar `MAX_IMAGES` a 100. En `index.html`, cambiar los tres textos "máximo 40" a "máximo 100". Prueba: `npm test` y `npm run build` pasan y, a mano, se pueden cargar 100 fotos en cada herramienta y la 101 se rechaza con el mensaje del límite de 100.
2. En `src/sheetLayout.js`, agregar `sheetCapacity`. En `tests/sheetLayout.test.js`, los ejemplos de esta spec y, para 50 × 50, 50 × 33 y 33 × 50 en A4 y A3: `packFrames` con `sheetCapacity` copias da 1 hoja y con una copia más da 2. Prueba: `npm test` pasa.
3. En `index.html` y `src/stickerUi.js`, el texto `#stickers-capacity` debajo de "Hoja", actualizado desde `updateCounts()`. Prueba manual: los criterios de stickers por hoja.
4. Actualizar `CLAUDE.md`: el límite de 100 (en `state.js` dice "límite de 40") y `sheetCapacity` en `sheetLayout.js`, y el texto de capacidad en `stickerUi.js`.

## Criterios de aceptación

- [x] `npm test` pasa, incluidos los casos nuevos de `tests/sheetLayout.test.js`.
- [x] `npm run build` termina sin errores.
- [x] Las zonas de carga del comic, los cuadros y los stickers dicen "máximo 100".
- [x] En cada herramienta se pueden cargar 100 fotos; al intentar cargar más, las que sobran se rechazan con "Se alcanzó el límite de 100 imágenes".
- [x] Al abrir los stickers sin fotos, debajo de "Hoja" dice "Entran 15 stickers por hoja A4" (Círculo, 5 cm, A4).
- [x] Con "Rectángulo horizontal" y 5 cm en A4 dice "Entran 25 stickers por hoja A4".
- [x] Con Círculo de 5 cm, cambiar la hoja a A3 cambia el texto a "Entran 35 stickers por hoja A3" sin rearmar las tarjetas.
- [x] Con 3 cm en A4 dice "Entran 40 stickers por hoja A4"; con 10 cm, "Entran 2 stickers por hoja A4".
- [x] Con "Personalizado" en 19 cm en A4 dice "Entra 1 sticker por hoja A4".
- [x] Un tamaño personalizado inválido no cambia el texto (sigue el del tamaño vigente).
- [x] Cambiar el borde o las copias no cambia el texto.
- [x] Con 1 foto con tantas copias como dice el texto, "Se va a generar 1 hoja"; con una copia más, "Se van a generar 2 hojas".
- [x] El comic, los cuadros y el PDF de los stickers funcionan igual que antes de esta spec.

## Decisiones

- **Sí:** una sola spec para los dos cambios. Elegido por la persona. Los dos son chicos y tocan pocos archivos.
- **Sí:** el límite de 100 en las tres herramientas. Elegido por la persona. Ya comparten `MAX_IMAGES`: no hace falta un límite por herramienta.
- **No:** límite solo para los stickers. Obliga a separar la constante sin un motivo concreto.
- **Sí:** el texto de capacidad va debajo del desplegable "Hoja". Elegido por la persona. Queda junto al control que lo cambia.
- **No:** sumarlo al texto "Se van a generar N hojas" o ponerlo en cada tarjeta. El primero solo existe con fotos; en las tarjetas se repetiría igual en todas.
- **Sí:** se muestra siempre, también sin fotos. Elegido por la persona. Sirve para elegir el tamaño antes de cargar.
- **Sí:** el máximo de las dos orientaciones, sin nombrar la orientación. Elegido por la persona. Es lo que logra el PDF al llenar las hojas.
- **Sí:** `sheetCapacity` en `sheetLayout.js`, pura y con tests. Elegido por la persona. Usa el mismo margen y separación que `packFrames` y los tests atan las dos funciones.
- **No:** calcular la capacidad llamando a `packFrames` con muchas copias. Funciona, pero la fórmula por filas y columnas es directa y más clara.
- **No:** achicar las fotos al cargarlas. Elegido por la persona. Cambia resolución, avisos de DPI y PDF; va en otra spec si hace falta.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| 100 fotos de alta resolución decodificadas enteras agotan la memoria del navegador (sobre todo en celulares) | Se acepta. Si aparece, una spec aparte achica las fotos al cargarlas. |
| `sheetCapacity` y `packFrames` dan números distintos y el texto miente | Los tests del paso 2 comprueban que esa cantidad de copias entra en 1 hoja con `packFrames` y una más pide 2. |
| Exportar 100 fotos en cuadros o comic tarda más | El PDF ya se genera foto por foto con el botón en "Generando…"; se acepta. |

## Qué **no** incluye esta spec

- Achicar las fotos al cargarlas.
- Un límite distinto por herramienta.
- Mostrar la orientación de la hoja o las dos cantidades.
- Capacidad por hoja en los cuadros.
- Sugerir el tamaño que mejor aprovecha la hoja.
- Girar stickers en la hoja o cambiar el margen o la separación.
- Persistencia entre sesiones.

Cada una de estas, si llega, va en su propia spec.
