# SPEC 07 — Menú inicial de PictureFactory

> **Estado:** Implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-09-24
> **Objetivo:** Agregar una pantalla de inicio con un menú de herramientas (Comic, Cuadros y Stickers) desde la que se entra al creador de comics actual, y renombrar la app a PictureFactory.

## Por qué existe esta spec

Hoy la app abre directo en el creador de comics: `index.html` tiene una sola pantalla y `initUI()` en `src/ui.js` la maneja entera. El proyecto va a sumar dos herramientas más: imágenes para cuadros y plantillas para stickers. Hace falta una puerta de entrada común antes de construirlas.

Esta spec arma solo esa puerta de entrada. El comic pasa a ser la primera herramienta del menú y funciona exactamente igual que hoy. Cuadros y Stickers aparecen en el menú como "Próximamente". Cada una se construye en su propia spec.

## Alcance

**Dentro:**

- La app se llama **PictureFactory**. El nombre reemplaza a "Web Comic" en la cabecera.
- Una pantalla de inicio (el menú) con el encabezado "¿Qué querés crear hoy?" y tres tarjetas, en este orden:
  - **Creá un comic:** "Cargá tus fotos y armalas como páginas de una historieta en PDF." Disponible.
  - **Creá imágenes para cuadros:** "Prepará tus fotos para imprimir y enmarcar." Próximamente.
  - **Creá plantillas para stickers:** "Armá hojas de stickers listas para imprimir y recortar." Próximamente.
- Cada tarjeta muestra un ícono SVG escrito en el código, el título y la descripción.
- La tarjeta disponible es un enlace a su herramienta.
- Las tarjetas "Próximamente" se ven atenuadas, llevan la etiqueta "Próximamente" y no se pueden abrir ni enfocar con Tab.
- Navegación por hash en la URL:
  - `#/` o sin hash: el menú.
  - `#/comic`: el creador de comics.
  - Cualquier otro hash, incluidos `#/cuadros` y `#/stickers`, se reemplaza por `#/` sin sumar una entrada al historial.
- El botón Atrás y Adelante del navegador pasan del menú al comic y viceversa.
- Dentro de una herramienta, la cabecera muestra un enlace "← Inicio" que lleva a `#/`. En el menú, ese enlace no se ve.
- El nombre "PictureFactory" de la cabecera es un enlace a `#/` en cualquier pantalla.
- La pestaña del navegador dice "PictureFactory" en el menú y "Comic · PictureFactory" en el comic.
- El trabajo del comic (imágenes, título, estilos, colores, plantillas y formato) se conserva en memoria al ir al menú y volver. Al recargar la página se pierde, igual que hoy.
- El creador de comics se ve y funciona igual que antes de esta spec.

**Fuera (para specs futuras):**

- La herramienta "Crear imágenes para cuadros" (SPEC 08).
- La herramienta "Crear plantillas para stickers" (SPEC 09).
- Compartir imágenes entre herramientas.
- Mostrar en el menú si hay un comic en curso ("En curso: N imágenes").
- Persistencia del trabajo o de la última herramienta entre sesiones.
- Pantalla de "Página no encontrada".
- Logo o identidad visual de PictureFactory más allá del nombre.
- Cambiar el nombre del paquete en `package.json` o el nombre de la carpeta del repo.

## Modelo de datos

```js
// src/tools.js — módulo nuevo, lógica pura
export const APP_NAME = 'PictureFactory';

// El orden de inserción es el orden de las tarjetas del menú.
export const TOOLS = {
  comic: {
    id: 'comic',
    title: 'Creá un comic',
    description: 'Cargá tus fotos y armalas como páginas de una historieta en PDF.',
    tabTitle: 'Comic',
    available: true,
  },
  cuadros: {
    id: 'cuadros',
    title: 'Creá imágenes para cuadros',
    description: 'Prepará tus fotos para imprimir y enmarcar.',
    tabTitle: 'Cuadros',
    available: false,
  },
  stickers: {
    id: 'stickers',
    title: 'Creá plantillas para stickers',
    description: 'Armá hojas de stickers listas para imprimir y recortar.',
    tabTitle: 'Stickers',
    available: false,
  },
};
```

Funciones puras nuevas en `src/tools.js`:

- `toolHash(id)`: devuelve el hash de una herramienta. `toolHash('comic')` → `'#/comic'`.
- `resolveRoute(hash)`: devuelve `{ view, hash }`. `view` es `'home'` o el `id` de una herramienta disponible. `hash` es el hash que tiene que quedar en la URL.
  - `resolveRoute('')` → `{ view: 'home', hash: '' }`.
  - `resolveRoute('#/')` → `{ view: 'home', hash: '#/' }`.
  - `resolveRoute('#/comic')` → `{ view: 'comic', hash: '#/comic' }`.
  - `resolveRoute('#/cuadros')` → `{ view: 'home', hash: '#/' }` (herramienta no disponible).
  - `resolveRoute('#/xyz')` → `{ view: 'home', hash: '#/' }`.
