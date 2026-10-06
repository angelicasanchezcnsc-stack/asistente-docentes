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

## Fase 3 — Bienvenida de accesibilidad con perfiles (6 de octubre de 2026)

Decisión de la persona responsable al cerrar la fase 2: se confirma Atkinson Hyperlegible Next como tipografía del asistente.

### Qué se hizo

1. **Diálogo de bienvenida** (`<dialog>` nativo modal en `src/index.html`, lógica en `src/js/bienvenida.js`), con el título «Antes de empezar: ajuste el asistente a su medida» y un solo diálogo con cuatro grupos, cada uno con su encabezado «Paso N de 4»:
   - **Paso 1. Perfil:** `fieldset` con los nueve perfiles como botones de opción; cada uno muestra el nombre y, debajo, la descripción (enlazada con `aria-describedby`).
   - **Paso 2. Lector de pantalla:** casilla «Uso un lector de pantalla (JAWS, NVDA, VoiceOver o TalkBack)» y casilla «Leer en voz alta cada respuesta nueva», que se deshabilita y se desmarca con la primera y muestra el texto «Lector externo» de la sección 6.
   - **Paso 3. Presentación:** el texto fijo del paso 3 y la lista, en texto, de los ajustes del perfil elegido (se actualiza al cambiar de perfil).
   - **Paso 4. Atajos de teclado:** lista de definición con Tab, Shift + Tab, Enter, Escape, Alt + A y Alt + 1.
   - Casilla «Recordar mis preferencias en este equipo» (marcada por defecto) y botones «Guardar y empezar» y «Omitir».
2. **Guardado.** Al guardar se combina el preajuste del perfil con lo que haya en `localStorage['accesibilidad.preferencias']` (o con `PREDETERMINADO` del panel), se escribe en esa clave y **después** se inicia el panel. Perfil, lector externo, lectura automática y la marca de bienvenida vista se guardan en `asistente-docentes.preferencias` (en `sessionStorage` si «Recordar» está desmarcado).
3. **Botón «Perfil»** en la cabecera: abre el mismo diálogo con el perfil actual elegido. Al guardar, escribe el nuevo estado, guarda en `sessionStorage` las preguntas hechas (con la entidad elegida al hacer cada una), recarga y vuelve a responderlas en el mismo orden sin leerlas en voz alta ni registrarlas otra vez en la bitácora. Anuncia «Se aplicó el perfil {nombre}.»
4. **Lector externo marcado:** se desactiva la lectura automática y no se ofrece. Los botones «Escuchar» siguen disponibles si se activan en el panel.
5. **Lectura automática marcada:** al aparecer una respuesta nueva se lee con el motor del EBAR el bloque «En pocas palabras» (o «Lo más relevante», o el primer párrafo de las respuestas «Depende de su entidad» y «No encontrado») y la línea de la fuente. La bienvenida del chat nunca se lee sola.
6. **Alt + 1** lleva a la caja de pregunta (`aria-keyshortcuts` en la caja).
7. **Estilos** de la bienvenida en `chat.css` (tarjetas de perfil con borde grueso y círculo marcado, nunca solo el color; teclas con `<kbd>`).

Perfiles y preajustes: los de la tabla del plan, sin cambios (Visual, Auditivo, Físico, Intelectual, Psicosocial, Sordoceguera, Múltiple, Adulto mayor y Sin preferencia). Lectura automática sugerida: Visual y Adulto mayor.

### Resultado de las pruebas

`npm run prueba` ahora ejecuta la prueba funcional y la nueva `pruebas/perfiles.mjs`:

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
OK    el diálogo se abre en la primera visita
OK    título del diálogo
OK    cuatro pasos con su encabezado
OK    nueve perfiles
OK    foco inicial en el primer perfil
OK    flecha abajo elige el siguiente perfil
OK    el panel aún no se inició (va después del diálogo)
OK    con Tab se llega a todos los controles
OK    Escape cierra el diálogo
OK    al cerrar, el foco va a la caja de pregunta
OK    Escape no cambia el panel
OK    Escape deja registrada la bienvenida y no guarda perfil
OK    el panel se inicia tras cerrar
OK    no vuelve a abrirse
OK    sin errores de consola (diálogo y Escape)
OK    Visual: lista de ajustes en texto
OK    Visual: lectura automática sugerida
OK    Visual: preajuste del panel
OK    Visual: perfil y lectura automática guardados
OK    Visual: el panel arranca con el preajuste aplicado
OK    Visual: foco en la caja de pregunta
OK    Visual: sin errores de consola
OK    Auditivo: lista de ajustes en texto
OK    Auditivo: lectura automática sugerida
OK    Auditivo: preajuste del panel
OK    Auditivo: perfil y lectura automática guardados
OK    Auditivo: el panel arranca con el preajuste aplicado
OK    Auditivo: foco en la caja de pregunta
OK    Auditivo: sin errores de consola
OK    Físico: lista de ajustes en texto
OK    Físico: lectura automática sugerida
OK    Físico: preajuste del panel
OK    Físico: perfil y lectura automática guardados
OK    Físico: el panel arranca con el preajuste aplicado
OK    Físico: foco en la caja de pregunta
OK    Físico: sin errores de consola
OK    Intelectual: lista de ajustes en texto
OK    Intelectual: lectura automática sugerida
OK    Intelectual: preajuste del panel
OK    Intelectual: perfil y lectura automática guardados
OK    Intelectual: el panel arranca con el preajuste aplicado
OK    Intelectual: foco en la caja de pregunta
OK    Intelectual: sin errores de consola
OK    Psicosocial: lista de ajustes en texto
OK    Psicosocial: lectura automática sugerida
OK    Psicosocial: preajuste del panel
OK    Psicosocial: perfil y lectura automática guardados
OK    Psicosocial: el panel arranca con el preajuste aplicado
OK    Psicosocial: foco en la caja de pregunta
OK    Psicosocial: sin errores de consola
OK    Sordoceguera: lista de ajustes en texto
OK    Sordoceguera: lectura automática sugerida
OK    Sordoceguera: preajuste del panel
OK    Sordoceguera: perfil y lectura automática guardados
OK    Sordoceguera: el panel arranca con el preajuste aplicado
OK    Sordoceguera: foco en la caja de pregunta
OK    Sordoceguera: sin errores de consola
OK    Múltiple: lista de ajustes en texto
OK    Múltiple: lectura automática sugerida
OK    Múltiple: preajuste del panel
OK    Múltiple: perfil y lectura automática guardados
OK    Múltiple: el panel arranca con el preajuste aplicado
OK    Múltiple: foco en la caja de pregunta
OK    Múltiple: sin errores de consola
OK    Adulto mayor: lista de ajustes en texto
OK    Adulto mayor: lectura automática sugerida
OK    Adulto mayor: preajuste del panel
OK    Adulto mayor: perfil y lectura automática guardados
OK    Adulto mayor: el panel arranca con el preajuste aplicado
OK    Adulto mayor: foco en la caja de pregunta
OK    Adulto mayor: sin errores de consola
OK    Sin preferencia: lista de ajustes en texto
OK    Sin preferencia: lectura automática sugerida
OK    Sin preferencia: preajuste del panel
OK    Sin preferencia: perfil y lectura automática guardados
OK    Sin preferencia: el panel arranca con el preajuste aplicado
OK    Sin preferencia: foco en la caja de pregunta
OK    Sin preferencia: sin errores de consola
OK    el preajuste se combina con el estado previo
OK    Visual sugiere lectura automática
OK    el aviso del lector externo está oculto
OK    con lector externo, la lectura automática se deshabilita y desmarca
OK    aviso del lector externo con el texto del plan
OK    cambiar de perfil no reactiva la lectura con lector externo
OK    axe con el diálogo abierto y lector externo
OK    lector externo guardado y lectura automática apagada
OK    con lector externo no se lee en voz alta
OK    sin recordar, las preferencias van a sessionStorage
OK    en la misma sesión no vuelve a abrirse
OK    la bienvenida no se lee sola al cargar
OK    lee el bloque «En pocas palabras» y la fuente
OK    Alt + 1 lleva a la caja de pregunta
OK    «Perfil» abre el diálogo
OK    la conversación se conserva idéntica tras el cambio de perfil
OK    las preguntas del usuario se conservan
OK    el estado del panel tiene el perfil Físico
OK    se anuncia «Se aplicó el perfil Físico.»
OK    la bitácora no se duplica
OK    sin errores de consola en el cambio de perfil
OK    Escape en «Perfil» devuelve el foco al botón «Perfil»
OK    axe con la bienvenida abierta (normal, 100 %)
OK    axe con la bienvenida abierta (normal, 200 %)
OK    axe con la bienvenida abierta (oscuro, 100 %)
OK    axe con la bienvenida abierta (oscuro, 200 %)
OK    axe con la bienvenida abierta (alto, 100 %)
OK    axe con la bienvenida abierta (alto, 200 %)
OK    axe con la bienvenida abierta (alto-oscuro, 100 %)
OK    axe con la bienvenida abierta (alto-oscuro, 200 %)

