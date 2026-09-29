# SPEC 14 — Hoja sin fotos y cuadros por hoja

> **Estado:** Aprobado
> **Depende de:** SPEC 08, SPEC 09, SPEC 10, SPEC 13
> **Fecha:** 2026-09-29
> **Objetivo:** Permitir elegir la hoja (A4 o A3) antes de cargar fotos en los stickers y los cuadros, y mostrar en los cuadros cuántos entran por hoja, para calcular cuántas fotos subir.

## Por qué existe esta spec

La SPEC 13 agregó en los stickers el texto "Entran 15 stickers por hoja A4", visible también sin fotos, para elegir el tamaño antes de cargar. Pero el desplegable "Hoja" copia el estado de "Descargar PDF" (`sheetSelect.disabled = pdfButton.disabled` en `src/stickerUi.js`) y queda deshabilitado mientras no hay fotos. Así, sin fotos solo se puede consultar la capacidad en A4.

Los cuadros tienen el mismo bloqueo (`src/frameUi.js`) y además no dicen cuántos cuadros entran por hoja.

## Alcance

**Dentro:**

- **Stickers — "Hoja" habilitado sin fotos:** el desplegable "Hoja" se deshabilita solo mientras se genera el PDF. Con o sin fotos se puede cambiar, y el texto de capacidad de la SPEC 13 se actualiza al momento ("Entran 35 stickers por hoja A3" con Círculo de 5 cm).
- **Cuadros — "Hoja" habilitado sin fotos:** el desplegable "Hoja" se deshabilita solo mientras se genera el PDF o con una medida de hoja completa (A4 o A3, como en la SPEC 09). Las reglas de la SPEC 08 no cambian: si la medida no entra en A4, la opción A4 sigue deshabilitada, la hoja pasa a A3 y se ve "Esta medida necesita hoja A3.".
- **Cuadros — cuadros por hoja:** debajo de "Hoja" (y del aviso "Esta medida necesita hoja A3.", si se ve), un texto nuevo dice cuántos cuadros de la medida elegida entran en una hoja: "Entran 2 cuadros por hoja A4". Con uno solo: "Entra 1 cuadro por hoja A4". Misma redacción que en los stickers.
- **Cuándo se ve (cuadros):** siempre, también sin fotos, salvo con una medida de hoja completa: ahí se oculta, porque ya se ve "Cada cuadro ocupa una hoja A4 entera.".
- **Cuándo se actualiza (cuadros):** al cambiar la medida (incluida una medida personalizada válida) o la hoja. El paspartú no cambia la cantidad (va dentro de la medida), y girar un cuadro tampoco (ver el cálculo).
- **Qué número muestra (cuadros):** el mismo cálculo que los stickers, `sheetCapacity` de la SPEC 13, con la medida del cuadro vertical (`short` × `long`) y la hoja que va a usar el PDF (`currentPdfSheet()`). Como `sheetCapacity` prueba la hoja vertical y la apaisada, el número es el mismo para cuadros verticales o todos horizontales.

**Fuera (para specs futuras):**

- Calcular la capacidad según las orientaciones reales de las fotos cargadas (con cuadros verticales y horizontales mezclados pueden entrar menos; ver Riesgos).
- Un campo "Quiero N hojas" o cualquier cálculo de cuántas fotos subir más allá del texto de capacidad.
- Cambiar el margen, la separación o el acomodo de `packFrames`.
- Mostrar la orientación de la hoja o las dos cantidades.
- Cambios en el comic.
- Persistencia entre sesiones.

## Modelo de datos

No hay estructuras de estado nuevas ni funciones puras nuevas. `stickerState`, `frameState` y `sheetLayout.js` no cambian: se reusa `sheetCapacity(width, height, sheetId)` de la SPEC 13.

Valores esperados para los cuadros (hoja A4: área útil 190 × 277 mm; A3: 277 × 400 mm; separación 5 mm):

