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

## Fase 2 — Panel EBAR, temas y voz local (6 de octubre de 2026)

### Qué se hizo

1. **`vendor/ebar/`** con copias idénticas (verificadas byte a byte) de `panel-accesibilidad.js`, `voz-motor.js`, `panel-accesibilidad.css`, las fuentes Atkinson Hyperlegible Next y OpenDyslexic y sus dos licencias. `vendor/ebar/ORIGEN.md` registra la ruta de origen, la fecha y el SHA-256 de cada archivo. No se modificó nada de `vendor/`.
2. **Cabecera.** Se quitaron A−, A+, Alto contraste, Lectura automática y «Velocidad de la voz». Quedan «Accesibilidad» (con texto visible y `aria-keyshortcuts="Alt+A"`) y «Bitácora».
3. **`src/js/accesibilidad.js`** inicia el panel como indica el plan (misma clave `accesibilidad.preferencias`, las trece opciones, `bloquesSueltos`, `conBotonesEscuchar`, el botón «Accesibilidad» como disparador adicional y el texto «Botón «Escuchar» en cada respuesta»). `aplicar(estado)` fija el `font-size` de `<html>`, alterna `tipografia-legible` y muestra u oculta (`hidden`) los botones «Escuchar». El módulo exporta `iniciarAccesibilidad()` en lugar de iniciar el panel al importarlo, para poder iniciarlo después de la bienvenida en la fase 3.
4. **CSS.** `marca-earm.css` importa `panel-accesibilidad.css` (esbuild incrusta OpenDyslexic y, con `@font-face` propios, Atkinson), define los tokens `--a11y-*` de `inclu-ia/app.css` (líneas 14 a 23) con `html:root` y se reescribió con variables. `temas.css` define las cuatro variantes de la tabla del plan, una por `html[data-a11y-contraste]`, sin inversión de colores y sin `!important`. `panel-accesibilidad.css` no trae reglas para `data-a11y-contraste`, así que no hay duplicación. Las orbes solo se ven en `normal` y sin lectura facilitada. El botón principal de alto contraste lleva borde de 2 px del color del texto. Se eliminó el bloque `body.hc` y los tokens viejos.
5. **Lectura facilitada** (`chat.css`): ancho máximo de 65 caracteres en los textos de respuesta, 1,2 em entre párrafos y orbes ocultas. «Otras fuentes relacionadas» queda cerrado: nace cerrado y, al activar la opción, `accesibilidad.js` cierra los ya abiertos (la persona puede abrirlos a mano).
6. **Voz.** Se borró `speak()` y todo el código propio de `speechSynthesis` (el dictado por micrófono se conserva). El botón «Escuchar» de cada respuesta usa `hablar(fragmentos(frasesDe(articulo)))` del motor del EBAR, solo con voces locales. Sin voz local queda deshabilitado y muestra debajo el texto de la sección 6 («Sin voz local»). Los botones y el aviso llevan `data-a11y-omitir` para que no se lean.
7. **Preferencias propias.** `leerPreferencias()` y `guardarPreferencias()` usan la clave `asistente-docentes.preferencias` (perfil, lector externo, lectura automática), con `try/catch`. Aún no se usan: la fase 3 las llena.

### Resultado de las pruebas

`npm run prueba` (funcional) da lo mismo que la línea base:

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

Verificación de los criterios de aceptación con un script temporal (Playwright + axe-core, reglas `wcag2a`, `wcag2aa`, `wcag21aa` y `best-practice`): 39 comprobaciones, todas en verde después de la corrección descrita en la decisión 6.