Perfiles y bienvenida: 108 OK, 0 con diferencias
```

La prueba de perfiles (108 comprobaciones en verde) cubre:

- El diálogo se abre una sola vez, con el título y los cuatro encabezados del plan, y los nueve perfiles. El foco inicial está en el primer perfil. Las flechas cambian de perfil y con Tab se llega a todos los controles.
- Escape equivale a «Omitir»: cierra, no cambia el panel, deja registrada la bienvenida, no vuelve a abrirse al recargar y el foco va a la caja de pregunta.
- **Una prueba por perfil:** el estado que queda en `accesibilidad.preferencias` es exactamente el predeterminado más el preajuste del perfil (nada más cambia), el panel arranca con ese preajuste aplicado (atributos `data-a11y-*` y tamaño de texto), la lista de ajustes en texto tiene el número de entradas esperado y la lectura automática sugerida coincide con la tabla.
- Combinación con un estado previo del panel (lo que no aparece en el preajuste queda como esté).
- Lector externo: deshabilita y desmarca la lectura automática, muestra el texto de la sección 6, no se reactiva al cambiar de perfil y no se lee nada en voz alta.
- «Recordar» desmarcado: las preferencias van a `sessionStorage`.
- Lectura automática (perfil Visual): no lee la bienvenida al cargar; al responder lee el bloque «En pocas palabras» y la fuente.
- Alt + 1.
- Cambio de perfil con el botón «Perfil»: tras recargar, la conversación de tres respuestas (pregunta frecuente, «No encontrado» y entidad detectada) es idéntica (tipo, fuente principal y entidad), las tres preguntas siguen en pantalla, la bitácora no se duplica, se anuncia «Se aplicó el perfil Físico.» y Escape en ese diálogo devuelve el foco al botón «Perfil».
- axe (`wcag2a`, `wcag2aa`, `wcag21aa`, `best-practice`) con el diálogo abierto en las cuatro variantes de contraste, con texto al 100 % y al 200 %, y con lector externo marcado: cero violaciones.

### Diferencias, decisiones y dudas (requieren su revisión)

1. **Clave de la bienvenida.** El plan dice que la primera visita es cuando «no existe `asistente-docentes.preferencias.bienvenida`». Lo implementé como la propiedad `bienvenida` dentro del objeto guardado en `asistente-docentes.preferencias` (no como una clave de almacenamiento aparte). «Omitir» y Escape también la marcan, para que el diálogo se abra una sola vez.
2. **«Recordar» desmarcado y el estado del panel.** El plan manda guardar el estado combinado en `localStorage['accesibilidad.preferencias']`, que es la única clave que lee el panel (y no se puede cambiar sin modificar `vendor/`). Por eso, con «Recordar» desmarcado, solo las preferencias del asistente (perfil, lector externo, lectura automática, bienvenida vista) van a `sessionStorage`; la presentación del panel queda en `localStorage` como hace el propio panel con cada cambio. ¿Aceptable, o prefiere otro tratamiento?
3. **Textos de interfaz nuevos**, porque el plan no los trae: los encabezados «Paso 1 de 4. Perfil», «Paso 2 de 4. Lector de pantalla», «Paso 3 de 4. Presentación» y «Paso 4 de 4. Atajos de teclado»; la frase «Este perfil no cambia ningún ajuste: queda la presentación que ya tiene.» (para Auditivo y Sin preferencia, que no tienen preajuste); y las descripciones de Tab, Shift + Tab, Enter y Escape (adaptadas del bloque de atajos de Lexible: «Avanzar al siguiente elemento», «Retroceder al elemento anterior», «Activar un botón o enviar la pregunta», «Cerrar este cuadro o el panel de accesibilidad»). Alt + A y Alt + 1 usan los textos del plan.
4. **Sin perfil elegido.** En la primera visita ningún perfil viene marcado (para que el foco inicial caiga en el primero, como pide el plan). Si se guarda sin elegir, queda «Sin preferencia».
5. **Lectura sugerida.** Cada vez que se elige un perfil en el diálogo, la casilla de lectura automática toma la sugerencia de ese perfil (si no hay lector externo); la persona puede cambiarla después.
6. **Foco al cerrar.** En la primera visita el foco va a la caja de pregunta, como pide el plan. Cuando el diálogo se abre con el botón «Perfil» y se cierra con Escape u «Omitir», devuelve el foco a ese botón (práctica habitual de los diálogos).
7. **Conversación tras el cambio de perfil.** Se conserva el texto de las respuestas y su orden, pero no el estado de los botones «Me sirvió» y «No me sirvió» ni el desplegable abierto, porque las respuestas se vuelven a dibujar.
8. **Pruebas.** `pruebas/funcional.mjs` ahora da por vista la bienvenida (siembra `bienvenida: true` antes de cargar), porque el diálogo modal bloquearía la caja de pregunta. `pruebas/perfiles.mjs` es un archivo nuevo que no está en la estructura del plan; la fase 5 puede integrarlo en `accesibilidad.mjs`.
9. **Bienvenida del chat.** El mensaje «Hola. Respondo preguntas…» sigue siendo el de v0.1; no tiene `data-tipo`, así que ninguna prueba lo cuenta como respuesta.

## Fase 4 — Tablas, glosario, temas reservados e impresión (6 de octubre de 2026)

### Qué se hizo

**4.1 Tablas accesibles** (`respuestas.js`). Si la línea «TABLA No. N» precede a una tabla, con o sin la línea de título en mayúsculas entre las dos, se usa como `<caption>` («TABLA No. 1: TOTAL DE EMPLEOS Y VACANTES…») y deja de salir como párrafo. Los encabezados llevan `th scope="col"`. Cada tabla va dentro de un contenedor que se desplaza por su cuenta (`div.tabla-scroll`, enfocable con teclado y con nombre), en lugar del `display:block` de v0.1, que quita la semántica de tabla en algunos navegadores. La lectura fila por fila la hace `frasesDe` del motor del EBAR: la voz dice «Tabla: TABLA número 1: … 19 filas y 3 columnas. Fila 1. EMPLEOS: DIRECTIVO DOCENTE. CARGOS: Coordinador. VACANTES: 87. Fila 2. …».

**4.2 Glosario literal.**
- `herramientas/glosario.json` con las siete entradas del plan y `buildkb.py` ampliado: une las partes de cada rótulo del anexo, quita las líneas «(continuación)», aplica la regla (`oracion_con` o `desde`/`hasta`) y guarda `glosario` en `kb.json` con `termino`, `variantes`, `fuente` y `definicion`. Si una regla no encuentra su marcador, el script termina con un error que dice cuál. El resto de `kb.json` quedó idéntico (comprobado por comparación con la versión anterior).
- Interfaz (`src/js/glosario.js`): la primera aparición de cada término en cada respuesta se vuelve un botón (`button.glosario-termino`, subrayado punteado) que abre un `<dialog>` con el término como título, la definición y «Fuente: Proyecto de Anexo Técnico Docentes 2026, Numeral N» con la etiqueta «Borrador». Al cerrar (botón o Escape) el foco vuelve al término. No se enlazan términos en encabezados de tabla, en botones, enlaces ni en el propio diálogo. Los términos de varias palabras se reconocen aunque el resaltado de la búsqueda los parta en varias marcas, y sin distinguir mayúsculas.

**4.3 Temas en reserva de Sala Plena.**
- `herramientas/temas_reservados.json` como en el plan; `src/js/reservados.js` normaliza la pregunta (sin tildes, minúsculas) y exige un término del `grupo_a` y uno del `grupo_b` como palabra o frase completa. Si coinciden, la respuesta es el mensaje de la sección 6 con `data-tipo="tema-reservado"`, sin fuente, y se registra en la bitácora con motivo «Tema reservado».
- Se excluyen del índice y de las fuentes de las preguntas frecuentes los pasajes cuyo texto cumple `excluir_pasajes_con` (sin distinguir mayúsculas). Cantidad y rótulos, más abajo.

**4.4 Nota de validez.** Cierra el bloque «Texto oficial» de las respuestas de pregunta frecuente y de pasaje (texto secundario, `p.nota-validez`).

**4.5 Imprimir.** Botón «Imprimir» en cada respuesta: pone la clase `imprimiendo` en el `<article>` y `imprimiendo-respuesta` en `<html>`, abre sus desplegables, llama a `window.print()` y lo restablece en `afterprint`. `src/css/impresion.css` oculta cabecera, panel, diálogos, aviso, panel lateral, formulario, pie, botones y las demás respuestas, y fija texto negro sobre blanco con tablas completas.

### Definiciones del glosario extraídas (para su revisión)

**1. OPEC** (Proyecto de Anexo Técnico, Numeral 1.1). Variantes: «OPEC».

```
a) Es de su exclusiva responsabilidad consultar en el Sistema de Apoyo para la Igualdad, el Mérito y la Oportunidad, en adelante SIMO, de la Comisión Nacional del Servicio Civil, en adelante CNSC, las vacantes a proveer mediante este proceso de selección, a partir de la fecha de inicio de la etapa de divulgación de la respectiva Oferta Pública de Empleos de Carrera, en adelante OPEC, cuyo contenido consta en el artículo 8 y cuya divulgación se rige por el artículo 9 del Acuerdo del Proceso de Selección.
```

**2. SIMO** (Proyecto de Anexo Técnico, Numeral 1.1). Variantes: «SIMO».

```
a) Es de su exclusiva responsabilidad consultar en el Sistema de Apoyo para la Igualdad, el Mérito y la Oportunidad, en adelante SIMO, de la Comisión Nacional del Servicio Civil, en adelante CNSC, las vacantes a proveer mediante este proceso de selección, a partir de la fecha de inicio de la etapa de divulgación de la respectiva Oferta Pública de Empleos de Carrera, en adelante OPEC, cuyo contenido consta en el artículo 8 y cuya divulgación se rige por el artículo 9 del Acuerdo del Proceso de Selección.
```

**3. Educación formal** (Proyecto de Anexo Técnico, Numeral 4.1.1). Variantes: «educación formal».

```
i) Educación Formal: Son los conocimientos académicos adquiridos en instituciones públicas o privadas, debidamente reconocidas por el Gobierno Nacional, correspondientes a programas de normalista superior otorgado por una de las Escuelas Normales Superiores transformada y acreditada por el Ministerio de Educación Nacional, Licenciaturas en Educación, programas de profesionales en alguno de los títulos habilitados para ejercer la función docente, de acuerdo con el Manual de Funciones, Requisitos y Competencias para los cargos de Docentes y Directivos Docentes del sistema especial de carrera docente de que trata la Resolución No. 003842 de 2022, expedida por el Ministerio de Educación Nacional o la norma que lo modifique. También la educación formal se acredita con los títulos académicos de los programas de posgrado en las modalidades de especialización, maestría y doctorado.
Los títulos otorgados por una institución de educación extranjera deberán acreditarse debidamente convalidados ante el Ministerio de Educación Nacional, de acuerdo con lo previsto en el artículo 2.4.6.3.5 del Decreto 1075 de 2015.
```

**4. Educación continua** (Proyecto de Anexo Técnico, Numeral 4.1.1). Variantes: «educación continua», «formación continua».

```
ii) Educación Continua: Son los conocimientos académicos adquiridos por el aspirante a través de cursos de formación pedagógica, didáctica o gestión educativa ofrecidos por instituciones educativas debidamente autorizadas para ello, o la formación que realiza el educador en su puesto de trabajo como producto de la ejecución de planes de mejoramiento de la calidad educativa que desarrolla el Ministerio de Educación Nacional, las Secretarías de Educación o las mismas instituciones educativas. Esta formación continua debe haberse desarrollado durante los últimos cinco (5) años y la certificación correspondiente debe indicar que cada curso se desarrolló con una intensidad mayor a 100 horas o 4 créditos académicos.
```

**5. Experiencia directiva docente** (Proyecto de Anexo Técnico, Numeral 4.1.1). Variantes: «experiencia directiva docente».

```
iii) Experiencia Directiva Docente: Es la experiencia profesional de reconocida trayectoria educativa adquirida en alguno de los cargos directivos docentes señalados en los artículos 129 de la Ley 115 de 1994 o 6 del Decreto Ley 1278 de 2002, la cual se reconoce a partir del ejercicio efectivo de las funciones del cargo directivo docente.
```

**6. Experiencia docente** (Proyecto de Anexo Técnico, Numeral 4.1.1). Variantes: «experiencia docente».

```
iv) Experiencia Docente: Es la adquirida en el ejercicio de las actividades de divulgación del conocimiento obtenida en instituciones educativas debidamente reconocidas. (Artículo 2.2.2.3.7 Decreto 1083 de 2015)
```

**7. Experiencia en otros cargos** (Proyecto de Anexo Técnico, Numeral 4.1.1). Variantes: «experiencia en otros cargos».

```
v) Experiencia en otros cargos: Es la experiencia profesional en el ejercicio de cargos en que se hayan cumplido funciones de administración de personal, de finanzas o de planeación en instituciones educativas oficiales o privadas de cualquier nivel educativo, la cual se asume como requisito para quienes aspiren a cargos de directivos docentes. Para efectos de la valoración de antecedentes esta experiencia se tomará en cuenta si tiene relación con el desarrollo proyectos educativos y pedagógicos, programas de mejoramiento de la calidad educativa o gestión educativa.
```

### Pasajes excluidos por `excluir_pasajes_con`

- **Anexo técnico:** 1 pasaje: Numeral 1.1 (parte 2), el literal d) que trae «1,32 UVT» y «valor en pesos».
- **Acuerdos:** Artículo 6 y Artículo 6, Parágrafo tercero, que coinciden en los 90 acuerdos (180 pasajes), y 1 pasaje más de un solo acuerdo (Artículo Segundo, parte 12). Como texto común quedan excluidos Artículo 6 y Artículo 6, Parágrafo tercero (cada uno común a 90 de 90 acuerdos). Ningún acuerdo trae SMDLV ni «salario mínimo»; la regla de «unidad de valor» no coincide con ninguno.
- Efecto en las preguntas frecuentes: ninguna de las doce perdió su fuente principal. «¿Las personas con discapacidad pagan la inscripción?» ya no muestra el Artículo 6, Parágrafo tercero entre sus fuentes secundarias.

### Resultado de las pruebas

`npm run prueba` ahora ejecuta tres archivos: la funcional (con `fase_actual: 4`, así que los 16 casos), `perfiles.mjs` y la nueva `pruebas/tablas_glosario.mjs`.

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
     tipo=faq | principal=Artículo 6, Parágrafo primero | fuentes=Artículo 6, Parágrafo primero | Numeral 1.2.5 | Numeral 1.1 | entidad=
11 OK      quién gana el mundial de fútbol
     tipo=no-encontrado | principal= | fuentes= | entidad=
12 OK      cuánto cuesta la inscripción
     tipo=tema-reservado | principal= | fuentes= | entidad=
13 OK      cuál es el valor de los derechos de participación
     tipo=tema-reservado | principal= | fuentes= | entidad=
14 OK      ¿Cómo pago los derechos de participación?
     tipo=faq | principal=Numeral 1.2.5 | fuentes=Numeral 1.2.5 | Numeral 1.2.6 | Numeral 1.2.6 | entidad=
15 OK      ¿qué es la OPEC?
     tipo=faq | principal=Artículo 8, Parágrafo quinto | fuentes=Artículo 8, Parágrafo quinto | Numeral 1.2.5 | Numeral 1.2.7 | Artículo 8, Parágrafo tercero | entidad=
16 OK      ¿Qué pruebas se aplican y cuánto vale cada una?
     tipo=faq | principal=Artículo 13 | fuentes=Artículo 13 | Numeral 2.2 | Artículo 13, Parágrafo tercero | entidad=

Fase 4: 16 OK, 0 con diferencias, 0 omitidos
OK    el diálogo se abre en la primera visita
OK    título del diálogo
OK    cuatro pasos con su encabezado
OK    nueve perfiles
OK    foco inicial en el primer perfil
OK    flecha abajo elige el siguiente perfil
OK    el panel aún no se inició (va después del diálogo)
OK    con Tab se llega a todos los controles
OK    Escape cierra el diálogo
OK    al cerrar, el foco va a la caja de pregunta
OK    Escape no cambia el panel
OK    Escape deja registrada la bienvenida y no guarda perfil
OK    el panel se inicia tras cerrar
OK    no vuelve a abrirse
OK    sin errores de consola (diálogo y Escape)
OK    Visual: lista de ajustes en texto
OK    Visual: lectura automática sugerida
OK    Visual: preajuste del panel
OK    Visual: perfil y lectura automática guardados
OK    Visual: el panel arranca con el preajuste aplicado
OK    Visual: foco en la caja de pregunta
OK    Visual: sin errores de consola
OK    Auditivo: lista de ajustes en texto
OK    Auditivo: lectura automática sugerida
OK    Auditivo: preajuste del panel
OK    Auditivo: perfil y lectura automática guardados
OK    Auditivo: el panel arranca con el preajuste aplicado
OK    Auditivo: foco en la caja de pregunta
OK    Auditivo: sin errores de consola
OK    Físico: lista de ajustes en texto
OK    Físico: lectura automática sugerida
OK    Físico: preajuste del panel
OK    Físico: perfil y lectura automática guardados
OK    Físico: el panel arranca con el preajuste aplicado
OK    Físico: foco en la caja de pregunta
OK    Físico: sin errores de consola
OK    Intelectual: lista de ajustes en texto
OK    Intelectual: lectura automática sugerida
OK    Intelectual: preajuste del panel
OK    Intelectual: perfil y lectura automática guardados
OK    Intelectual: el panel arranca con el preajuste aplicado
OK    Intelectual: foco en la caja de pregunta
OK    Intelectual: sin errores de consola
OK    Psicosocial: lista de ajustes en texto
OK    Psicosocial: lectura automática sugerida
OK    Psicosocial: preajuste del panel
OK    Psicosocial: perfil y lectura automática guardados
OK    Psicosocial: el panel arranca con el preajuste aplicado
OK    Psicosocial: foco en la caja de pregunta
OK    Psicosocial: sin errores de consola
OK    Sordoceguera: lista de ajustes en texto
OK    Sordoceguera: lectura automática sugerida
OK    Sordoceguera: preajuste del panel
OK    Sordoceguera: perfil y lectura automática guardados
OK    Sordoceguera: el panel arranca con el preajuste aplicado
OK    Sordoceguera: foco en la caja de pregunta
OK    Sordoceguera: sin errores de consola
OK    Múltiple: lista de ajustes en texto
OK    Múltiple: lectura automática sugerida
OK    Múltiple: preajuste del panel
OK    Múltiple: perfil y lectura automática guardados
OK    Múltiple: el panel arranca con el preajuste aplicado
OK    Múltiple: foco en la caja de pregunta
OK    Múltiple: sin errores de consola
OK    Adulto mayor: lista de ajustes en texto
OK    Adulto mayor: lectura automática sugerida
OK    Adulto mayor: preajuste del panel
OK    Adulto mayor: perfil y lectura automática guardados
OK    Adulto mayor: el panel arranca con el preajuste aplicado
OK    Adulto mayor: foco en la caja de pregunta
OK    Adulto mayor: sin errores de consola
OK    Sin preferencia: lista de ajustes en texto
OK    Sin preferencia: lectura automática sugerida
OK    Sin preferencia: preajuste del panel
OK    Sin preferencia: perfil y lectura automática guardados
OK    Sin preferencia: el panel arranca con el preajuste aplicado
OK    Sin preferencia: foco en la caja de pregunta
OK    Sin preferencia: sin errores de consola
OK    el preajuste se combina con el estado previo
OK    Visual sugiere lectura automática
OK    el aviso del lector externo está oculto
OK    con lector externo, la lectura automática se deshabilita y desmarca
OK    aviso del lector externo con el texto del plan
OK    cambiar de perfil no reactiva la lectura con lector externo
OK    axe con el diálogo abierto y lector externo
OK    lector externo guardado y lectura automática apagada
OK    con lector externo no se lee en voz alta
OK    sin recordar, las preferencias van a sessionStorage
OK    en la misma sesión no vuelve a abrirse
OK    la bienvenida no se lee sola al cargar
OK    lee el bloque «En pocas palabras» y la fuente
OK    Alt + 1 lleva a la caja de pregunta
OK    «Perfil» abre el diálogo
OK    la conversación se conserva idéntica tras el cambio de perfil
OK    las preguntas del usuario se conservan
OK    el estado del panel tiene el perfil Físico
OK    se anuncia «Se aplicó el perfil Físico.»
OK    la bitácora no se duplica
OK    sin errores de consola en el cambio de perfil
OK    Escape en «Perfil» devuelve el foco al botón «Perfil»
OK    axe con la bienvenida abierta (normal, 100 %)
OK    axe con la bienvenida abierta (normal, 200 %)
OK    axe con la bienvenida abierta (oscuro, 100 %)
OK    axe con la bienvenida abierta (oscuro, 200 %)
OK    axe con la bienvenida abierta (alto, 100 %)
OK    axe con la bienvenida abierta (alto, 200 %)
OK    axe con la bienvenida abierta (alto-oscuro, 100 %)
OK    axe con la bienvenida abierta (alto-oscuro, 200 %)

Perfiles y bienvenida: 108 OK, 0 con diferencias
OK    la respuesta de vacantes tiene <caption> en sus tablas
OK    el título lleva «TABLA No. N» y el título en mayúsculas
OK    «TABLA No.» no se repite como párrafo
OK    encabezados con th scope="col"
OK    cada tabla en su contenedor desplazable enfocable
OK    la voz anuncia la tabla con su título y tamaño
OK    la voz lee cada fila con su encabezado («Fila 1…», «Vacantes: …»)
OK    sin errores de consola (tablas)
OK    «¿qué es la OPEC?» trae el botón de glosario «OPEC»
OK    cada término aparece como botón una sola vez en la respuesta
OK    el glosario abre un diálogo con el término como título
OK    la definición es literal (la misma de kb.json)
OK    fuente con la etiqueta Borrador
OK    axe con el glosario abierto
OK    Escape cierra el glosario y el foco vuelve al término
OK    «Cerrar» también devuelve el foco al término
OK    los términos son botones y se activan con teclado
OK    sin errores de consola (glosario)
OK    términos de varias palabras (experiencia directiva docente, docente, en otros cargos)
OK    el glosario de «Experiencia directiva docente» muestra su definición literal
OK    el glosario trae las siete entradas
OK    definición literal de «OPEC»
OK    definición literal de «SIMO»
OK    definición literal de «Educación formal»
OK    definición literal de «Educación continua»
OK    definición literal de «Experiencia directiva docente»
OK    definición literal de «Experiencia docente»
OK    definición literal de «Experiencia en otros cargos»
OK    «cuánto cuesta la inscripción» → tema reservado
OK    sin fuente
OK    mensaje de la sección 6
OK    registrado en la bitácora con motivo «Tema reservado»
OK    «¿Cómo pago los derechos de participación?» → faq
OK    «¿Las personas con discapacidad pagan la inscripción?» → faq
OK    «¿Qué pruebas se aplican y cuánto vale cada una?» → faq
OK    «cual es la tarifa de inscripcion» → tema-reservado
OK    «cuántos pesos cuesta participar en el concurso» → tema-reservado
OK    «cuántas personas se inscribieron» → no bloqueada
OK    ninguna respuesta muestra pasajes con UVT ni «valor en pesos»
OK    FAQ: la nota de validez cierra el bloque «Texto oficial»
OK    pasaje: la nota de validez cierra el bloque «Texto oficial»
OK    «No encontrado» no lleva nota de validez
OK    «Imprimir» llama a imprimir con la clase temporal en la respuesta
OK    los desplegables de esa respuesta se abren para imprimir
OK    al imprimir solo se ve esa respuesta (sin cabecera, panel, formulario, pie ni botones)
OK    texto negro sobre blanco y tablas completas
OK    tras imprimir se restablece la pantalla
OK    axe con tabla, glosario y tema reservado (normal, 100 %)
OK    axe con el glosario abierto (normal, 100 %)
OK    axe con tabla, glosario y tema reservado (normal, 200 %)
OK    axe con el glosario abierto (normal, 200 %)
OK    axe con tabla, glosario y tema reservado (oscuro, 100 %)
OK    axe con el glosario abierto (oscuro, 100 %)
OK    axe con tabla, glosario y tema reservado (oscuro, 200 %)
OK    axe con el glosario abierto (oscuro, 200 %)
OK    axe con tabla, glosario y tema reservado (alto, 100 %)
OK    axe con el glosario abierto (alto, 100 %)
OK    axe con tabla, glosario y tema reservado (alto, 200 %)
OK    axe con el glosario abierto (alto, 200 %)
OK    axe con tabla, glosario y tema reservado (alto-oscuro, 100 %)
OK    axe con el glosario abierto (alto-oscuro, 100 %)
OK    axe con tabla, glosario y tema reservado (alto-oscuro, 200 %)
OK    axe con el glosario abierto (alto-oscuro, 200 %)

Tablas, glosario, temas reservados e impresión: 63 OK, 0 con diferencias
```