| Medida | A4 | A3 |
| ------ | -- | -- |
| 10 × 15 cm | `sheetCapacity(100, 150, 'a4')` → 2 | `sheetCapacity(100, 150, 'a3')` → 4 |
| 13 × 18 cm | `sheetCapacity(130, 180, 'a4')` → 2 | `sheetCapacity(130, 180, 'a3')` → 4 |
| 15 × 20 cm | `sheetCapacity(150, 200, 'a4')` → 1 | — |
| 20 × 30 cm | no entra (la hoja pasa a A3) | `sheetCapacity(200, 300, 'a3')` → 1 |

### Módulos con DOM

- `index.html`: en los cuadros, un `<p id="frames-capacity" class="hint"></p>` nuevo después de `#frames-sheet-hint` y antes de `#frames-full-sheet-hint`.
- `src/stickerUi.js`: en `refresh()`, `sheetSelect.disabled = exporting` (en lugar de copiar `pdfButton.disabled`). El click de "Descargar PDF" sigue deshabilitándolo mientras genera.
- `src/frameUi.js`:
  - En `refresh()`, `sheetSelect.disabled = exporting || fullSheet !== null` (en lugar de `pdfButton.disabled || …`).
  - Una función `capacityText(size, sheet)` arma el texto con `sheetCapacity(size.short, size.long, sheet)` y la etiqueta de la hoja de `FRAME_SHEETS`: "Entran N cuadros por hoja X" o "Entra 1 cuadro por hoja X".
  - `refresh()` pone ese texto en `#frames-capacity` con `currentPdfSheet()` y lo oculta (`hidden`) con una medida de hoja completa. El cambio de hoja ya llama a `refresh()`.

## Plan de implementación

1. En `src/stickerUi.js`, "Hoja" deshabilitado solo con `exporting`. Prueba manual: los criterios de stickers.
2. En `tests/sheetLayout.test.js`, agregar los casos de la tabla de cuadros y, para 13 × 18 en A4 y A3: `packFrames` con `sheetCapacity` cuadros de 130 × 180 da 1 hoja y con uno más da 2. Prueba: `npm test` pasa (no hay cambios de código puro; los tests atan el texto de los cuadros con el PDF).
3. En `index.html` y `src/frameUi.js`, "Hoja" habilitado sin fotos y el texto `#frames-capacity` actualizado desde `refresh()`. Prueba manual: los criterios de cuadros.
4. Actualizar `CLAUDE.md`: en `stickerUi.js`, "Hoja" se deshabilita solo mientras se genera; en `frameUi.js`, "Hoja" se deshabilita mientras se genera o con hoja completa, y el texto `#frames-capacity` con `sheetCapacity`; en `sheetLayout.js`, que `sheetCapacity` la usan stickers y cuadros.

## Criterios de aceptación

**Stickers**

- [ ] Al abrir los stickers sin fotos, "Hoja" está habilitado.
- [ ] Sin fotos, con Círculo de 5 cm, cambiar la hoja a A3 cambia el texto a "Entran 35 stickers por hoja A3"; volver a A4 lo deja en "Entran 15 stickers por hoja A4".
- [ ] La hoja elegida sin fotos se mantiene al cargar fotos, y el PDF sale en esa hoja.
- [ ] Sin fotos, "Descargar PDF" sigue deshabilitado.
- [ ] Mientras se genera el PDF, "Descargar PDF" y "Hoja" están deshabilitados; al terminar, "Hoja" vuelve a estar habilitado.

**Cuadros**