- `documentTitle(view)`: el texto de la pestaña.
  - `documentTitle('home')` → `'PictureFactory'`.
  - `documentTitle('comic')` → `'Comic · PictureFactory'`.
  - Una vista desconocida devuelve `'PictureFactory'`.

Módulo nuevo con DOM: `src/home.js`.

- `initHome()`: arma las tarjetas del menú desde `TOOLS`, escucha `hashchange` y aplica la ruta actual.
- Aplicar una ruta: si `resolveRoute(location.hash).hash` es distinto de `location.hash`, lo reemplaza con `history.replaceState`. Después muestra la vista (`hidden` en las demás), muestra u oculta el enlace "← Inicio" y pone `document.title`.

Convenciones:

- Cada vista es un elemento con `data-view="<view>"`: `data-view="home"` para el menú y `data-view="comic"` para el comic.
- Las vistas se muestran y se ocultan con el atributo `hidden`. Nunca se destruyen ni se vuelven a crear.
- `initUI()` se llama una sola vez al arrancar, aunque se entre por el menú. Por eso el estado del comic se conserva entre vistas.
- La tarjeta disponible es `<a class="tool-card" href="#/comic">`. La no disponible es `<div class="tool-card is-soon" aria-disabled="true">`, sin `href` ni `tabindex`.
- Los íconos son SVG en línea, con `aria-hidden="true"`, definidos en `src/home.js` por `id` de herramienta.

## Plan de implementación

1. Crear `src/tools.js` con `APP_NAME`, `TOOLS`, `toolHash`, `resolveRoute` y `documentTitle`. Crear `tests/tools.test.js`:
   - `resolveRoute` con `''`, `'#/'`, `'#/comic'`, `'#/cuadros'`, `'#/stickers'` y `'#/xyz'`.
   - `documentTitle` con `'home'`, `'comic'` y una vista desconocida.
   - `toolHash('comic')`.
   - Las claves de `TOOLS` coinciden con su `id`.

   Prueba: `npm test` pasa y la app se ve igual.
2. En `index.html`, cambiar el `<title>` a "PictureFactory". Convertir el `<h1>` de la cabecera en un enlace `<a href="#/">PictureFactory</a>`. Agregar a la cabecera el enlace `<a id="home-link" href="#/" hidden>← Inicio</a>`. Cambiar `<main id="app">` por un `<main>` que contiene la vista del menú (`<section data-view="home">` con el `<h2>` "¿Qué querés crear hoy?" y una lista `<ul id="tool-list">` vacía) y la vista del comic (`<div id="comic-view" data-view="comic" hidden>` con las dos secciones de hoy). En `src/style.css`, cambiar los selectores `#app` por `#comic-view`. Prueba manual: la cabecera dice PictureFactory y se ve el encabezado del menú, todavía sin tarjetas.
3. Crear `src/home.js` con `initHome()`: arma las tres tarjetas desde `TOOLS`, con su ícono SVG, título, descripción y, en las no disponibles, la etiqueta "Próximamente". Aplica la ruta al arrancar y en cada `hashchange`. En `src/main.js`, llamar a `initUI()` y después a `initHome()`. Prueba manual: el menú muestra las tres tarjetas, clic en "Creá un comic" abre el comic, "← Inicio" vuelve al menú y Atrás también.
4. Agregar en `src/style.css` los estilos del menú: grilla de tarjetas (una columna en pantallas angostas, tres en anchas), la tarjeta con foco visible, el estado atenuado de `.is-soon`, la etiqueta "Próximamente", el enlace del nombre y el enlace "← Inicio" de la cabecera. Prueba manual: las tarjetas "Próximamente" se ven atenuadas y no reaccionan al clic ni a Tab.
5. Actualizar `CLAUDE.md`: el nombre PictureFactory y la descripción del proyecto como app con varias herramientas, los módulos `src/tools.js` y `src/home.js`, las vistas con `data-view`, el hash `#/comic` y los tests de `tools.js`.

## Criterios de aceptación

- [x] `npm test` pasa, incluidos los tests nuevos de `tests/tools.test.js`.
- [x] `npm run build` termina sin errores.
- [x] Al abrir la app sin hash, se ve el menú con el encabezado "¿Qué querés crear hoy?" y las tres tarjetas en este orden: Comic, Cuadros, Stickers.
- [x] Cada tarjeta muestra un ícono, su título y su descripción, con los textos de esta spec.
- [x] La cabecera dice "PictureFactory" y ya no aparece "Web Comic" en la interfaz.
- [x] En el menú, la pestaña dice "PictureFactory" y el enlace "← Inicio" no se ve.
- [x] Clic en "Creá un comic" cambia la URL a `#/comic` y muestra el creador de comics.
- [x] En el comic, la pestaña dice "Comic · PictureFactory" y se ve el enlace "← Inicio".
- [x] Las tarjetas de Cuadros y Stickers se ven atenuadas y con la etiqueta "Próximamente". Hacerles clic no cambia la URL ni la pantalla.
- [x] Con Tab desde el principio de la página, el foco pasa por el nombre de la app y la tarjeta del comic, y nunca por las tarjetas "Próximamente".
- [x] Clic en "← Inicio" o en "PictureFactory" desde el comic vuelve al menú.
- [x] Desde el comic, Atrás del navegador vuelve al menú, y Adelante vuelve al comic.
- [x] Abrir la app directo en `#/comic` muestra el comic sin pasar por el menú.
- [x] Abrir la app en `#/cuadros`, `#/stickers` o `#/xyz` muestra el menú y deja `#/` en la URL. Atrás no vuelve al hash inválido.
- [x] Con 3 imágenes, un título y un color de fondo cargados en el comic, ir al menú y volver al comic los muestra igual, con la vista previa armada.
- [x] Dentro del comic, la carga de imágenes, el título y su estilo, los colores, las plantillas, la vista previa y el PDF (A4 y A3) funcionan igual que antes de esta spec.