La prueba nueva (63 comprobaciones) cubre: el `<caption>` y los encabezados de la respuesta de vacantes; que «TABLA No.» no se repita como párrafo; la lectura de la voz fila por fila; el botón de glosario «OPEC» en «¿qué es la OPEC?» y que cada término aparezca una sola vez por respuesta; el diálogo (título, definición idéntica a `kb.json`, fuente con «Borrador», foco que vuelve al término con Escape y con «Cerrar»); que las siete definiciones son subcadenas literales del anexo; los casos de temas reservados (los dos que se bloquean, los tres que no, y otras formulaciones), la entrada en la bitácora con motivo «Tema reservado» y que ninguna respuesta muestre pasajes con UVT o «valor en pesos»; la nota de validez; la impresión (clase temporal, desplegables abiertos, con `emulateMedia('print')` solo se ve esa respuesta, texto negro sobre blanco, restablecimiento tras `afterprint`); y axe (`wcag2a`, `wcag2aa`, `wcag21aa`, `best-practice`) con tabla, glosario y tema reservado en pantalla, y con el glosario abierto, en las cuatro variantes de contraste, con texto al 100 % y al 200 %: cero violaciones.

### Diferencias, decisiones y dudas (requieren su revisión)

1. **OPEC y SIMO tienen la misma definición.** La regla `oracion_con` devuelve la oración completa que contiene el marcador y, en el numeral 1.1, «en adelante SIMO» y «en adelante OPEC» están en la misma oración (la del literal a), que además empieza con «a) Es de su exclusiva responsabilidad…»). Quedó literal, pero es una definición larga y compartida. Alternativa, si prefiere algo más breve: reglas `desde`/`hasta` distintas para cada una, con otros marcadores.
2. **Las definiciones llevan su enumerador** («i) Educación Formal: …», «iv) Experiencia Docente: …»), porque la regla `desde` incluye el marcador inicial. La de «Educación formal» tiene dos párrafos (el segundo, sobre los títulos de instituciones extranjeras, está antes de «ii) Educación Continua»).
3. **Mayúsculas en la exclusión.** El plan no dice si `excluir_pasajes_con` distingue mayúsculas; la apliqué sin distinguirlas (para que «Unidad de valor» o «Salario mínimo» también queden fuera). Con distinción de mayúsculas el resultado actual sería el mismo, porque no hay otras coincidencias.
4. **Texto «TABLA No.» en el título.** El plan dice que la línea anterior a la tabla empieza por «TABLA No.», pero en los datos van dos líneas («TABLA No. 1» y, debajo, el título en mayúsculas). Uní las dos con «: ». La voz dice «número» en lugar de «No.» (así lo pronuncia el motor del EBAR).
5. **Contenedor de las tablas.** Cada tabla queda en un `div` con `role="group"`, `tabindex="0"` y el título como nombre, para que se pueda desplazar con teclado sin romper la semántica de tabla. Suma una parada de tabulación por tabla.
6. **Mensaje de tema reservado.** El plan solo da el texto; le puse el encabezado «Tema reservado» (el nombre que usa la sección 6) y no lleva los botones «Me sirvió» ni «No me sirvió», como «No encontrado». `data-entidad` es la entidad elegida, o vacío.
7. **Términos dentro de desplegables cerrados.** Si la primera aparición de un término cae en un desplegable cerrado (por ejemplo, «Otras fuentes relacionadas»), el botón existe pero no se ve hasta abrirlo. No lo cambié.
8. **Impresión.** `afterprint` restablece la pantalla; en navegadores que no lo disparan, la respuesta queda con la clase hasta recargar. Probé la impresión con medios de impresión emulados y la generación de un PDF de una respuesta (2 páginas); no revisé una impresora real.
9. La versión visible sigue en `v0.1` (cambia en la fase 6).