- El panel abre con el botón flotante, con el botón «Accesibilidad» y con Alt + A. Escape lo cierra y el foco vuelve al botón que lo abrió (flotante, «Accesibilidad» o la caja de pregunta).
- Las cuatro variantes (`normal`, `oscuro`, `alto`, `alto-oscuro`) con texto al 100 % y al 200 %, con una respuesta de pasaje con tabla y otra «No encontrado»: cero violaciones de axe en las respuestas, con el panel abierto y con la bitácora abierta.
- Los botones «Escuchar» aparecen solo con la opción activa y se ocultan al apagarla.
- Sin errores de consola y **sin ninguna solicitud externa** (ya no se carga Google Fonts); la fuente Atkinson carga desde el archivo.
- Lectura real: este equipo tiene 3 voces locales en español (por ejemplo, Microsoft Helena). Al pulsar «Escuchar» el motor encola la lectura de la respuesta con esa voz y el botón queda `aria-pressed="true"`; al pulsarlo otra vez se detiene.
- Con una sola voz en línea (`localService: false`) el interruptor del panel queda deshabilitado. El aviso por respuesta se prueba a fondo en la fase 5.

### Diferencias, decisiones y dudas (requieren su revisión)

1. **Tipografía.** El plan manda copiar Atkinson Hyperlegible Next pero no dice cuál es la fuente del asistente, y v0.1 usaba Plus Jakarta Sans y JetBrains Mono desde Google Fonts. Para cumplir la regla 7 (sin internet) usé Atkinson como tipografía del asistente (la del EBAR) y una pila monoespaciada del sistema para `.mono`, y quité los enlaces a Google Fonts. Plus Jakarta Sans no está disponible localmente para incrustarla. **Pendiente: confirmar Atkinson o indicar los archivos de Plus Jakarta Sans.**
2. **Código del plan para la voz.** El plan pasa `voz: vozPreferida(estado.voz)` a `hablar`, pero `hablar` espera el identificador de la voz (`voiceURI`) y la resuelve él mismo. Con el objeto, ignoraría la voz elegida en el panel y usaría siempre la primera. Pasé `estado.voz`, como hace el propio panel.
3. **Espaciado, altura de línea y tipografía legible.** El plan no define su CSS: el panel solo publica `data-a11y-espaciado` y `data-a11y-interlineado`, y `aplicar` solo alterna la clase `tipografia-legible`. Copié las reglas equivalentes de `inclu-ia/app.css` (usan `!important` y excluyen el panel). Sin ellas esas tres opciones no harían nada y los perfiles de la fase 3 no tendrían efecto.
4. **Panel claro en las variantes oscuras.** Como el plan manda los tokens `--a11y-*` con valores fijos claros, el panel sigue claro aunque la página esté en `oscuro` o `alto-oscuro` (pasa axe). Si prefiere que siga el tema, bastaría asignar esas variables desde `temas.css`.
5. **Colores de `normal`.** Con la tabla del plan, el texto pasa de `#424242` a `#2C2C2C` y los bordes a `#D6D6D6`, y las superficies translúcidas con desenfoque pasan a colores sólidos. Los campos de formulario usan `--texto-secundario` como borde para cumplir el contraste de componentes (3:1).
6. **Cambios mínimos fuera del plan.** El contenedor con desplazamiento de la bitácora (`.dlg-b`) ahora es una región enfocable (`tabindex="0"`, `role="region"`), porque axe lo marcaba (`scrollable-region-focusable`) con el texto al 200 %. El formulario deja un margen a la derecha (en ventanas de hasta 1320 px) para que el botón flotante no tape «Enviar». El icono del logo usa `currentColor`.
7. **Lectura automática.** Su botón de la cabecera se eliminó y la opción vuelve en la fase 3 (bienvenida), así que en esta fase las respuestas nuevas no se leen solas. `addBot` sigue recibiendo el parámetro `speech`, que ya no usa.
8. **Qué lee «Escuchar».** `frasesDe` omite lo que no se ve, de modo que el texto de un desplegable cerrado («Ver texto oficial completo») no se lee. El plan no pide otra cosa; queda anotado por si quiere que se lea completo.
9. La versión visible sigue en `v0.1` (cambia en la fase 6).
