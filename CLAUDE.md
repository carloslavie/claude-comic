# CLAUDE.md

Este archivo orienta a Claude Code (claude.ai/code) cuando trabaja con el código de este repositorio.

## Idioma

Responder siempre al usuario en español en este proyecto.

## Proyecto

**Web Comic**: una aplicación web para cargar imágenes y acomodarlas automáticamente como páginas de un libro de historietas.

Todavía no hay código de la aplicación. No hay stack, sistema de build, runner de tests ni configuración de lint. Cuando se agregue código, actualizar este archivo con los comandos y la arquitectura reales en lugar de suponerlos.

## Flujo de trabajo: desarrollo guiado por specs

El repo usa un flujo guiado por specs con dos skills del proyecto. Vienen de `Klerith/fernando-skills` y sus versiones están fijadas en `skills-lock.json`. `.claude/skills/*` son enlaces simbólicos a `.agents/skills/*`.

- `/spec <descripción de la funcionalidad en una oración>`: diseña una spec mediante preguntas aclaratorias y la guarda como `specs/NN-slug.md` con estado `Borrador`. No escribe código. La primera vez también crea `specs/.spec-config.yml` (`AutoCreateBranch: true`).
- `/spec-impl <NN-slug>`: implementa una spec solo si su estado significa "Aprobado". Solo la persona cambia el estado a Aprobado. La skill crea la rama `spec-NN-slug` o se cambia a ella. Implementa el plan paso a paso y se detiene después de cada paso para revisar el diff. Nunca hace commit por su cuenta.

Convenciones que aplican estas skills:

- Las specs siguen `.agents/skills/spec/template.md`. Empiezan con un encabezado (Estado / Depende de / Fecha / Objetivo en una oración). Después vienen Alcance (Dentro / Fuera), Modelo de datos, Plan de implementación, Criterios de aceptación y Decisiones. Riesgos es opcional. Cierran con una sección "Qué no incluye".
- Las specs se numeran en orden y con dos dígitos (`01-`, `02-`, …). Una spec nueva usa el mismo idioma y los mismos nombres de estado que las existentes. Estados en español: `Borrador`, `En revisión`, `Aprobado`, `Implementado`, `Obsoleto`.
- Durante la implementación, seguir la spec al pie de la letra. Ante pedidos fuera de alcance o ambigüedades, consultar al usuario en lugar de improvisar.

Nota: el directorio todavía no es un repositorio git. `/spec-impl` necesita git para crear ramas, así que hay que ejecutar `git init` antes de la primera implementación.