## Fase 5 — Pruebas completas e informe (6 de octubre de 2026)

### Qué se hizo

1. **`pruebas/accesibilidad.mjs`** (Playwright + axe-core, reglas `wcag2a`, `wcag2aa`, `wcag21aa` y `best-practice`) con los cinco bloques del plan:
   - **axe:** las cuatro variantes de contraste × texto al 100 % y al 200 % × tres estados: respuestas en pantalla (pregunta frecuente, pasaje con tabla y «No encontrado», con los desplegables abiertos para que la tabla se vea), panel abierto y bienvenida abierta. En total, 24 combinaciones.
   - **Reflujo:** 320 px de ancho y texto al 200 % en las cuatro variantes, con respuestas en pantalla, con el panel abierto y con la bienvenida abierta. Criterio: `scrollWidth <= innerWidth + 1` (las tablas quedan fuera porque se desplazan en su propio contenedor); en el diálogo también se comprueba que no desborde por dentro.
   - **Teclado:** la primera parada de Tab es «Saltar a escribir la pregunta», Enter sobre ese enlace lleva a la caja de pregunta, Alt + 1, Enter envía, Alt + A abre el panel, Escape lo cierra devolviendo el foco, y Tab alcanza los controles principales.
   - **Voz:** con `getVoices()` simulado con una sola voz en español que no es local (`localService: false`), «Escuchar» queda deshabilitado con el aviso «Sin voz local» de la sección 6, y el panel deshabilita también su lectura; con una voz local que no es en español pasa lo mismo.
   - **Región viva:** `role="log"` (con `aria-live="polite"`, `aria-relevant="additions"` y nombre accesible) y cada respuesta nueva queda dentro.
