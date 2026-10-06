# Asistente Docentes — reglas del proyecto

Proyecto del Despacho del Comisionado Edwin Arturo Ruiz Moreno (CNSC). Chatbot accesible que responde preguntas sobre el proceso de selección de Docentes y Directivos Docentes **solo** con los proyectos de acuerdo y el anexo técnico, y muestra la fuente en cada respuesta.

El trabajo pendiente está en `PLAN_IMPLEMENTACION.md`. Léelo completo antes de empezar y sigue sus fases en orden.

## Reglas que no se negocian

1. **No inventes contenido jurídico.** Todo texto que el asistente muestre como fuente debe salir literal de los documentos (`kb.json`). No redactes respuestas, resúmenes, definiciones ni cifras. Los textos de interfaz que necesites están escritos en el plan, sección «Textos de interfaz»; úsalos tal cual.
2. **Sin modelos generativos en tiempo de ejecución.** El asistente busca y muestra; no llama a ninguna API de IA.
3. **No modifiques los archivos de `vendor/`.** Son copias del Instrumento EBAR (IncluIA). Se adaptan solo por configuración y por CSS propio.
4. **Solo voces instaladas en el equipo** para leer en voz alta (las del motor `vendor/ebar/js/voz-motor.js`). Nunca voces en línea.
5. **Ningún dato personal** se pide, se guarda ni se envía. La bitácora oculta números de 6 o más dígitos.
6. **Español de Colombia con tildes completas** en código visible, textos y documentación. Títulos en mayúscula inicial (no Title Case). Siempre «personas con discapacidad».
7. **El resultado se abre con doble clic**: un solo archivo `asistente-docentes.html`, sin servidor y sin depender de internet (las fuentes van incrustadas).
8. **Accesibilidad WCAG 2.1 AA** como mínimo: cada cambio debe pasar `npm run prueba` sin errores de axe.

## Comandos

- `python herramientas/extract.py` → lee los HTML de la carpeta `CHATBOT` y genera `herramientas/raw.json`.
- `python herramientas/buildkb.py` → genera `herramientas/kb.json` (y, desde la fase 4, el glosario).
- `npm run construir` → genera `asistente-docentes.html` (archivo único).
- `npm run prueba` → pruebas funcionales y de accesibilidad (Playwright + axe-core).

## Forma de trabajar

- Al terminar cada fase: corre las pruebas, escribe lo hecho en `BITACORA_IMPLEMENTACION.md` (qué cambió, resultado de pruebas, dudas) y **detente a reportar**, salvo que la persona haya dicho que continúes con todas.
- Si algo del plan no se puede cumplir tal como está escrito, no improvises una alternativa: anótalo en la bitácora y pregunta.
- Haz un commit de git por fase, con mensaje en español.
- **No hagas `git push`.** Cada `push` a `master` publica el asistente en GitHub Pages (`.github/workflows/publicar.yml`); esa decisión es de la persona responsable.