## Decisiones

- **Sí:** esta spec cubre solo el menú y el comic detrás de él. Cuadros y stickers son herramientas nuevas, con decisiones propias, y van en las specs 08 y 09. Elegido por la persona.
- **No:** una sola spec con las tres herramientas. Mezcla decisiones de tres dominios distintos.
- **Sí:** el nombre PictureFactory. La app va a hacer más que comics. Elegido por la persona.
- **No:** cambiar el nombre del paquete en `package.json` o de la carpeta. No se ve en la interfaz. Se puede hacer aparte.
- **Sí:** tarjetas "Próximamente" para Cuadros y Stickers. Muestran hacia dónde va la app sin pantallas vacías. Elegido por la persona.
- **No:** pantallas "En construcción" clicables, ni un menú con una sola opción.
- **Sí:** navegación por hash (`#/`, `#/comic`). Funcionan Atrás, Adelante y los enlaces directos, sin backend y sin configurar el servidor. Elegido por la persona.
- **No:** rutas con `history.pushState` sin hash (`/comic`). Recargar en `/comic` necesita que el servidor devuelva `index.html`, y eso depende de dónde se publique.
- **No:** cambiar de vista solo en memoria. Atrás saldría de la app y no habría enlaces directos.
- **Sí:** un hash inválido o de una herramienta no disponible se reemplaza por `#/` con `history.replaceState`. No queda en el historial una dirección que no lleva a nada. Elegido por la persona.
- **No:** pantalla de "Página no encontrada". Suma una vista para un caso raro.
- **Sí:** el trabajo del comic se conserva en memoria al ir al menú. Elegido por la persona.
- **No:** descartar el comic al volver al menú, ni mostrar "En curso" en la tarjeta. Lo segundo puede ir en otra spec.
- **Sí:** mostrar y ocultar vistas con `hidden`, e `initUI()` una sola vez al arrancar. Conserva el estado y los listeners sin tener que volver a armar la UI del comic.
- **No:** crear y destruir el DOM de cada vista al navegar. Obliga a reescribir `initUI()` y a guardar el estado de la UI aparte.
- **Sí:** enlace "← Inicio" en la cabecera y el nombre de la app como enlace. Hay una forma visible de volver aunque se haya entrado directo a `#/comic`. Elegido por la persona.
- **Sí:** íconos SVG escritos en el código. No suman archivos ni pedidos externos y se ven igual en todos los sistemas. Elegido por la persona.
- **No:** emojis como íconos. Cambian según el sistema operativo.
- **Sí:** la pestaña cambia según la pantalla. Elegido por la persona.
- **Sí:** `TOOLS`, `resolveRoute` y `documentTitle` en `src/tools.js`, un módulo puro. Las reglas de navegación se prueban con Vitest, igual que el resto de la lógica.
- **Sí:** las herramientas futuras usan los ids `cuadros` y `stickers`. Sus hashes (`#/cuadros`, `#/stickers`) quedan reservados. Habilitarlas es poner `available: true` y agregar su vista.
- **No:** persistencia. Va con la spec de persistencia.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| Cambiar `#app` por `#comic-view` rompe estilos del comic | El paso 2 cambia todos los selectores `#app` de `src/style.css`, y un criterio de aceptación verifica que el comic se ve igual. |
| La vista previa se arma mientras el comic está oculto y los canvas salen mal | `renderPage` toma la escala del atributo `width` del canvas, no del tamaño en pantalla. Dibujar con la vista oculta da el mismo resultado. |
| Una tarjeta "Próximamente" se puede abrir con el teclado | Es un `<div>` sin `href` ni `tabindex`, con `aria-disabled="true"`: no recibe foco ni navega. |
| Entrar directo a `#/cuadros` deja al usuario en una pantalla vacía | `resolveRoute` manda a `#/` toda herramienta con `available: false`. |

## Qué **no** incluye esta spec

- La herramienta de imágenes para cuadros.
- La herramienta de plantillas para stickers.
- Compartir imágenes entre herramientas.
- El aviso "En curso" en la tarjeta del comic.
- Persistencia del trabajo o de la última herramienta.
- Pantalla de "Página no encontrada".
- Logo o identidad visual más allá del nombre.
- Cambiar el nombre del paquete o de la carpeta.

Cada una de estas, si llega, va en su propia spec.