2. **Informe.** Cada archivo de pruebas guarda sus resultados en `pruebas/resultados/*.json` (carpeta fuera de git) y `accesibilidad.mjs` genera `pruebas/INFORME_PRUEBAS.md` con: fecha, versión, resultado por caso funcional, axe por combinación, reflujo, teclado, voz, región viva, el resumen de las pruebas de perfiles y de tablas, y la lista de pruebas manuales pendientes (sección 8 del plan). `npm run prueba` ahora ejecuta los cuatro archivos en ese orden; `accesibilidad.mjs` va al final porque lee los resultados de los anteriores.

### Defectos que las pruebas encontraron y se corrigieron

1. **Reflujo a 320 px con texto al 200 %** (falló en las cuatro variantes): la columna de la cuadrícula con `1fr` crecía por el ancho mínimo de los selectores y la página llegaba a 679 px. Se cambió a `minmax(0, 1fr)` y se agregó `min-width: 0` a los elementos de la cuadrícula (`chat.css`).
2. **Primera parada de Tab en el botón «Copiar»** en lugar del enlace «Saltar a escribir la pregunta»: el `scrollIntoView` de la bienvenida del chat al cargar movía el punto de partida de la navegación por teclado. Ahora solo se desplazan las respuestas a preguntas, no la bienvenida (`respuestas.js`). Es comportamiento de v0.1, que no estaba cubierto por ninguna prueba.
3. La medición del panel falló una vez porque se midió durante su transición de entrada; la prueba espera ahora a que termine. No fue un defecto del producto.

### Resultado

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
     tipo=faq | principal=Artículo 6, Parágrafo primero | fuentes=Artículo 6, Parágrafo primero | Numeral 1.2.5 | Numeral 1.1 | entidad=
11 OK      quién gana el mundial de fútbol
     tipo=no-encontrado | principal= | fuentes= | entidad=
12 OK      cuánto cuesta la inscripción
     tipo=tema-reservado | principal= | fuentes= | entidad=
13 OK      cuál es el valor de los derechos de participación
     tipo=tema-reservado | principal= | fuentes= | entidad=
14 OK      ¿Cómo pago los derechos de participación?
     tipo=faq | principal=Numeral 1.2.5 | fuentes=Numeral 1.2.5 | Numeral 1.2.6 | Numeral 1.2.6 | entidad=
15 OK      ¿qué es la OPEC?
     tipo=faq | principal=Artículo 8, Parágrafo quinto | fuentes=Artículo 8, Parágrafo quinto | Numeral 1.2.5 | Numeral 1.2.7 | Artículo 8, Parágrafo tercero | entidad=
16 OK      ¿Qué pruebas se aplican y cuánto vale cada una?
     tipo=faq | principal=Artículo 13 | fuentes=Artículo 13 | Numeral 2.2 | Artículo 13, Parágrafo tercero | entidad=

Fase 5: 16 OK, 0 con diferencias, 0 omitidos
OK    el diálogo se abre en la primera visita
OK    título del diálogo
OK    cuatro pasos con su encabezado
OK    nueve perfiles
OK    foco inicial en el primer perfil
OK    flecha abajo elige el siguiente perfil
OK    el panel aún no se inició (va después del diálogo)
OK    con Tab se llega a todos los controles
OK    Escape cierra el diálogo
OK    al cerrar, el foco va a la caja de pregunta
OK    Escape no cambia el panel
OK    Escape deja registrada la bienvenida y no guarda perfil
OK    el panel se inicia tras cerrar
OK    no vuelve a abrirse
OK    sin errores de consola (diálogo y Escape)
OK    Visual: lista de ajustes en texto
OK    Visual: lectura automática sugerida
OK    Visual: preajuste del panel
OK    Visual: perfil y lectura automática guardados
OK    Visual: el panel arranca con el preajuste aplicado
OK    Visual: foco en la caja de pregunta
OK    Visual: sin errores de consola
OK    Auditivo: lista de ajustes en texto
OK    Auditivo: lectura automática sugerida
OK    Auditivo: preajuste del panel
OK    Auditivo: perfil y lectura automática guardados
OK    Auditivo: el panel arranca con el preajuste aplicado
OK    Auditivo: foco en la caja de pregunta
OK    Auditivo: sin errores de consola
OK    Físico: lista de ajustes en texto
OK    Físico: lectura automática sugerida
OK    Físico: preajuste del panel
OK    Físico: perfil y lectura automática guardados
OK    Físico: el panel arranca con el preajuste aplicado
OK    Físico: foco en la caja de pregunta
OK    Físico: sin errores de consola
OK    Intelectual: lista de ajustes en texto
OK    Intelectual: lectura automática sugerida
OK    Intelectual: preajuste del panel
OK    Intelectual: perfil y lectura automática guardados
OK    Intelectual: el panel arranca con el preajuste aplicado
OK    Intelectual: foco en la caja de pregunta
OK    Intelectual: sin errores de consola
OK    Psicosocial: lista de ajustes en texto
OK    Psicosocial: lectura automática sugerida
OK    Psicosocial: preajuste del panel
OK    Psicosocial: perfil y lectura automática guardados
OK    Psicosocial: el panel arranca con el preajuste aplicado
OK    Psicosocial: foco en la caja de pregunta
OK    Psicosocial: sin errores de consola
OK    Sordoceguera: lista de ajustes en texto
OK    Sordoceguera: lectura automática sugerida
OK    Sordoceguera: preajuste del panel
OK    Sordoceguera: perfil y lectura automática guardados
OK    Sordoceguera: el panel arranca con el preajuste aplicado
OK    Sordoceguera: foco en la caja de pregunta
OK    Sordoceguera: sin errores de consola
OK    Múltiple: lista de ajustes en texto
OK    Múltiple: lectura automática sugerida
OK    Múltiple: preajuste del panel
OK    Múltiple: perfil y lectura automática guardados
OK    Múltiple: el panel arranca con el preajuste aplicado
OK    Múltiple: foco en la caja de pregunta
OK    Múltiple: sin errores de consola
OK    Adulto mayor: lista de ajustes en texto
OK    Adulto mayor: lectura automática sugerida
OK    Adulto mayor: preajuste del panel
OK    Adulto mayor: perfil y lectura automática guardados
OK    Adulto mayor: el panel arranca con el preajuste aplicado
OK    Adulto mayor: foco en la caja de pregunta
OK    Adulto mayor: sin errores de consola
OK    Sin preferencia: lista de ajustes en texto
OK    Sin preferencia: lectura automática sugerida
OK    Sin preferencia: preajuste del panel
OK    Sin preferencia: perfil y lectura automática guardados
OK    Sin preferencia: el panel arranca con el preajuste aplicado
OK    Sin preferencia: foco en la caja de pregunta
OK    Sin preferencia: sin errores de consola
OK    el preajuste se combina con el estado previo
OK    Visual sugiere lectura automática
OK    el aviso del lector externo está oculto
OK    con lector externo, la lectura automática se deshabilita y desmarca
OK    aviso del lector externo con el texto del plan
OK    cambiar de perfil no reactiva la lectura con lector externo
OK    axe con el diálogo abierto y lector externo
OK    lector externo guardado y lectura automática apagada
OK    con lector externo no se lee en voz alta
OK    sin recordar, las preferencias van a sessionStorage
OK    en la misma sesión no vuelve a abrirse
OK    la bienvenida no se lee sola al cargar
OK    lee el bloque «En pocas palabras» y la fuente
OK    Alt + 1 lleva a la caja de pregunta
OK    «Perfil» abre el diálogo
OK    la conversación se conserva idéntica tras el cambio de perfil
OK    las preguntas del usuario se conservan
OK    el estado del panel tiene el perfil Físico
OK    se anuncia «Se aplicó el perfil Físico.»
OK    la bitácora no se duplica
OK    sin errores de consola en el cambio de perfil
OK    Escape en «Perfil» devuelve el foco al botón «Perfil»
OK    axe con la bienvenida abierta (normal, 100 %)
OK    axe con la bienvenida abierta (normal, 200 %)
OK    axe con la bienvenida abierta (oscuro, 100 %)
OK    axe con la bienvenida abierta (oscuro, 200 %)
OK    axe con la bienvenida abierta (alto, 100 %)
OK    axe con la bienvenida abierta (alto, 200 %)
OK    axe con la bienvenida abierta (alto-oscuro, 100 %)
OK    axe con la bienvenida abierta (alto-oscuro, 200 %)

