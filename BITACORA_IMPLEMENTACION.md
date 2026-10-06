# Bitácora de implementación — Asistente Docentes v0.2

## Fase 0 — Preparación y línea base (6 de octubre de 2026)

### Qué se hizo

1. **Entorno.** Node v24.14.0, npm 11.9.0, Python 3.12.10, `beautifulsoup4` 4.15.0 (instalado por la persona responsable tras detenerme en la primera verificación) y git 2.53.
2. **Git.** La carpeta no era repositorio: `git init`, `.gitignore` (`node_modules/`, `herramientas/raw.json`, `pruebas/resultados/`) y commit «Estado inicial v0.1». Se configuró la identidad local del repositorio (`Despacho EARM CNSC`, `despacho-earm@cnsc.gov.co`, la misma de IncluIA) porque no había identidad global.
3. **Dependencias.** `package.json` con `esbuild`, `playwright` y `axe-core` como devDependencies y los scripts `construir` y `prueba`. Se ejecutó `npm install` y `npx playwright install chromium`. El script `construir` apunta a `herramientas/construir.mjs`, que se escribe en la fase 1; hasta entonces el archivo se regenera con `python herramientas/construir_html.py`. El script `prueba` ejecuta por ahora solo `pruebas/funcional.mjs`; la fase 5 agrega la de accesibilidad.
4. **Atributos de datos.** En `herramientas/plantilla.html`, `addBot` recibe un quinto parámetro opcional `meta` y agrega al `<article>` `data-tipo`, `data-fuentes` (rótulos separados por ` | `, la fuente principal primero y luego las de «Otras fuentes relacionadas») y `data-entidad` (la entidad usada o vacío) y, tras el ajuste del plan, `data-fuente-principal` (la primera fuente del bloque «Texto oficial», sin las relacionadas). Cada rama de `answer()` pasa su `meta`. La bienvenida no lleva atributos. No cambió ninguna lógica de búsqueda ni umbral. Detalle técnico: `srcs` pasó de `const` dentro del bloque `if(faqOk)` a `let` declarado antes, para poder leerlo al final de la función. Se regeneró `asistente-docentes.html` con `python herramientas/construir_html.py`.
5. **Pruebas.** `pruebas/preguntas.json` (16 casos de la sección 7, con el campo `desde` y `fase_actual: 0`) y `pruebas/funcional.mjs` (Playwright/Chromium, `file://`, una página nueva por caso, compara `data-tipo`, `data-fuentes` por inclusión y `data-entidad` exacto; también falla si hay errores de consola).

### Línea base (v0.1 con los atributos de datos, tras el ajuste)

```
1 OK      ¿cuál es el puntaje mínimo para aprobar?
     tipo=faq | principal=Artículo 13, Parágrafo segundo | fuentes=Artículo 13, Parágrafo segundo | Artículo 13, Parágrafo tercero | Numeral 5.1.12 | entidad=
 2 OK      cuantos dias tengo para reclamar los resultados de la prueba escrita
     tipo=faq | principal=Numeral 2.7 | fuentes=Numeral 2.7 | Artículo 15 | Artículo 21 | entidad=
 3 OK      ¿cuántas vacantes hay?
     tipo=depende-entidad | principal= | fuentes= | entidad=
 4 OK      cuantas vacantes ofrece Antioquia
     tipo=faq | principal=Artículo 8 | fuentes=Artículo 8 | Artículo 7, Parágrafo octavo | Artículo 25, Parágrafo | entidad=Secretaría de Educación Departamental de Antioquia
 5 OK      me puedo inscribir a dos empleos
     tipo=faq | principal=Artículo 8, Parágrafo quinto | fuentes=Artículo 8, Parágrafo quinto | Numeral 1.2.5 | Numeral 1.2.6 | Numeral 1.2.4 | entidad=
 6 OK      ¿cuál es el horario de atención de la CNSC en Bogotá?
     tipo=no-encontrado | principal= | fuentes= | entidad=Secretaría de Educación Distrital de Bogotá
 7 OK      qué pasa en la audiencia de escogencia de vacante
     tipo=pasaje | principal=Numeral 7.3 | fuentes=Numeral 7.3 | Artículo 31 | Artículo 7, Parágrafo cuarto | entidad=
 8 OK      en qué ciudades se presentan las pruebas
     tipo=pasaje | principal=Numeral 2.4 | fuentes=Numeral 2.4 | Numeral 1.2.4 | Numeral 2.2 | entidad=
 9 OK      cuántas vacantes de docente de preescolar hay en Amazonas
     tipo=pasaje | principal=Artículo 8 | fuentes=Artículo 8 | Numeral 5.1.4 | entidad=Secretaría de Educación Departamental de Amazonas
10 OK      las personas con discapacidad pagan
     tipo=faq | principal=Artículo 6, Parágrafo primero | fuentes=Artículo 6, Parágrafo primero | Numeral 1.2.5 | Artículo 6, Parágrafo tercero | entidad=
11 OK      quién gana el mundial de fútbol
     tipo=no-encontrado | principal= | fuentes= | entidad=
12 OMITIDO cuánto cuesta la inscripción
     desde fase 4
13 OMITIDO cuál es el valor de los derechos de participación
     desde fase 4
14 OK      ¿Cómo pago los derechos de participación?
     tipo=faq | principal=Numeral 1.2.5 | fuentes=Numeral 1.2.5 | Artículo 6, Parágrafo tercero | Numeral 1.1 | entidad=
15 OMITIDO ¿qué es la OPEC?
     desde fase 4
16 OK      ¿Qué pruebas se aplican y cuánto vale cada una?
     tipo=faq | principal=Artículo 13 | fuentes=Artículo 13 | Numeral 2.2 | Artículo 13, Parágrafo tercero | entidad=

Fase 0: 13 OK, 0 con diferencias, 3 omitidos
```