- [ ] Al abrir los cuadros sin fotos, "Hoja" está habilitado y debajo dice "Entran 2 cuadros por hoja A4" (13 × 18 cm).
- [ ] Sin fotos, cambiar la hoja a A3 cambia el texto a "Entran 4 cuadros por hoja A3".
- [ ] Con 15 × 20 cm en A4 dice "Entra 1 cuadro por hoja A4".
- [ ] Con 20 × 30 cm, A4 está deshabilitado, se ve "Esta medida necesita hoja A3." y "Entra 1 cuadro por hoja A3".
- [ ] Con 10 × 15 cm en A4 dice "Entran 2 cuadros por hoja A4".
- [ ] Con medida A4 o A3 (hoja completa), "Hoja" está deshabilitado, el texto de capacidad no se ve y se ve "Cada cuadro ocupa una hoja … entera.". Al volver a 13 × 18, el texto de capacidad vuelve a verse.
- [ ] Un tamaño personalizado válido actualiza el texto; uno inválido no lo cambia.
- [ ] Cambiar el paspartú o girar un cuadro no cambia el texto.
- [ ] Con tantas fotos de 13 × 18 (todas verticales) como dice el texto, "Se va a generar 1 hoja"; con una más, "Se van a generar 2 hojas".
- [ ] Sin fotos, "Descargar PDF" sigue deshabilitado. Mientras se genera el PDF, "Descargar PDF" y "Hoja" están deshabilitados.

**General**

- [ ] `npm test` pasa, incluidos los casos nuevos de `tests/sheetLayout.test.js`.
- [ ] `npm run build` termina sin errores.
- [ ] El comic y los PDF de cuadros y stickers funcionan igual que antes de esta spec.

## Decisiones

- **Sí:** desbloquear "Hoja" sin fotos en stickers y cuadros. Elegido por la persona. Sirve para calcular cuántas fotos subir antes de cargarlas.
- **Sí:** "Hoja" se deshabilita solo mientras se genera el PDF (y en cuadros, además, con hoja completa). Elegido por la persona. Durante la exportación se mantiene el bloqueo de las SPEC 08 y 10.
- **No:** no deshabilitarlo nunca. Cambiar la hoja a mitad de una exportación deja la pantalla distinta del PDF que se está generando.
- **Sí:** en stickers alcanza con el texto de capacidad actual. Elegido por la persona.
- **No:** un campo "Quiero N hojas" que calcule el total. Amplía el alcance sin necesidad; va en otra spec si hace falta.
- **Sí:** capacidad por hoja también en los cuadros, con la misma redacción y ubicación que en los stickers. Elegido por la persona. La SPEC 13 lo había dejado fuera.
- **Sí:** en cuadros, el mismo cálculo que en stickers (`sheetCapacity`, máximo entre hoja vertical y apaisada). Elegido por la persona. No depende de las fotos, así que funciona antes de cargarlas.
- **No:** calcular con las orientaciones reales de las fotos. Sin fotos no habría número, que es justo el caso que se quiere resolver.
- **Sí:** con una medida de hoja completa, el texto de capacidad se oculta. Elegido por la persona. El aviso "Cada cuadro ocupa una hoja … entera." ya da ese dato.
- **Sí:** sin funciones puras nuevas: el texto de los cuadros se arma en `frameUi.js`, como `capacityText()` en `stickerUi.js`.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| Con cuadros verticales y horizontales mezclados, `packFrames` puede usar más hojas que las que sugiere el texto | Se acepta: el texto da la capacidad con todos los cuadros en la misma orientación. El texto "Se van a generar N hojas" sigue calculándose con `packFrames` y es el dato exacto. |
| El texto de los cuadros y el PDF dan números distintos | Los tests del paso 2 comprueban con `packFrames` que esa cantidad de cuadros entra en 1 hoja y uno más pide 2. |

## Qué **no** incluye esta spec

- Capacidad según las orientaciones reales de las fotos.
- Un campo "Quiero N hojas" o un cálculo del total de fotos.
- Cambios en el margen, la separación o el acomodo de `packFrames`.
- Mostrar la orientación de la hoja o las dos cantidades.
- Cambios en el comic.
- Persistencia entre sesiones.

Cada una de estas, si llega, va en su propia spec.