Perfiles y bienvenida: 108 OK, 0 con diferencias
OK    la respuesta de vacantes tiene <caption> en sus tablas
OK    el título lleva «TABLA No. N» y el título en mayúsculas
OK    «TABLA No.» no se repite como párrafo
OK    encabezados con th scope="col"
OK    cada tabla en su contenedor desplazable enfocable
OK    la voz anuncia la tabla con su título y tamaño
OK    la voz lee cada fila con su encabezado («Fila 1…», «Vacantes: …»)
OK    sin errores de consola (tablas)
OK    «¿qué es la OPEC?» trae el botón de glosario «OPEC»
OK    cada término aparece como botón una sola vez en la respuesta
OK    el glosario abre un diálogo con el término como título
OK    la definición es literal (la misma de kb.json)
OK    fuente con la etiqueta Borrador
OK    axe con el glosario abierto
OK    Escape cierra el glosario y el foco vuelve al término
OK    «Cerrar» también devuelve el foco al término
OK    los términos son botones y se activan con teclado
OK    sin errores de consola (glosario)
OK    términos de varias palabras (experiencia directiva docente, docente, en otros cargos)
OK    el glosario de «Experiencia directiva docente» muestra su definición literal
OK    el glosario trae las siete entradas
OK    definición literal de «OPEC»
OK    definición literal de «SIMO»
OK    definición literal de «Educación formal»
OK    definición literal de «Educación continua»
OK    definición literal de «Experiencia directiva docente»
OK    definición literal de «Experiencia docente»
OK    definición literal de «Experiencia en otros cargos»
OK    «cuánto cuesta la inscripción» → tema reservado
OK    sin fuente
OK    mensaje de la sección 6
OK    registrado en la bitácora con motivo «Tema reservado»
OK    «¿Cómo pago los derechos de participación?» → faq
OK    «¿Las personas con discapacidad pagan la inscripción?» → faq
OK    «¿Qué pruebas se aplican y cuánto vale cada una?» → faq
OK    «cual es la tarifa de inscripcion» → tema-reservado
OK    «cuántos pesos cuesta participar en el concurso» → tema-reservado
OK    «cuántas personas se inscribieron» → no bloqueada
OK    ninguna respuesta muestra pasajes con UVT ni «valor en pesos»
OK    FAQ: la nota de validez cierra el bloque «Texto oficial»
OK    pasaje: la nota de validez cierra el bloque «Texto oficial»
OK    «No encontrado» no lleva nota de validez
OK    «Imprimir» llama a imprimir con la clase temporal en la respuesta
OK    los desplegables de esa respuesta se abren para imprimir
OK    al imprimir solo se ve esa respuesta (sin cabecera, panel, formulario, pie ni botones)
OK    texto negro sobre blanco y tablas completas
OK    tras imprimir se restablece la pantalla
OK    axe con tabla, glosario y tema reservado (normal, 100 %)
OK    axe con el glosario abierto (normal, 100 %)
OK    axe con tabla, glosario y tema reservado (normal, 200 %)
OK    axe con el glosario abierto (normal, 200 %)
OK    axe con tabla, glosario y tema reservado (oscuro, 100 %)
OK    axe con el glosario abierto (oscuro, 100 %)
OK    axe con tabla, glosario y tema reservado (oscuro, 200 %)
OK    axe con el glosario abierto (oscuro, 200 %)
OK    axe con tabla, glosario y tema reservado (alto, 100 %)
OK    axe con el glosario abierto (alto, 100 %)
OK    axe con tabla, glosario y tema reservado (alto, 200 %)
OK    axe con el glosario abierto (alto, 200 %)
OK    axe con tabla, glosario y tema reservado (alto-oscuro, 100 %)
OK    axe con el glosario abierto (alto-oscuro, 100 %)
OK    axe con tabla, glosario y tema reservado (alto-oscuro, 200 %)
OK    axe con el glosario abierto (alto-oscuro, 200 %)