Resultado: **13 de 13 casos vigentes en verde**, 3 omitidos hasta la fase 4. La comparación de «Fuente contiene» usa `data-fuente-principal`; solo el caso 5 (la pregunta frecuente `un-empleo` tiene dos fuentes) usa `data-fuentes` (`"fuente_en": "fuentes"` en `preguntas.json`).

### Ajuste de la línea base (decisión de la persona responsable)

El caso 6 daba la entidad «Secretaría de Educación Distrital de Bogotá» porque `detectEntity` de v0.1 reconoce «Bogotá» en la pregunta. Se eligió la opción a: el plan se corrigió (el caso 6 espera esa entidad) y el motor no se tocó.

### Otras observaciones

- No se ejecutaron `extract.py` ni `buildkb.py`: la fase 0 no lo requiere y `kb.json` y `faq.json` quedaron intactos.
- Los casos 12, 13 y 15 se omiten hasta la fase 4, como indica el plan.

## Fase 1 — Código separado y construcción con esbuild (6 de octubre de 2026)

### Qué se hizo

1. **División de `plantilla.html`.**
   - `src/index.html`: la estructura, con los marcadores `<!--CSS-->`, `<!--DATOS-->` y `<!--JS-->`. Conserva el enlace a Google Fonts de v0.1; las fuentes incrustadas llegan en la fase 2.
   - `src/css/marca-earm.css` (tokens, base, cabecera, botones, pie), `chat.css` (conversación, formulario, diálogo, tablas, pantallas pequeñas) y `temas.css` (el alto contraste de v0.1, que la fase 2 reemplaza). Las reglas se movieron sin cambios y en el mismo orden relativo.
   - `src/js/motor-busqueda.js` (STOP, SYN, `norm`, `stem`, `toks`, `qgroups`, `Index`), `base-conocimiento.js` (pasajes, índices, FAQ, detección de entidad; función `crearBase`), `respuestas.js` (presentación, `addBot`, `answer`), `bitacora.js` y `main.js` (datos, entidades, voz, dictado, accesibilidad de v0.1, sugeridas, bienvenida). El JavaScript es ahora módulos ES; la lógica, los umbrales (`faqOk` 0,66 y 0,6; `passOk` 0,6 y 1; especificidad 0,8), los sinónimos y las palabras vacías se movieron sin reescribir.
2. **Datos.** `main.js` lee `<script type="application/json" id="datos-kb">` con `JSON.parse` (un solo bloque con `kb` y `faq`). Ya no existe `window.KB` ni `window.FAQ`.
3. **Construcción.** `herramientas/construir.mjs` empaqueta el JS con esbuild (`iife`, `es2020`, sin minificar), empaqueta el CSS con cargador `dataurl` para `.woff` y `.woff2`, incrusta los datos escapando `</`, sustituye los marcadores y escribe `asistente-docentes.html` (1,36 MB). Se borraron `construir_html.py` y `plantilla.html` después de comprobar las pruebas.
4. **`LEEME.md`** actualizado con la estructura de `src/` y los comandos `npm run construir` y `npm run prueba`.

### Resultado de las pruebas