Tablas, glosario, temas reservados e impresión: 63 OK, 0 con diferencias
Accesibilidad: axe 24/24, reflujo 12/12, teclado 8/8, voz 5/5, región viva 5/5. Informe: pruebas/INFORME_PRUEBAS.md
```

- axe: 24 de 24 combinaciones sin violaciones.
- Reflujo: 12 de 12.
- Teclado: 8 de 8. Voz: 5 de 5. Región viva: 5 de 5.
- Casos funcionales: 16 de 16 (sin omitidos). Perfiles: 108. Tablas, glosario, temas reservados e impresión: 63.
- Detalle por combinación y caso en `pruebas/INFORME_PRUEBAS.md`.

### Pruebas manuales que quedan para las personas

Listadas en el informe: NVDA con Firefox y JAWS con Chrome; VoiceOver en iPhone (Safari) y TalkBack en Android (Chrome); lectura en voz alta con una voz local instalada (Microsoft Sabina o Raúl); zoom del navegador al 400 % en computador; y la validación de los textos de los perfiles y de las preguntas frecuentes con personas con discapacidad.

### Diferencias y dudas

1. Las pruebas corren en Chromium; no se probó en Firefox ni WebKit, ni en Edge de escritorio.
2. La prueba de reflujo mide el desborde horizontal de la página a 320 px y 200 %, pero no equivale al zoom del navegador al 400 %, que sigue como prueba manual.
3. La versión visible en la interfaz sigue en `v0.1` (el informe la muestra); cambia en la fase 6.
4. Las pruebas de perfiles y de tablas y glosario quedaron en archivos propios (no se integraron en `accesibilidad.mjs`) porque el plan no pide moverlas; el informe resume sus resultados.

## Fase 6 — Documentación v0.2 (6 de octubre de 2026)

### Qué se hizo

1. **`LEEME.md`** reescrito: qué es, cómo abrirlo, qué hace, qué hace falta para regenerarlo (Node 22, Python 3.10 con `beautifulsoup4`, `npm install` y `npx playwright install chromium`), cómo actualizar la base cuando lleguen los acuerdos definitivos (las rutas de la carpeta `CHATBOT`, `extract.py`, `buildkb.py`, `npm run construir`, `npm run prueba` y qué revisar si cambia la numeración), cómo agregar preguntas frecuentes (cada campo de `faq.json`), entradas de glosario y temas reservados, estructura de la carpeta, pruebas y limitaciones.
2. **`CHANGELOG.md`** con la entrada v0.2 (nuevo, cambiado, corregido y pendiente) y la de v0.1.
3. **Versión visible `v0.2`** en la cabecera y en el pie (`src/index.html`). El informe de pruebas la lee de ahí.
4. **Ajuste de una prueba:** `accesibilidad.mjs` espera 500 ms tras abrir el panel antes de correr axe. En una de las ejecuciones axe midió colores con la transición de entrada a medias (opacidad parcial) y marcó un falso positivo de contraste en el panel (`normal`, 100 %); tras la espera pasó 24 de 24 en tres ejecuciones seguidas.

### Comprobación de la aceptación («un tercero puede regenerar el archivo siguiendo solo el `LEEME.md`»)

- Seguí los pasos del `LEEME.md` sobre las fuentes actuales de la carpeta `CHATBOT`: `python herramientas/extract.py` (91 documentos, 8.442 fragmentos) y `python herramientas/buildkb.py` regeneran un `kb.json` **idéntico** al versionado.
- Cloné el repositorio a una carpeta limpia, ejecuté `npm ci` y `npm run construir`: el `asistente-docentes.html` generado es idéntico al del trabajo (salvo que el clon estaba en la fase 5 y solo diferían los dos textos de la versión visible).
- Con esto queda resuelta la duda de la fase 1 sobre las rutas de `extract.py` y `buildkb.py` ejecutados desde la raíz del proyecto.

### Resultado final de las pruebas

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
     tipo=faq | principal=Artículo 6, Parágrafo primero | fuentes=Artículo 6, Parágrafo primero | Numeral 1.2.5 | Numeral 1.1 | entidad=
11 OK      quién gana el mundial de fútbol
     tipo=no-encontrado | principal= | fuentes= | entidad=
12 OK      cuánto cuesta la inscripción
     tipo=tema-reservado | principal= | fuentes= | entidad=
13 OK      cuál es el valor de los derechos de participación
     tipo=tema-reservado | principal= | fuentes= | entidad=
14 OK      ¿Cómo pago los derechos de participación?
     tipo=faq | principal=Numeral 1.2.5 | fuentes=Numeral 1.2.5 | Numeral 1.2.6 | Numeral 1.2.6 | entidad=
15 OK      ¿qué es la OPEC?
     tipo=faq | principal=Artículo 8, Parágrafo quinto | fuentes=Artículo 8, Parágrafo quinto | Numeral 1.2.5 | Numeral 1.2.7 | Artículo 8, Parágrafo tercero | entidad=
16 OK      ¿Qué pruebas se aplican y cuánto vale cada una?
     tipo=faq | principal=Artículo 13 | fuentes=Artículo 13 | Numeral 2.2 | Artículo 13, Parágrafo tercero | entidad=

Fase 5: 16 OK, 0 con diferencias, 0 omitidos
OK    el diálogo se abre en la primera visita
OK    título del diálogo
OK    cuatro pasos con su encabezado
OK    nueve perfiles
OK    foco inicial en el primer perfil
OK    flecha abajo elige el siguiente perfil
OK    el panel aún no se inició (va después del diálogo)
OK    con Tab se llega a todos los controles
OK    Escape cierra el diálogo
OK    al cerrar, el foco va a la caja de pregunta
OK    Escape no cambia el panel
OK    Escape deja registrada la bienvenida y no guarda perfil
OK    el panel se inicia tras cerrar
OK    no vuelve a abrirse
OK    sin errores de consola (diálogo y Escape)
OK    Visual: lista de ajustes en texto
OK    Visual: lectura automática sugerida
OK    Visual: preajuste del panel
OK    Visual: perfil y lectura automática guardados
OK    Visual: el panel arranca con el preajuste aplicado
OK    Visual: foco en la caja de pregunta
OK    Visual: sin errores de consola
OK    Auditivo: lista de ajustes en texto
OK    Auditivo: lectura automática sugerida
OK    Auditivo: preajuste del panel
OK    Auditivo: perfil y lectura automática guardados
OK    Auditivo: el panel arranca con el preajuste aplicado
OK    Auditivo: foco en la caja de pregunta
OK    Auditivo: sin errores de consola
OK    Físico: lista de ajustes en texto
OK    Físico: lectura automática sugerida
OK    Físico: preajuste del panel
OK    Físico: perfil y lectura automática guardados
OK    Físico: el panel arranca con el preajuste aplicado
OK    Físico: foco en la caja de pregunta
OK    Físico: sin errores de consola
OK    Intelectual: lista de ajustes en texto
OK    Intelectual: lectura automática sugerida
OK    Intelectual: preajuste del panel
OK    Intelectual: perfil y lectura automática guardados
OK    Intelectual: el panel arranca con el preajuste aplicado
OK    Intelectual: foco en la caja de pregunta
OK    Intelectual: sin errores de consola
OK    Psicosocial: lista de ajustes en texto
OK    Psicosocial: lectura automática sugerida
OK    Psicosocial: preajuste del panel
OK    Psicosocial: perfil y lectura automática guardados
OK    Psicosocial: el panel arranca con el preajuste aplicado
OK    Psicosocial: foco en la caja de pregunta
OK    Psicosocial: sin errores de consola
OK    Sordoceguera: lista de ajustes en texto
OK    Sordoceguera: lectura automática sugerida
OK    Sordoceguera: preajuste del panel
OK    Sordoceguera: perfil y lectura automática guardados
OK    Sordoceguera: el panel arranca con el preajuste aplicado
OK    Sordoceguera: foco en la caja de pregunta
OK    Sordoceguera: sin errores de consola
OK    Múltiple: lista de ajustes en texto
OK    Múltiple: lectura automática sugerida
OK    Múltiple: preajuste del panel
OK    Múltiple: perfil y lectura automática guardados
OK    Múltiple: el panel arranca con el preajuste aplicado
OK    Múltiple: foco en la caja de pregunta
OK    Múltiple: sin errores de consola
OK    Adulto mayor: lista de ajustes en texto
OK    Adulto mayor: lectura automática sugerida
OK    Adulto mayor: preajuste del panel
OK    Adulto mayor: perfil y lectura automática guardados
OK    Adulto mayor: el panel arranca con el preajuste aplicado
OK    Adulto mayor: foco en la caja de pregunta
OK    Adulto mayor: sin errores de consola
OK    Sin preferencia: lista de ajustes en texto
OK    Sin preferencia: lectura automática sugerida
OK    Sin preferencia: preajuste del panel
OK    Sin preferencia: perfil y lectura automática guardados
OK    Sin preferencia: el panel arranca con el preajuste aplicado
OK    Sin preferencia: foco en la caja de pregunta
OK    Sin preferencia: sin errores de consola
OK    el preajuste se combina con el estado previo
OK    Visual sugiere lectura automática
OK    el aviso del lector externo está oculto
OK    con lector externo, la lectura automática se deshabilita y desmarca
OK    aviso del lector externo con el texto del plan
OK    cambiar de perfil no reactiva la lectura con lector externo
OK    axe con el diálogo abierto y lector externo
OK    lector externo guardado y lectura automática apagada
OK    con lector externo no se lee en voz alta
OK    sin recordar, las preferencias van a sessionStorage
OK    en la misma sesión no vuelve a abrirse
OK    la bienvenida no se lee sola al cargar
OK    lee el bloque «En pocas palabras» y la fuente
OK    Alt + 1 lleva a la caja de pregunta
OK    «Perfil» abre el diálogo
OK    la conversación se conserva idéntica tras el cambio de perfil
OK    las preguntas del usuario se conservan
OK    el estado del panel tiene el perfil Físico
OK    se anuncia «Se aplicó el perfil Físico.»
OK    la bitácora no se duplica
OK    sin errores de consola en el cambio de perfil
OK    Escape en «Perfil» devuelve el foco al botón «Perfil»
OK    axe con la bienvenida abierta (normal, 100 %)
OK    axe con la bienvenida abierta (normal, 200 %)
OK    axe con la bienvenida abierta (oscuro, 100 %)
OK    axe con la bienvenida abierta (oscuro, 200 %)
OK    axe con la bienvenida abierta (alto, 100 %)
OK    axe con la bienvenida abierta (alto, 200 %)
OK    axe con la bienvenida abierta (alto-oscuro, 100 %)
OK    axe con la bienvenida abierta (alto-oscuro, 200 %)

Perfiles y bienvenida: 108 OK, 0 con diferencias
OK    la respuesta de vacantes tiene <caption> en sus tablas
OK    el título lleva «TABLA No. N» y el título en mayúsculas
OK    «TABLA No.» no se repite como párrafo
OK    encabezados con th scope="col"
OK    cada tabla en su contenedor desplazable enfocable
OK    la voz anuncia la tabla con su título y tamaño
OK    la voz lee cada fila con su encabezado («Fila 1…», «Vacantes: …»)
OK    sin errores de consola (tablas)
OK    «¿qué es la OPEC?» trae el botón de glosario «OPEC»
OK    cada término aparece como botón una sola vez en la respuesta
OK    el glosario abre un diálogo con el término como título
OK    la definición es literal (la misma de kb.json)
OK    fuente con la etiqueta Borrador
OK    axe con el glosario abierto
OK    Escape cierra el glosario y el foco vuelve al término
OK    «Cerrar» también devuelve el foco al término
OK    los términos son botones y se activan con teclado
OK    sin errores de consola (glosario)
OK    términos de varias palabras (experiencia directiva docente, docente, en otros cargos)
OK    el glosario de «Experiencia directiva docente» muestra su definición literal
OK    el glosario trae las siete entradas
OK    definición literal de «OPEC»
OK    definición literal de «SIMO»
OK    definición literal de «Educación formal»
OK    definición literal de «Educación continua»
OK    definición literal de «Experiencia directiva docente»
OK    definición literal de «Experiencia docente»
OK    definición literal de «Experiencia en otros cargos»
OK    «cuánto cuesta la inscripción» → tema reservado
OK    sin fuente
OK    mensaje de la sección 6
OK    registrado en la bitácora con motivo «Tema reservado»
OK    «¿Cómo pago los derechos de participación?» → faq
OK    «¿Las personas con discapacidad pagan la inscripción?» → faq
OK    «¿Qué pruebas se aplican y cuánto vale cada una?» → faq
OK    «cual es la tarifa de inscripcion» → tema-reservado
OK    «cuántos pesos cuesta participar en el concurso» → tema-reservado
OK    «cuántas personas se inscribieron» → no bloqueada
OK    ninguna respuesta muestra pasajes con UVT ni «valor en pesos»
OK    FAQ: la nota de validez cierra el bloque «Texto oficial»
OK    pasaje: la nota de validez cierra el bloque «Texto oficial»
OK    «No encontrado» no lleva nota de validez
OK    «Imprimir» llama a imprimir con la clase temporal en la respuesta
OK    los desplegables de esa respuesta se abren para imprimir
OK    al imprimir solo se ve esa respuesta (sin cabecera, panel, formulario, pie ni botones)
OK    texto negro sobre blanco y tablas completas
OK    tras imprimir se restablece la pantalla
OK    axe con tabla, glosario y tema reservado (normal, 100 %)
OK    axe con el glosario abierto (normal, 100 %)
OK    axe con tabla, glosario y tema reservado (normal, 200 %)
OK    axe con el glosario abierto (normal, 200 %)
OK    axe con tabla, glosario y tema reservado (oscuro, 100 %)
OK    axe con el glosario abierto (oscuro, 100 %)
OK    axe con tabla, glosario y tema reservado (oscuro, 200 %)
OK    axe con el glosario abierto (oscuro, 200 %)
OK    axe con tabla, glosario y tema reservado (alto, 100 %)
OK    axe con el glosario abierto (alto, 100 %)
OK    axe con tabla, glosario y tema reservado (alto, 200 %)
OK    axe con el glosario abierto (alto, 200 %)
OK    axe con tabla, glosario y tema reservado (alto-oscuro, 100 %)
OK    axe con el glosario abierto (alto-oscuro, 100 %)
OK    axe con tabla, glosario y tema reservado (alto-oscuro, 200 %)
OK    axe con el glosario abierto (alto-oscuro, 200 %)

Tablas, glosario, temas reservados e impresión: 63 OK, 0 con diferencias
Accesibilidad: axe 24/24, reflujo 12/12, teclado 8/8, voz 5/5, región viva 5/5. Informe: pruebas/INFORME_PRUEBAS.md
```

Detalle en `pruebas/INFORME_PRUEBAS.md`.

### Estado de las dudas abiertas de las fases anteriores

Las decisiones que dejé a su criterio siguen como se implementaron; si quiere cambiar alguna, es un ajuste puntual:

- Fase 2: panel claro en las variantes oscuras; «Escuchar» no lee desplegables cerrados.
- Fase 3: clave `bienvenida` como propiedad de `asistente-docentes.preferencias`; estado del panel en `localStorage` aunque «Recordar» esté desmarcado.
- Fase 4: OPEC y SIMO comparten la misma definición (la oración del literal a del numeral 1.1); las definiciones llevan su enumerador.
- Las pruebas manuales con lectores de pantalla, voz local, zoom al 400 % y personas con discapacidad siguen pendientes (están en el informe).

### Diferencias y dudas de esta fase

1. El plan dice «cambia la versión visible a `v0.2` en cabecera y pie»; no cambié los comentarios de código que mencionan «v0.1» como origen de lo movido, porque describen el historial.
2. `package.json` ya traía la versión `0.2.0` desde la fase 0.
3. No publiqué el archivo en ningún servidor, como pide el plan.

## Ajuste posterior a la Fase 6 — Logo de accesibilidad de la ONU (6 de octubre de 2026)

A petición de la persona responsable, el botón flotante del panel usa el símbolo de accesibilidad de la ONU de IncluIA en lugar del icono dibujado.

- Copia de `inclu-ia/public/logo-onu-accesibilidad.jpg` en `src/img/` (SHA-256 `100984fac5df4ab0e214f67f80511ab119e6ad59999d0f2eb6863238cd1d673d`). El panel admite la imagen por configuración (`logo`), así que `vendor/ebar/` no se tocó; `construir.mjs` la incrusta como `data:` (el archivo pasa de 1,69 a 1,77 MB y sigue sin depender de internet).
- El botón queda más grande (anillo amarillo de 5,25 rem con el símbolo sobre fondo blanco), igual que en IncluIA. El margen del formulario se ajustó a ese tamaño para que no tape «Enviar» (ventanas de 641 a 1320 px).
- Pruebas: sin cambios en los resultados (funcional 16/16, perfiles 108, tablas y glosario 63, axe 24/24, reflujo 12/12, teclado 8/8, voz 5/5, región viva 5/5).

## Ajuste posterior — Marca como la de IncluIA (6 de octubre de 2026)

A petición de la persona responsable, la marca de la cabecera sigue el diseño y la tipografía de IncluIA (`.earm-brand-mark`, `.earm-wordmark` y `.earm-version` de `inclu-ia/app.css`).

- **Marca:** cuadro oscuro redondeado con el icono del chat en amarillo; nombre «ASISTENTE DOCENTES» en Plus Jakarta Sans 800 con «DOCENTES» sobre un recuadro amarillo, como «IA» en IncluIA; chip «v0.2 · Prototipo» en JetBrains Mono. La clase `.mono` (fechas de la bitácora) también pasó a JetBrains Mono.
- **Fuentes:** copiadas, en el subconjunto latino y variables en peso, de `@fontsource-variable` de Lexible a `src/fuentes/` (con sus licencias OFL y `ORIGEN.md` con el SHA-256) e incrustadas en el archivo (1,77 → 1,86 MB). Solo se usan en la marca y en `.mono`; el texto del asistente sigue en Atkinson Hyperlegible Next.
- **Variantes de contraste:** el cuadro de la marca y su borde tienen variables en `temas.css` (oscuro con borde en los temas oscuros y de alto contraste). El recuadro amarillo conserva el contraste del texto en las cuatro.
- **Tamaños en `rem`** (no en `px` como en IncluIA), para que crezcan con el tamaño del texto del panel. A 320 px y 200 %, la marca pasa a dos líneas en lugar de desbordar (la prueba de reflujo lo detectó y se ajustó).
- Pruebas sin cambios en los resultados: funcional 16/16, perfiles 108, tablas y glosario 63, axe 24/24, reflujo 12/12, teclado 8/8, voz 5/5, región viva 5/5. El informe lee la versión del chip nuevo.

## Preparación de la publicación en GitHub Pages (6 de octubre de 2026)

A petición de la persona responsable se preparó el flujo para publicar con GitHub Pages en un repositorio público. **No se creó ningún repositorio remoto ni se subió nada.**

- `.github/workflows/publicar.yml`: GitHub Actions oficial (`checkout`, `configure-pages`, `upload-pages-artifact`, `deploy-pages`). Publica solo `asistente-docentes.html` como `index.html`; se dispara con cambios en ese archivo en `master` y a mano. Falla con un mensaje claro si el HTML falta.
- `LEEME.md`: sección «Cómo publicarlo en GitHub Pages» con los tres pasos (crear el repositorio público, activar Pages con la fuente «GitHub Actions», ejecutar el flujo) y cómo actualizar.
- Revisión previa a hacerlo público: no hay contraseñas, llaves ni datos personales en el repositorio; los autores de los commits son `Despacho EARM CNSC <despacho-earm@cnsc.gov.co>`; `node_modules`, `raw.json` y `pruebas/resultados/` no se versionan; el historial pesa unos 5 MB.
- No se pudo validar el flujo de punta a punta sin un repositorio remoto: la primera ejecución real es la prueba. Quedan por confirmar la cuenta u organización, el nombre del repositorio y la aprobación para hacerlo público.

## Fase 7 preparada, sin implementar (6 de octubre de 2026)

A petición de la persona responsable se escribió el plan de la fase 7 (navegación guiada y estructura fija de respuesta, v0.3) en `PLAN_IMPLEMENTACION.md`. **No se cambió código ni pruebas:** el plan y los casos de prueba están definidos para que se ejecuten cuando la persona lo confirme.

- **Contenido de la fase 7:** tarjetas de temas (cinco temas armados con las doce preguntas frecuentes que ya existen), buscador de entidad dentro de la respuesta «Depende de su entidad» (patrón combobox) y estructura fija de respuesta (respuesta corta, fuente en una línea, texto oficial, una sola insignia «Borrador», sin mayúsculas sostenidas, texto base de 18 px, líneas de 70 caracteres como máximo, y «Preguntas parecidas» en «No encontrado»).
- **Pruebas definidas:** `pruebas/navegacion.mjs` (temas, datos, buscador, estructura y sugerencias), ampliación de `accesibilidad.mjs` (32 combinaciones de axe y 16 de reflujo, con el estado «temas y buscador de entidad») y un ajuste en `perfiles.mjs` por el tamaño base. Las tablas de casos E1 a E8 y P1 a P6 de la sección 7 se verificaron antes contra la v0.2 (por ejemplo, que las doce preguntas frecuentes den `faq`, y que «cuánto dura la entrevista», «cuándo salen los resultados» y «cuánto tarda el proceso» sean «No encontrado» con sugerencias de cov ≥ 0,5).
- **Decisiones de diseño dentro del plan, para su revisión:** sin tarjetas de «Fechas» ni «Ajustes razonables» (no hay preguntas frecuentes validadas); sin iconos ni pictogramas (quedan para una fase con validación); la sección de temas se pliega al enviar cualquier pregunta; versión visible `v0.3`.
- Se agregó a `CLAUDE.md` y a la sección 9 del plan la regla de **no hacer `git push`**, porque cada `push` a `master` publica en GitHub Pages.