`npm run prueba` da exactamente la misma salida que la línea base (comparada con `diff`, 13 OK, 3 omitidos, 0 errores de consola):

```
1 OK      ¿cuál es el puntaje mínimo para aprobar?
     tipo=faq | principal=Artículo 13, Parágrafo segundo | fuentes=Artículo 13, Parágrafo segundo | Artículo 13, Parágrafo tercero | Numeral 5.1.12 | entidad=
 2 OK      cuantos dias tengo para reclamar los resultados de la prueba escrita
     tipo=faq | principal=Numeral 2.7 | fuentes=Numeral 2.7 | Artículo 15 | Artículo 21 | entidad=
 3 OK      ¿cuántas vacantes hay?
     tipo=depende-entidad | principal= | fuentes= | entidad=
 4 OK      cuantas vacantes ofrece Antioquia
     tipo=faq | principal=Artículo 8 | fuentes=Artículo 8 | Artículo 7, Parágrafo octavo | Artículo 25, Parágrafo | entidad=Secretaría de Educación Departamental de Antioquia
 5 OK      me puedo inscribir a dos empleos
     tipo=faq | principal=Artículo 8, Parágrafo quinto | fuentes=Artículo 8, Parágrafo quinto | Numeral 1.2.5 | Numeral 1.2.6 | Numeral 1.2.4 | entidad=
 6 OK      ¿cuál es el horario de atención de la CNSC en Bogotá?
     tipo=no-encontrado | principal= | fuentes= | entidad=Secretaría de Educación Distrital de Bogotá
 7 OK      qué pasa en la audiencia de escogencia de vacante
     tipo=pasaje | principal=Numeral 7.3 | fuentes=Numeral 7.3 | Artículo 31 | Artículo 7, Parágrafo cuarto | entidad=
 8 OK      en qué ciudades se presentan las pruebas
     tipo=pasaje | principal=Numeral 2.4 | fuentes=Numeral 2.4 | Numeral 1.2.4 | Numeral 2.2 | entidad=
 9 OK      cuántas vacantes de docente de preescolar hay en Amazonas
     tipo=pasaje | principal=Artículo 8 | fuentes=Artículo 8 | Numeral 5.1.4 | entidad=Secretaría de Educación Departamental de Amazonas
10 OK      las personas con discapacidad pagan
     tipo=faq | principal=Artículo 6, Parágrafo primero | fuentes=Artículo 6, Parágrafo primero | Numeral 1.2.5 | Artículo 6, Parágrafo tercero | entidad=
11 OK      quién gana el mundial de fútbol
     tipo=no-encontrado | principal= | fuentes= | entidad=
12 OMITIDO cuánto cuesta la inscripción
     desde fase 4
13 OMITIDO cuál es el valor de los derechos de participación
     desde fase 4
14 OK      ¿Cómo pago los derechos de participación?
     tipo=faq | principal=Numeral 1.2.5 | fuentes=Numeral 1.2.5 | Artículo 6, Parágrafo tercero | Numeral 1.1 | entidad=
15 OMITIDO ¿qué es la OPEC?
     desde fase 4
16 OK      ¿Qué pruebas se aplican y cuánto vale cada una?
     tipo=faq | principal=Artículo 13 | fuentes=Artículo 13 | Numeral 2.2 | Artículo 13, Parágrafo tercero | entidad=

Fase 0: 13 OK, 0 con diferencias, 3 omitidos
```

Además comprobé la equivalencia con v0.1 más allá de los 13 casos: con un script temporal (fuera del proyecto) hice 35 preguntas (los 16 casos, las 12 preguntas frecuentes y 7 adicionales) contra el `asistente-docentes.html` de la fase 0 y el nuevo, y comparé el HTML de cada respuesta y la entidad elegida: **0 diferencias, 0 errores de consola en ambos**.

### Diferencias y dudas

- `bitacora.js` también exporta `$`, `store`, `esc` y `setStatus`, porque `respuestas.js`, `main.js` y la bitácora los comparten y la estructura del plan no incluye un archivo de utilidades. Si prefiere un `util.js` aparte, es un cambio de ubicación.
- No ejecuté `extract.py` ni `buildkb.py` con las rutas nuevas del `LEEME.md` (`python herramientas/...` desde la raíz del proyecto); los pasos 2 y 3 quedan como estaban, solo con la ruta anotada desde la raíz. Conviene confirmarlo cuando lleguen los acuerdos definitivos.
- La comprobación de «abre con doble clic sin errores de consola» se hizo con Chromium y `file://`, no en Edge ni Chrome de escritorio manualmente.

