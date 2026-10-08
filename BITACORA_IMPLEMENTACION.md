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

## Fase 7 — Navegación guiada y estructura fija de respuesta, v0.3 (6 de octubre de 2026)

Antes de ejecutarla, la persona responsable aprobó las tres decisiones del plan (sin tarjetas de «Fechas» ni «Ajustes razonables», sin iconos, versión `v0.3`) y quitar las mayúsculas sostenidas (anotado en `CHANGELOG.md` como excepción de accesibilidad al sistema de diseño EARM), y pidió dos ajustes al plan, ya incorporados y commiteados: los mensajes del buscador de entidad van en `#status` (no en un `role="status"` dentro de la respuesta, porque `#log` ya es una región viva) y `navegacion.mjs` comprueba que no hay `role="status"`, `role="alert"` ni `aria-live` dentro de `#log`.

### Línea base (7.0)

`npm run prueba` con la v0.2: funcional 16/16, perfiles 108, tablas y glosario 63, axe 24/24, reflujo 12/12, teclado 8/8, voz 5/5, región viva 5/5. Todo en verde antes de empezar.

### Qué se hizo

1. **7.1 Tarjetas de temas.** `herramientas/temas.json` (cinco temas con las doce preguntas frecuentes), `src/js/temas.js`, la sección `#temas` dentro de `section.chat` y `src/css/navegacion.css`. Se quitó la lista de siete preguntas (`#sugeridas`) del panel lateral. `construir.mjs` valida los temas (id repetido, título vacío, tema sin preguntas, pregunta inexistente y pregunta de `faq.json` que no esté en ningún tema) y los inserta como `temas` en los datos. La sección nace desplegada y se pliega al enviar cualquier pregunta (escrita, dictada, de un tema, sugerida o de la elección de entidad), con el botón «Ver los temas»; tras restaurar una conversación (cambio de perfil) nace plegada. Abrir un tema pone el foco en su subtítulo; «Volver a los temas» y Escape devuelven el foco a la tarjeta; elegir una pregunta deja el foco en la caja de pregunta.
2. **7.2 Buscador de entidad.** `src/js/entidades.js`: `buscarEntidades` (sin tildes ni mayúsculas, en cualquier orden, primero las que empiezan por la primera palabra, máximo 8) y el combobox WAI-ARIA 1.2 (`role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`; flechas, Enter, Escape, Tab y clic). Aparece en las dos ramas de «Depende de su entidad». Los mensajes («Una entidad encontrada.», «{n} entidades encontradas.», «Sin resultados…», «Hay más entidades…») se escriben en `#status`; el `<p class="hint">` del buscador repite el texto sin `role` ni `aria-live`. Al elegir: el buscador pasa a «Entidad elegida: {entidad}.», el selector del panel lateral toma el valor, `#status` anuncia la elección, se reenvía la misma pregunta (700 ms después, para que el anuncio no se pise con «Buscando…») y el foco queda en la caja de pregunta. El buscador lleva `data-a11y-omitir`, así que la lectura en voz alta no lo recorre.
3. **7.3 Estructura fija.** Pregunta frecuente: respuesta corta, fuente en una línea, aclaración (sin insignia: «Borrador para validación. Respuesta frecuente redactada…»), «Texto oficial» y nota de validez. Pasaje: sin el encabezado «Lo más relevante» cuando no hay frases clave (antes quedaba vacío). Una sola insignia «Borrador» visible: las demás fuentes visibles van sin ella (`passageBlock` con `fuente: 'ninguna' | 'sin-borrador' | 'completa'`). «No encontrado» agrega «Preguntas parecidas» (`cov >= 0.5` sobre `faqIndex`; el motor no cambió). Presentación: sin `text-transform: uppercase` en ninguna regla; tamaño base de 18 px (`html { font-size: 112.5% }` y `ESCALA_BASE = 1.125` en `accesibilidad.js`; el panel sigue diciendo «100 %»); ningún texto visible menor de 0,75 rem; líneas de 70 caracteres en `.plain`, `.official p` y `.hint`.
4. **7.5.** Versión visible `v0.3` (cabecera, chip y pie) y `package.json` 0.3.0; `LEEME.md`, `CHANGELOG.md` (con la excepción de accesibilidad) y esta bitácora.

### Pruebas

`npm run prueba` ahora ejecuta cinco archivos. Resultado final:

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

Fase 7: 16 OK, 0 con diferencias, 0 omitidos
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
OK    la sección de temas está desplegada al cargar, con su título
OK    una tarjeta por tema, con su título y su cuenta de preguntas (leídos de temas.json)
OK    ya no existe la lista de preguntas del panel lateral
OK    toda pregunta frecuente está en algún tema y todo tema cita preguntas que existen
OK    cada tarjeta es un botón de al menos 44 px de alto
OK    tema «Inscripción y pago»: lista exactamente sus preguntas, en orden
OK    tema «Inscripción y pago»: el foco queda en el subtítulo
OK    tema «Inscripción y pago»: «Volver a los temas» devuelve el foco a la tarjeta
OK    tema «Inscripción y pago»: Escape equivale a «Volver a los temas»
OK    tema «Vacantes»: lista exactamente sus preguntas, en orden
OK    tema «Vacantes»: el foco queda en el subtítulo
OK    tema «Vacantes»: «Volver a los temas» devuelve el foco a la tarjeta
OK    tema «Vacantes»: Escape equivale a «Volver a los temas»
OK    tema «Pruebas y puntajes»: lista exactamente sus preguntas, en orden
OK    tema «Pruebas y puntajes»: el foco queda en el subtítulo
OK    tema «Pruebas y puntajes»: «Volver a los temas» devuelve el foco a la tarjeta
OK    tema «Pruebas y puntajes»: Escape equivale a «Volver a los temas»
OK    tema «Resultados y reclamaciones»: lista exactamente sus preguntas, en orden
OK    tema «Resultados y reclamaciones»: el foco queda en el subtítulo
OK    tema «Resultados y reclamaciones»: «Volver a los temas» devuelve el foco a la tarjeta
OK    tema «Resultados y reclamaciones»: Escape equivale a «Volver a los temas»
OK    tema «Etapas del proceso»: lista exactamente sus preguntas, en orden
OK    tema «Etapas del proceso»: el foco queda en el subtítulo
OK    tema «Etapas del proceso»: «Volver a los temas» devuelve el foco a la tarjeta
OK    tema «Etapas del proceso»: Escape equivale a «Volver a los temas»
OK    sin errores de consola (temas)
OK    con Tab se llega a «¿Cuánto vale la entrevista?» dentro del tema
OK    la respuesta es la pregunta frecuente con fuente principal «Numeral 6.1»
OK    la sección de temas se pliega, con aria-expanded="false" y el botón «Ver los temas»
OK    el foco queda en la caja de pregunta
OK    «Ver los temas» la despliega con las tarjetas
OK    escribir y enviar una pregunta también pliega los temas
OK    cada pregunta de cada tema da su respuesta (faq, o depende-entidad en vacantes sin entidad)
OK    «Depende de su entidad» trae el buscador (rama de la búsqueda por entidad)
OK    la instrucción reemplaza la que mandaba al panel lateral
OK    nombre accesible «Nombre de su entidad» y atributos del combobox
OK    E3 palabras en otro orden: «antioquia departamental»
OK    E4 mayúsculas y tilde: «BOGOTÁ»
OK    E5 Cali: «cali»
OK    E1 antio: «antio»
OK    con opciones, aria-expanded="true" y el aviso del buscador
OK    el aviso también va a #status de la página
OK    E6 «secretaria»: 8 opciones y el aviso de «más entidades»
OK    E7 «zzzz»: sin lista y aviso de sin resultados
OK    E8 «a»: sin lista y aviso vacío (menos de 2 caracteres)
OK    flecha abajo activa la primera opción (aria-activedescendant y aria-selected)
OK    flecha arriba da la vuelta a la última opción
OK    Escape cierra la lista y deja el texto
OK    Tab cierra la lista y sigue el orden normal
OK    las opciones miden al menos 44 px de alto
OK    axe con la lista de opciones abierta
OK    la lectura en voz alta incluye la instrucción pero no el buscador ni sus opciones
OK    E1 al elegir con Enter: la pregunta se repite y la respuesta nueva es faq, «Artículo 8», entidad Antioquia
OK    el buscador se reemplaza por «Entidad elegida: …»
OK    el selector del panel lateral toma la entidad
OK    #status anuncia «Entidad elegida: …» y después «Respuesta lista.»
OK    el foco queda en la caja de pregunta
OK    dentro de #log no hay role="status", role="alert" ni aria-live (con el buscador ya usado y la bienvenida)
OK    sin errores de consola (buscador)
OK    la pregunta frecuente de vacantes sin entidad también trae el buscador
OK    el aviso del buscador no lleva role ni aria-live
OK    E2 «bogota»: una opción
OK    E2 al elegir con clic: faq, «Artículo 8», entidad Bogotá
OK    sin regiones vivas en #log (rama de pregunta frecuente)
OK    tras cambiar de perfil las dos preguntas y las dos respuestas son idénticas
OK    tras el cambio de perfil la sección de temas nace plegada
OK    si la entidad ya se conoce, la respuesta no trae buscador
OK    pregunta frecuente (caso 1): respuesta corta, fuente, «Texto oficial», nota de validez y relacionadas, en ese orden
OK    pregunta frecuente (caso 1): una sola insignia «Borrador» visible
OK    pregunta frecuente (caso 1): ningún encabezado vacío
OK    pregunta frecuente con dos fuentes (caso 5): respuesta corta, fuente, «Texto oficial», nota de validez y relacionadas, en ese orden
OK    pregunta frecuente con dos fuentes (caso 5): una sola insignia «Borrador» visible
OK    pregunta frecuente con dos fuentes (caso 5): ningún encabezado vacío
OK    pasaje (caso 7): respuesta corta, fuente, «Texto oficial», nota de validez y relacionadas, en ese orden
OK    pasaje (caso 7): una sola insignia «Borrador» visible
OK    pasaje (caso 7): ningún encabezado vacío
OK    ningún elemento visible usa text-transform distinto de none (sin mayúsculas sostenidas)
OK    el tamaño base es de 18 px con el panel en 100 %
OK    ningún texto visible mide menos de 0,75 rem (13,5 px)
OK    las líneas de respuesta tienen un máximo de 70 caracteres (70ch)
OK    el panel sigue mostrando «100 %» como tamaño normal
OK    con el panel en 200 %, el tamaño base pasa a 36 px
OK    el diálogo de bienvenida no usa mayúsculas sostenidas ni textos menores de 13,5 px
OK    P1 «cuánto dura la entrevista»: no-encontrado con preguntas parecidas
OK    P2 «cuándo salen los resultados»: no-encontrado con preguntas parecidas
OK    P3 «cuánto tarda el proceso»: no-encontrado con preguntas parecidas
OK    P4 «qué pasa si no apruebo»: no-encontrado con ninguna sugerencia
OK    P5 «dónde reclamo si no estoy de acuerdo»: no-encontrado con ninguna sugerencia
OK    P6 «quién gana el mundial de fútbol»: no-encontrado con ninguna sugerencia
OK    P1 al activar la sugerencia se obtiene su respuesta frecuente (Numeral 6.1)
OK    P1 la sugerencia queda en la bitácora de preguntas (historial) como una pregunta más
OK    dentro de #log no hay role="status", role="alert" ni aria-live (con respuestas de todos los tipos)
OK    #log sigue siendo la región viva de la conversación
OK    la sección de temas está fuera de #log

Navegación guiada y estructura de respuesta: 94 OK, 0 con diferencias
Accesibilidad: axe 32/32, reflujo 16/16, teclado 8/8, voz 5/5, región viva 5/5. Informe: pruebas/INFORME_PRUEBAS.md
```

- **`pruebas/navegacion.mjs` (nuevo, 94 comprobaciones):** temas (tarjetas y cuentas leídas de `temas.json` y `faq.json`; cada tema lista sus preguntas en orden; foco; Escape; solo teclado hasta «¿Cuánto vale la entrevista?» → `faq` con `Numeral 6.1`; plegado y despliegue; cada pregunta de cada tema da su respuesta); buscador (casos E1 a E8, las dos ramas, atributos del combobox, teclado, opciones de al menos 44 px, axe con la lista abierta, la voz no lo recorre, elección con Enter y con clic, entidad en el selector, anuncios en `#status`, conversación idéntica tras cambiar de perfil); estructura (orden en el DOM, una sola insignia «Borrador», sin encabezados vacíos, sin `text-transform`, 18 px y 36 px al 200 %, texto mínimo de 13,5 px, 70ch, «100 %» en el panel); preguntas parecidas (P1 a P6); y regiones vivas (cero `role="status"`, `role="alert"` o `aria-live` dentro de `#log`, con el buscador usado y respuestas de todos los tipos).
- **`accesibilidad.mjs`:** estado nuevo «temas (tema abierto) y buscador de entidad (lista abierta)» en axe (32 combinaciones, todas sin violaciones) y en el reflujo a 320 px y 200 % (16 de 16); el teclado incluye ahora `temas-alternar`.
- **`perfiles.mjs`:** el tamaño esperado en `<html>` pasa de `{texto}%` a `{texto × 1,125}%`, como pedía el plan. `funcional.mjs` y `tablas_glosario.mjs` no cambiaron y siguen igual.
- El informe se regenera con la sección «Navegación guiada y estructura de respuesta» y las dos pruebas manuales nuevas.

### Diferencias, decisiones y dudas

1. **Error del plan: «anto».** La prueba de axe del plan escribía «anto» en el buscador, pero ninguna entidad lo contiene (daba cero opciones). Se usa «antio» (el caso E1) y se corrigió el plan.
2. **Párrafo de la primera rama de «Depende de su entidad».** El plan dice dejar el párrafo `plain` sin cambios, pero ese párrafo traía dentro la frase «Elija su entidad en el panel «Antes de preguntar» y vuelva a preguntar para ver el texto exacto de su acuerdo.», que contradice el flujo nuevo. Se quitó esa frase y quedó la instrucción del buscador; el resto del párrafo no cambió.
3. **Error de v0.2 corregido de paso.** En `construir.mjs`, el escape de `</` de los datos y del código incrustado no hacía nada (el `\` se perdió al escribir el archivo en la fase 1: `'<\/'` es `'</'` en JavaScript). Ahora escapa de verdad (`'<\\/'`). Nada en los datos actuales contiene `</script`, así que el resultado no cambió, pero un texto futuro con esa secuencia habría roto la página.
4. **Reflujo.** Con el tamaño base de 18 px, a 320 px y texto al 200 % en alto contraste una palabra larga desbordaba 3 px. Se agregó `overflow-wrap: anywhere` a los textos de las respuestas (no a las tablas) y la prueba de reflujo ahora cuenta también el contenedor de cada tabla, no solo lo de adentro.
5. **Tamaños.** Para cumplir el mínimo de 0,75 rem se subieron `.badge`, `.earm-version`, `label.lbl`, los encabezados `h3` de respuesta, `table.data th`, `.brand p`, `.hint`, `.src`, `.status` y `.actions .btn`, y se pasó `.msg` a 1 rem, `.official` a 0,95 rem y las tablas a 0,9 rem. Quitar las mayúsculas alcanzó a `.btn`, `label.lbl`, `.msg.bot h3`, `.badge`, `table.data th` y el pie (que además pasó a tamaño y peso normales).
6. **Mensaje de bienvenida del chat.** Sigue diciendo «elíjala en el panel «Antes de preguntar»», que sigue existiendo (el selector de entidad se conservó). Es un texto de v0.1 que el plan no manda cambiar.
7. **Preguntas parecidas.** Lo que se ve depende de los datos actuales (P1 a P6); si cambian las preguntas frecuentes, esos casos se revisan.
8. **No se hizo `git push`.** La versión publicada en GitHub Pages sigue siendo la v0.2 hasta que la persona responsable lo decida.

## Fase 8 preparada, sin implementar (6 de octubre de 2026)

A petición de la persona responsable se escribió el plan de la fase 8 (v0.4) en `PLAN_IMPLEMENTACION.md`, con el mismo nivel de detalle que la fase 7 y sus pruebas. **No se cambió código ni pruebas.**

- **Alcance (nueve cambios de interfaz):** iconos de línea en las tarjetas de temas y «Dictar» visible; botón de la ONU en la cabecera en celular, margen lateral de 16 px y selector de entidad plegado al final; una sola columna de 800 px con la caja de pregunta fija abajo; aviso de una línea con «Ver más»; fuente en una sola línea sin insignias; sin resaltado salvo en las frases clave; «En pocas palabras» en su recuadro; opinión como grupo propio; saludo nuevo con el texto literal aprobado y el número de entidades leído de `kb.json`.
- **Pruebas definidas:** `pruebas/diseno.mjs` (nuevo), ajustes en `navegacion.mjs`, `tablas_glosario.mjs` y `accesibilidad.mjs` (40 combinaciones de axe y 20 de reflujo, en las cuatro variantes de contraste), tablas de casos de fuente y de ventanas en la sección 7, y las pruebas manuales de celular y de contraste forzado en la sección 8.
- **Decisiones de diseño dentro del plan, para su revisión:**
  1. El botón de la ONU en celular se reubica **solo con CSS** (posición absoluta arriba a la derecha de la página, 56 px) para no tocar `vendor/`; se desplaza con la cabecera, y el botón «Accesibilidad» de la cabecera sigue siendo otra vía de apertura.
  2. La caja de pregunta es `position: fixed` con el alto medido por JavaScript (`--alto-form`), en lugar de `sticky`: es la única forma de que quede pegada al borde inferior también cuando hay poca conversación. Cuando el formulario crece, el contenido y el pie siguen visibles.
  3. «Celular» es un ancho menor que 640 px; las reglas actuales de `max-width: 640px` pasan a `639px`.
  4. El selector de entidad queda plegado en todas las pantallas (una sola estructura), no solo en celular.
  5. El aviso de una línea es el mismo texto, recortado con puntos suspensivos y completo para lectores de pantalla.
  6. Texto nuevo no pedido: «Ver menos» (el botón desplegado). Textos reutilizados: «Antes de preguntar», «Gracias por su opinión.».
  7. Los iconos son de línea en el estilo de Lucide, con el trazo escrito en el plan; en el modo de contraste forzado de Windows, `currentColor` los mantiene visibles.
  8. «En pocas palabras» tiene recuadro propio solo en las respuestas de pregunta frecuente; en las de pasaje, las frases clave siguen siendo un bloque `.official` (son texto literal del documento).

## Fase 8 — Diseño de una columna, celular y presentación de la respuesta, v0.4 (6 de octubre de 2026)

Antes de ejecutarla, la persona responsable aprobó las decisiones 1, 3, 4, 6 y 7 del plan y pidió tres ajustes, ya incorporados al plan y commiteados: el selector de entidad va plegado justo debajo de `#temas` con el resumen «Su entidad (opcional)»; la caja de pregunta pasa a estática con ventanas de menos de 500 px de alto o si ocupa más de un tercio de la ventana; y el aviso muestra una frase completa («Prototipo con documentos en borrador. No escriba datos personales.») con el texto largo oculto con `hidden`.

### Línea base (8.0)

`npm run prueba` con la v0.3: funcional 16/16, perfiles 108, tablas y glosario 63, navegación 94, axe 32/32, reflujo 16/16, teclado 8/8, voz 5/5, región viva 5/5. Todo en verde antes de empezar.

### Qué se hizo

1. **8.1 Iconos.** `src/js/iconos.js` (cinco iconos de línea del estilo de Lucide, SVG en línea con `aria-hidden`, `focusable="false"` y `currentColor`), campo `icono` en `temas.json` validado por `construir.mjs` (falta o nombre inexistente: error), tarjetas con el icono de 28 px a la izquierda del texto. El micrófono muestra «Dictar» (ya no es `sr-only`).
2. **8.2 Celular (menos de 640 px).** El botón de la ONU pasa a la cabecera solo con CSS propio (`position: absolute`, arriba a la derecha, 56 px; `vendor/` sin tocar); la marca reserva su espacio; `.bar` ya tiene 16 px de relleno lateral (antes lo anulaba); las reglas de `max-width: 640px` pasaron a `639px`. Desde 640 px el botón sigue flotando y el interior del formulario deja 7 rem a la derecha entre 640 y 1100 px.
3. **8.3 Una sola columna.** `index.html` sin `.grid`, `aside` ni `section.chat`: `main.columna` con aviso, temas, `<details id="entidad-detalles">` («Su entidad (opcional)», plegado), conversación y formulario. Cabecera y columna de 800 px como máximo, centradas; nada con desplazamiento interno. La caja de pregunta es `position: fixed` con su alto publicado en `--alto-form` (relleno inferior del cuerpo y `scroll-padding-bottom`) y `main.js` (`ajustarFormulario`) la pasa a `position: static`, al final de la columna, con ventanas de menos de 500 px de alto o si `.form-interior` supera un tercio del alto de la ventana; se recalcula al cargar, al cambiar el tamaño, al girar y con un `ResizeObserver`. `impresion.css` oculta los elementos nuevos.
4. **8.4 Aviso corto.** Frase completa + botón «Ver más» / «Ver menos»; el texto largo (el de siempre, con la versión de los documentos) lleva `hidden` mientras está plegado.
5. **8.5 Fuente en una línea.** Una función compartida (`htmlFuente`, en `bitacora.js`) da «Fuente: … · común a N de 90 acuerdos · Borrador», sin insignias; la usan las respuestas y el diálogo del glosario. Se eliminaron las reglas `.badge`.
6. **8.6 Resaltado.** `renderOfficial` y `passageBlock` ya no resaltan nada; solo las frases clave de los pasajes llevan `mark`.
7. **8.7 Resumen.** «En pocas palabras» y su párrafo van en `.resumen` (borde completo de 2 px o más, distinto del texto oficial) en las preguntas frecuentes.
8. **8.8 Opinión.** Grupo `role="group"` «¿Le sirvió esta respuesta?» con «Sí» y «No», aparte de Escuchar, Copiar e Imprimir; mismo comportamiento de antes. «Copiar» oculta temporalmente los grupos de botones y el aviso de voz antes de leer el texto.
9. **8.9 Saludo.** Cuatro párrafos del texto aprobado, el primero en negrita, desde una sola lista de la que salen el HTML y el texto de lectura; el número de entidades es `KB.nAcuerdos` (90).
10. **8.11.** Versión visible `v0.4` (cabecera, chip y pie), `package.json` 0.4.0, `LEEME.md`, `CHANGELOG.md` y esta bitácora.

### Pruebas

`npm run prueba` ahora ejecuta seis archivos. Resultado final:

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

Fase 8: 16 OK, 0 con diferencias, 0 omitidos
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
OK    la sección de temas está desplegada al cargar, con su título
OK    una tarjeta por tema, con su título y su cuenta de preguntas (leídos de temas.json)
OK    ya no existe la lista de preguntas del panel lateral
OK    toda pregunta frecuente está en algún tema y todo tema cita preguntas que existen
OK    cada tarjeta es un botón de al menos 44 px de alto
OK    tema «Inscripción y pago»: lista exactamente sus preguntas, en orden
OK    tema «Inscripción y pago»: el foco queda en el subtítulo
OK    tema «Inscripción y pago»: «Volver a los temas» devuelve el foco a la tarjeta
OK    tema «Inscripción y pago»: Escape equivale a «Volver a los temas»
OK    tema «Vacantes»: lista exactamente sus preguntas, en orden
OK    tema «Vacantes»: el foco queda en el subtítulo
OK    tema «Vacantes»: «Volver a los temas» devuelve el foco a la tarjeta
OK    tema «Vacantes»: Escape equivale a «Volver a los temas»
OK    tema «Pruebas y puntajes»: lista exactamente sus preguntas, en orden
OK    tema «Pruebas y puntajes»: el foco queda en el subtítulo
OK    tema «Pruebas y puntajes»: «Volver a los temas» devuelve el foco a la tarjeta
OK    tema «Pruebas y puntajes»: Escape equivale a «Volver a los temas»
OK    tema «Resultados y reclamaciones»: lista exactamente sus preguntas, en orden
OK    tema «Resultados y reclamaciones»: el foco queda en el subtítulo
OK    tema «Resultados y reclamaciones»: «Volver a los temas» devuelve el foco a la tarjeta
OK    tema «Resultados y reclamaciones»: Escape equivale a «Volver a los temas»
OK    tema «Etapas del proceso»: lista exactamente sus preguntas, en orden
OK    tema «Etapas del proceso»: el foco queda en el subtítulo
OK    tema «Etapas del proceso»: «Volver a los temas» devuelve el foco a la tarjeta
OK    tema «Etapas del proceso»: Escape equivale a «Volver a los temas»
OK    sin errores de consola (temas)
OK    con Tab se llega a «¿Cuánto vale la entrevista?» dentro del tema
OK    la respuesta es la pregunta frecuente con fuente principal «Numeral 6.1»
OK    la sección de temas se pliega, con aria-expanded="false" y el botón «Ver los temas»
OK    el foco queda en la caja de pregunta
OK    «Ver los temas» la despliega con las tarjetas
OK    escribir y enviar una pregunta también pliega los temas
OK    cada pregunta de cada tema da su respuesta (faq, o depende-entidad en vacantes sin entidad)
OK    «Depende de su entidad» trae el buscador (rama de la búsqueda por entidad)
OK    la instrucción reemplaza la que mandaba al panel lateral
OK    nombre accesible «Nombre de su entidad» y atributos del combobox
OK    E3 palabras en otro orden: «antioquia departamental»
OK    E4 mayúsculas y tilde: «BOGOTÁ»
OK    E5 Cali: «cali»
OK    E1 antio: «antio»
OK    con opciones, aria-expanded="true" y el aviso del buscador
OK    el aviso también va a #status de la página
OK    E6 «secretaria»: 8 opciones y el aviso de «más entidades»
OK    E7 «zzzz»: sin lista y aviso de sin resultados
OK    E8 «a»: sin lista y aviso vacío (menos de 2 caracteres)
OK    flecha abajo activa la primera opción (aria-activedescendant y aria-selected)
OK    flecha arriba da la vuelta a la última opción
OK    Escape cierra la lista y deja el texto
OK    Tab cierra la lista y sigue el orden normal
OK    las opciones miden al menos 44 px de alto
OK    axe con la lista de opciones abierta
OK    la lectura en voz alta incluye la instrucción pero no el buscador ni sus opciones
OK    E1 al elegir con Enter: la pregunta se repite y la respuesta nueva es faq, «Artículo 8», entidad Antioquia
OK    el buscador se reemplaza por «Entidad elegida: …»
OK    el selector del panel lateral toma la entidad
OK    #status anuncia «Entidad elegida: …» y después «Respuesta lista.»
OK    el foco queda en la caja de pregunta
OK    dentro de #log no hay role="status", role="alert" ni aria-live (con el buscador ya usado y la bienvenida)
OK    sin errores de consola (buscador)
OK    la pregunta frecuente de vacantes sin entidad también trae el buscador
OK    el aviso del buscador no lleva role ni aria-live
OK    E2 «bogota»: una opción
OK    E2 al elegir con clic: faq, «Artículo 8», entidad Bogotá
OK    sin regiones vivas en #log (rama de pregunta frecuente)
OK    tras cambiar de perfil las dos preguntas y las dos respuestas son idénticas
OK    tras el cambio de perfil la sección de temas nace plegada
OK    si la entidad ya se conoce, la respuesta no trae buscador
OK    pregunta frecuente (caso 1): respuesta corta, fuente, «Texto oficial», nota de validez y relacionadas, en ese orden
OK    pregunta frecuente (caso 1): una sola fuente visible con «· Borrador»
OK    pregunta frecuente (caso 1): ningún encabezado vacío
OK    pregunta frecuente con dos fuentes (caso 5): respuesta corta, fuente, «Texto oficial», nota de validez y relacionadas, en ese orden
OK    pregunta frecuente con dos fuentes (caso 5): una sola fuente visible con «· Borrador»
OK    pregunta frecuente con dos fuentes (caso 5): ningún encabezado vacío
OK    pasaje (caso 7): respuesta corta, fuente, «Texto oficial», nota de validez y relacionadas, en ese orden
OK    pasaje (caso 7): una sola fuente visible con «· Borrador»
OK    pasaje (caso 7): ningún encabezado vacío
OK    ningún elemento visible usa text-transform distinto de none (sin mayúsculas sostenidas)
OK    el tamaño base es de 18 px con el panel en 100 %
OK    ningún texto visible mide menos de 0,75 rem (13,5 px)
OK    las líneas de respuesta tienen un máximo de 70 caracteres (70ch)
OK    el panel sigue mostrando «100 %» como tamaño normal
OK    con el panel en 200 %, el tamaño base pasa a 36 px
OK    el diálogo de bienvenida no usa mayúsculas sostenidas ni textos menores de 13,5 px
OK    P1 «cuánto dura la entrevista»: no-encontrado con preguntas parecidas
OK    P2 «cuándo salen los resultados»: no-encontrado con preguntas parecidas
OK    P3 «cuánto tarda el proceso»: no-encontrado con preguntas parecidas
OK    P4 «qué pasa si no apruebo»: no-encontrado con ninguna sugerencia
OK    P5 «dónde reclamo si no estoy de acuerdo»: no-encontrado con ninguna sugerencia
OK    P6 «quién gana el mundial de fútbol»: no-encontrado con ninguna sugerencia
OK    P1 al activar la sugerencia se obtiene su respuesta frecuente (Numeral 6.1)
OK    P1 la sugerencia queda en la bitácora de preguntas (historial) como una pregunta más
OK    dentro de #log no hay role="status", role="alert" ni aria-live (con respuestas de todos los tipos)
OK    #log sigue siendo la región viva de la conversación
OK    la sección de temas está fuera de #log

Navegación guiada y estructura de respuesta: 94 OK, 0 con diferencias
OK    iconos (normal): cinco tarjetas, cada una con un solo icono decorativo (aria-hidden, sin title), trazo currentColor, 24 × 24 y 28 px visibles
OK    iconos (normal): están a la izquierda del texto y son los de iconos.js
OK    iconos (normal): el color del trazo es el del título de la tarjeta (mismo contraste que el texto)
OK    iconos: los cinco son distintos
OK    iconos: cada tarjeta conserva su título y su cuenta como nombre
OK    iconos.js trae exactamente los cinco iconos del plan
OK    micrófono: muestra el texto «Dictar» (visible, no sr-only) y su nombre accesible lo contiene
OK    iconos (normal): sin errores de consola
OK    iconos (oscuro): cinco tarjetas, cada una con un solo icono decorativo (aria-hidden, sin title), trazo currentColor, 24 × 24 y 28 px visibles
OK    iconos (oscuro): están a la izquierda del texto y son los de iconos.js
OK    iconos (oscuro): el color del trazo es el del título de la tarjeta (mismo contraste que el texto)
OK    iconos (oscuro): sin errores de consola
OK    iconos (alto): cinco tarjetas, cada una con un solo icono decorativo (aria-hidden, sin title), trazo currentColor, 24 × 24 y 28 px visibles
OK    iconos (alto): están a la izquierda del texto y son los de iconos.js
OK    iconos (alto): el color del trazo es el del título de la tarjeta (mismo contraste que el texto)
OK    iconos (alto): sin errores de consola
OK    iconos (alto-oscuro): cinco tarjetas, cada una con un solo icono decorativo (aria-hidden, sin title), trazo currentColor, 24 × 24 y 28 px visibles
OK    iconos (alto-oscuro): están a la izquierda del texto y son los de iconos.js
OK    iconos (alto-oscuro): el color del trazo es el del título de la tarjeta (mismo contraste que el texto)
OK    iconos (alto-oscuro): sin errores de consola
OK    columna a 1280 px: main y cabecera de 800 px como máximo, centrados, sin desplazamiento horizontal
OK    columna a 1100 px: main y cabecera de 800 px como máximo, centrados, sin desplazamiento horizontal
OK    columna a 900 px: main y cabecera de 800 px como máximo, centrados, sin desplazamiento horizontal
OK    columna a 700 px: main y cabecera de 800 px como máximo, centrados, sin desplazamiento horizontal
OK    columna a 390 px: main y cabecera de 800 px como máximo, centrados, sin desplazamiento horizontal
OK    orden a 390 px: aviso, temas, entidad, conversación y formulario (orden del DOM y posición vertical de los cuatro primeros)
OK    entidad a 390 px: el selector va plegado, con el resumen «Su entidad (opcional)»
OK    entidad a 390 px: con Enter se abre y se puede elegir
OK    entidad a 390 px: la entidad elegida queda en el selector
OK    orden a 1280 px: aviso, temas, entidad, conversación y formulario (orden del DOM y posición vertical de los cuatro primeros)
OK    entidad a 1280 px: el selector va plegado, con el resumen «Su entidad (opcional)»
OK    entidad a 1280 px: con Enter se abre y se puede elegir
OK    entidad a 1280 px: la entidad elegida queda en el selector
OK    sin desplazamiento interno: ningún contenedor de la columna tiene overflow-y auto o scroll
OK    sin desplazamiento interno: #log crece más que la ventana y se desplaza la página
OK    caja a 390 × 740 al 100 %, conversación vacía: fija y pegada al borde inferior
OK    caja a 390 × 740 con cinco respuestas: fija y pegada al borde inferior arriba, a la mitad y al final
OK    caja: con la página al final, el pie queda completo por encima de la caja
OK    caja en celular: el comienzo de la respuesta nueva no queda tapado (top > 0 y por encima de la caja)
OK    caja: --alto-form sigue al alto real de la caja cuando crece
OK    caja a 1280 × 800 al 100 %: fija y pegada al borde inferior
OK    caja a 390 × 740 al 200 %: su alto supera un tercio de la ventana y pasa a estática, al final de la columna
OK    caja a 740 × 390 (menos de 500 px de alto): estática
OK    caja: al girar la pantalla el modo cambia solo (fijo, estático, fijo)
OK    ONU a 320 px: va en la cabecera (position absolute), mide al menos 44 px y no choca con la marca ni con los botones
OK    ONU a 320 px: con la página arriba, a la mitad y al final no cubre ningún control ni respuesta
OK    ONU a 320 px: con el panel abierto, el panel queda por encima del botón
OK    ONU a 320 px: Alt + A abre el panel
OK    ONU a 360 px: va en la cabecera (position absolute), mide al menos 44 px y no choca con la marca ni con los botones
OK    ONU a 360 px: con la página arriba, a la mitad y al final no cubre ningún control ni respuesta
OK    ONU a 360 px: con el panel abierto, el panel queda por encima del botón
OK    ONU a 360 px: Alt + A abre el panel
OK    ONU a 390 px: va en la cabecera (position absolute), mide al menos 44 px y no choca con la marca ni con los botones
OK    ONU a 390 px: con la página arriba, a la mitad y al final no cubre ningún control ni respuesta
OK    ONU a 390 px: con el panel abierto, el panel queda por encima del botón
OK    ONU a 390 px: Alt + A abre el panel
OK    ONU a 639 px: va en la cabecera (position absolute), mide al menos 44 px y no choca con la marca ni con los botones
OK    ONU a 639 px: con la página arriba, a la mitad y al final no cubre ningún control ni respuesta
OK    ONU a 639 px: con el panel abierto, el panel queda por encima del botón
OK    ONU a 639 px: Alt + A abre el panel
OK    ONU a 640 px: flota (position fixed) y no tapa los controles del formulario
OK    ONU a 641 px: flota (position fixed) y no tapa los controles del formulario
OK    ONU a 800 px: flota (position fixed) y no tapa los controles del formulario
OK    ONU a 1024 px: flota (position fixed) y no tapa los controles del formulario
OK    ONU a 1280 px: flota (position fixed) y no tapa los controles del formulario
OK    cabecera a 320 px: margen de 16 px o más a los lados
OK    cabecera a 360 px: margen de 16 px o más a los lados
OK    cabecera a 390 px: margen de 16 px o más a los lados
OK    cabecera a 1100 px: margen de 16 px o más a los lados
OK    aviso plegado: se ve la frase corta completa, sin recortes
OK    aviso plegado: botón «Ver más», aria-expanded="false" y el texto largo oculto con el atributo hidden
OK    aviso desplegado con Enter: texto largo idéntico al de la v0.3 (con la versión de los documentos), debajo de la frase corta, y botón «Ver menos»
OK    aviso: con Espacio vuelve a quedar plegado y con hidden
OK    fuente (caso 1, texto común): formato de una línea
OK    fuente (caso 2, anexo): formato de una línea
OK    fuente (caso 4, acuerdo de una entidad): formato de una línea
OK    fuente (caso 5, dos fuentes): la primera completa y la segunda visible sin «· Borrador»
OK    fuente (caso 7, pasaje): formato de una línea
OK    fuente: ninguna insignia (.badge) en toda la página
OK    fuente: en cada respuesta, exactamente una fuente visible lleva «· Borrador»
OK    resaltado (caso 1, pregunta frecuente): ningún mark
OK    resaltado (caso 2, pregunta frecuente): ningún mark
OK    resaltado (caso 5, pregunta frecuente): ningún mark
OK    resaltado (caso 10, pregunta frecuente): ningún mark
OK    resaltado (caso 14, pregunta frecuente): ningún mark
OK    resaltado (caso 16, pregunta frecuente): ningún mark
OK    resaltado (caso 7, pasaje): los mark solo están en las frases clave
OK    resaltado (caso 8, pasaje): los mark solo están en las frases clave
OK    resaltado (caso 9, pasaje): los mark solo están en las frases clave
OK    resaltado: en los pasajes sí se resaltan las frases clave (al menos en un caso)
OK    resumen: «En pocas palabras» y su párrafo van en el recuadro, con la fuente fuera y debajo
OK    resumen: se distingue del texto oficial (borde completo de 2 px o más frente a 0 y no está dentro de él)
OK    resumen: las respuestas de pasaje no lo llevan
OK    opinión (pregunta frecuente): grupo «¿Le sirvió esta respuesta?» con «Sí» y «No», separado de Copiar e Imprimir
OK    opinión (pasaje): también lleva el grupo
OK    opinión «Sí»: anuncia «Gracias por su opinión.» y deshabilita ambos botones
OK    opinión «No»: registra «No le sirvió la respuesta» en la bitácora, anuncia el texto y deshabilita ambos
OK    opinión: «Depende de su entidad» no lleva el grupo
OK    opinión: «No encontrado» no lleva el grupo
OK    opinión: «Tema reservado» no lleva el grupo
OK    opinión: el saludo del chat no lleva el grupo
OK    copiar: el texto incluye el resumen y no incluye los botones, la opinión ni el aviso de voz
OK    copiar: los grupos de botones vuelven a mostrarse
OK    saludo: cuatro párrafos con el texto de la sección 6, el primero en negrita y N leído de kb.json
OK    saludo: ya no menciona el panel «Antes de preguntar» y no es una respuesta (sin data-tipo)
OK    saludo: no se lee solo al cargar
OK    saludo: con «Escuchar», la voz recibe los cuatro párrafos
OK    lectura automática: lee «En pocas palabras» y la línea de la fuente
OK    dentro de #log no hay role="status", role="alert" ni aria-live (con la opinión y el saludo)
OK    sin errores de consola en el diseño nuevo

Diseño y presentación: 110 OK, 0 con diferencias
Accesibilidad: axe 40/40, reflujo 20/20, teclado 8/8, voz 5/5, región viva 5/5. Informe: pruebas/INFORME_PRUEBAS.md
```

- **`pruebas/diseno.mjs` (nuevo, 110 comprobaciones):** iconos en las cuatro variantes de contraste (decorativos, 24 × 24 y 28 px visibles, a la izquierda del texto, iguales a `iconos.js`, con el color del título) y «Dictar»; columna a 1280, 1100, 900, 700 y 390 px (800 px como máximo, centrada, sin desplazamiento horizontal); orden aviso, temas, entidad, conversación, formulario, y selector de entidad plegado, que se abre con Enter; sin desplazamiento interno; caja fija a 390 × 740 y 1280 × 800 (vacía, con cinco respuestas, arriba, a la mitad y al final), pie por encima de la caja, respuesta nueva no tapada, `--alto-form` que sigue al alto real, estática a 390 × 740 con el texto al 200 % y a 740 × 390, y cambio de modo al girar; botón de la ONU en la cabecera a 320, 360, 390 y 639 px (sin chocar ni cubrir controles arriba, a la mitad y al final; el panel abierto queda encima; Alt + A) y flotante sin tapar el formulario de 640 a 1280 px; márgenes de 16 px en la cabecera; aviso (frase corta completa, `hidden`, texto largo idéntico al de la v0.3, teclado); línea de fuente de los casos 1, 2, 4, 5 y 7, sin `.badge`; resaltado; recuadro de resumen; opinión (grupo, «Sí», «No» con bitácora, ausencia en las demás respuestas); copiar; saludo (texto, `N` de `kb.json`, sin lectura al cargar, lectura con «Escuchar»); lectura automática; y regiones vivas.
- **`accesibilidad.mjs`:** estado nuevo «aviso y configuración desplegados» (con una respuesta y su opinión) en axe (40 combinaciones, todas sin violaciones) y en el reflujo a 320 px y 200 % (20 de 20, con el formulario en modo estático); el teclado incluye `aviso-alternar` y `entidad-resumen`.
- **Cambios en pruebas anteriores:** `navegacion.mjs` cuenta ahora una fuente visible con «· Borrador» en lugar de la insignia; `tablas_glosario.mjs` abre `#entidad-detalles` antes de elegir entidad y actualiza los selectores de impresión (`.aviso-inicio`, `#temas`, `#entidad-detalles`, `.opinion`); `funcional.mjs` y `perfiles.mjs` no cambiaron.
- El informe se regenera con la sección «Diseño y presentación» y las dos pruebas manuales nuevas (celular real y contraste forzado de Windows).

### Diferencias, decisiones y dudas

1. **Defectos que las pruebas de reflujo encontraron y se corrigieron:** con el icono, «reclamaciones» no cabía en la tarjeta a 320 px con texto al 200 % (se agregó `overflow-wrap: anywhere` al texto de la tarjeta); y los selectores de «Su entidad (opcional)» desbordaban por sus márgenes (ahora `width: calc(100% - 28px)`).
2. **Botones de opinión.** El plan decía `btn ghost`; usé `btn` (con borde) para que «Sí» y «No» se reconozcan como botones. Es un ajuste de estilo, sin cambio de comportamiento.
3. **Alto de la caja para decidir el modo.** Se mide `.form-interior` más 1 px de borde, no el formulario completo, para que la medida sea la misma en modo fijo y estático y el modo no oscile; en modo estático `.form-interior` conserva el mismo ancho de contenido.
4. **Cabecera en escritorio.** Con la columna de 800 px, los botones «Perfil», «Accesibilidad» y «Bitácora» pasan a una segunda fila debajo de la marca. Es consecuencia del ancho pedido; se puede ajustar.
5. **Tamaño de los botones de la cabecera en celular:** subieron de 0,7 a 0,8 rem para respetar el mínimo de 0,75 rem de la fase 7.
6. **Pruebas.** Las comprobaciones de visibilidad usan `checkVisibility()` porque Chromium da rectángulos a los elementos de un `<details>` cerrado, y las que dependen de una respuesta concreta la fijan por posición (`fijar`), porque `.last()` es un localizador perezoso que apunta a la respuesta más reciente en cada uso.
7. **No se hizo `git push`.** La versión publicada en GitHub Pages sigue siendo la v0.2; hay varios commits locales sin enviar.

## Ajuste posterior a la Fase 8 — Sin aviso inicial y saludo primero (6 de octubre de 2026)

A petición de la persona responsable: el aviso inicial «Prototipo con documentos en borrador. No escriba datos personales.» sobra («se sabe que es un prototipo») y la presentación «Hola. Soy el asistente del proceso de selección de Docentes y Directivos Docentes.» debe aparecer primero, antes de las preguntas frecuentes (los temas).

- **Aviso eliminado** por completo: la frase corta, el botón «Ver más» y el texto largo (con la versión de los documentos). Se quitaron su HTML, su CSS, su código en `main.js` y su referencia en la impresión.
- **Saludo arriba de los temas.** Ya no es el primer mensaje de la conversación: va en `<div id="saludo">`, antes de `#temas` y fuera de `#log`, por lo que no se anuncia como mensaje nuevo al cargar. Conserva su texto, sus botones «Escuchar» (con la opción activa), «Copiar» e «Imprimir», y se imprime solo si es lo que se imprime. Su encabezado oculto pasó a nivel 2 (si no, axe marcaba el salto de nivel después del título de la página). Orden final: saludo, temas, entidad (plegada), conversación, formulario.
- **Pruebas actualizadas:** `diseno.mjs` (orden con el saludo primero y fuera de la conversación; ya no existe el aviso; la sección del aviso se reemplazó por una del saludo) y `accesibilidad.mjs` (sin `aviso-alternar`; el estado «aviso y configuración desplegados» pasó a «configuración desplegada»; la prueba de región viva cuenta 3 respuestas dentro de `#log` y el saludo fuera). Siguen 40 combinaciones de axe y 20 de reflujo. Resultado: funcional 16/16, perfiles 108, tablas y glosario 63, navegación 94, diseño 110, axe 40/40, reflujo 20/20, teclado 8/8, voz 5/5, región viva 5/5.

### Para su revisión

- Con el aviso desaparecen de la pantalla inicial dos textos que no estaban en ninguna otra parte: «Orienta, pero no reemplaza los documentos oficiales: lo que dicen los actos administrativos de la CNSC prevalece» y «No escriba datos personales». Siguen la etiqueta «Borrador» en la fuente de cada respuesta y la nota de validez («Versión accesible para consulta. Rige el texto del acto administrativo que publique la CNSC.») al final de cada texto oficial. Si quiere conservar la advertencia de datos personales, una opción es ponerla en el texto de ayuda de la caja de pregunta.
- La versión de los documentos («Proyectos para participación ciudadana (borrador, no definitivos)») ya no se muestra en ninguna parte de la interfaz; sigue en `kb.json`.
- No se hizo `git push`: la versión publicada sigue siendo la v0.2.

### Texto de ayuda de la caja de pregunta (pedido posterior)

Se agregó «No escriba datos personales.» como texto de ayuda de la caja de pregunta (debajo de «Escriba su pregunta», enlazado con `aria-describedby`), para no perder esa advertencia al quitar el aviso inicial. Prueba nueva en `diseno.mjs` (112 comprobaciones); a 390 × 740 al 100 % la caja sigue siendo fija. Resultado final: funcional 16/16, perfiles 108, tablas y glosario 63, navegación 94, diseño 112, axe 40/40, reflujo 20/20, teclado 8/8, voz 5/5, región viva 5/5.

### Voz latinoamericana, v0.4.1 (pedido posterior)

La persona responsable pidió que la voz sea latina (Colombia). En este equipo solo hay tres voces locales en español y las tres son de España (Microsoft Helena, Laura y Pablo, es-ES); el motor del EBAR (`vendor/`, sin tocar) ya ordena las voces con la colombiana primero, luego las demás latinoamericanas y por último las de España, de modo que una voz latinoamericana instalada se usa por defecto. Lo que se agregó: un aviso junto a «Escuchar» cuando el equipo solo tiene voces de España (con cómo agregar «Español (México)» en Windows), y cuatro pruebas con voces simuladas (solo España, México, Colombia y «es» sin país). Resultado: funcional 16/16, perfiles 108, tablas y glosario 63, navegación 94, diseño 116, axe 40/40, reflujo 20/20, teclado 8/8, voz 5/5, región viva 5/5.

**Límite:** el asistente no puede instalar voces ni usar voces en línea (regla 4 de `CLAUDE.md`, que protege lo que se lee). Las voces colombianas existentes de Edge («Salomé», «Gonzalo») son en línea. Para ofrecerlas habría que cambiar esa regla y sustituir el motor de voz del EBAR, por lo que queda como decisión de la persona responsable.

### Logo de la CNSC, v0.4.2 (pedido posterior, 7 de octubre de 2026)

Se agregó a la cabecera el logo de la CNSC de IncluIA (`public/cnsc-logo.png`, PNG transparente de 227 x 96, copiado a `src/img/` con su SHA-256 en `src/img/ORIGEN.md`). Va incrustado como data URL al construir (marcador `%LOGO_CNSC%` en `index.html`), con el texto alternativo «Comisión Nacional del Servicio Civil», 44 px de alto sobre una placa blanca con borde (el texto del logo es negro y no se leería en los contrastes oscuros). En escritorio queda arriba a la derecha y los botones pasan a la segunda fila; en celular ocupa la primera fila, a la izquierda del botón de la ONU (se quitó el relleno que la marca reservaba para ese botón). Pruebas nuevas en `diseno.mjs` (140 comprobaciones): imagen cargada e incrustada, texto alternativo, placa blanca en los cuatro contrastes, márgenes de 16 px, orden de la cabecera, sin choques y sin solicitudes de red. Resultado: funcional 16/16, perfiles 108, tablas y glosario 63, navegación 94, diseño 140, axe 40/40, reflujo 20/20, teclado 8/8, voz 5/5, región viva 5/5. No se hizo `git push`.

## Fase 9 preparada, sin implementar (8 de octubre de 2026)

La persona responsable entregó dos insumos nuevos: el reporte de la OPEC y la matriz de observaciones ciudadanas y respuestas de la consulta pública (19 al 25 de agosto de 2026). Autorizó la OPEC como fuente adicional del asistente, y se escribió la fase 9 (v0.5) en `PLAN_IMPLEMENTACION.md`. **No se cambió código ni pruebas.**

- **OPEC usada:** `rp docentes 07.10.2026.xlsx`, la de cierre de la oferta, que reemplaza el corte del 6 de octubre. Hoja «Base de datos»: 31.164 vacantes (28.915 sin reserva y 2.249 con reserva para personas con discapacidad), 90 entidades y 2.291 números de OPEC. Frente al corte del 6 de octubre, las 501 vacantes «sin asociar» quedaron asociadas en 9 entidades, 21 vacantes pasaron de abierto a reserva y 1.945 vacantes cambiaron de número de OPEC.
- **Diferencia con los proyectos de acuerdo:** las tablas del artículo 8 suman 28.001 vacantes. Solo 21 de las 90 entidades coinciden con la OPEC; en 65 la OPEC tiene más vacantes y en 4 tiene menos (Córdoba, Magdalena, Manizales y Valledupar).
- **Alcance de la fase 9:** `herramientas/opec.py` (lee solo la hoja «Base de datos», con texto literal y validaciones) genera `opec.json`. Este se incrusta al construir, y se agrega el bloque «Vacantes en la OPEC» (tabla por empleo y modalidad, con un desplegable de número de OPEC, requisitos, funciones y tipos de discapacidad) en las respuestas cuya fuente principal es el artículo 8 de una entidad. Cambia el segundo párrafo del saludo. Se agregan `pruebas/opec.mjs` y el estado «respuesta con OPEC» en axe y reflujo (48 y 24).
- **Decisiones dentro del plan, para su revisión:**
  1. La OPEC no tiene una ruta de respuesta propia: aparece solo dentro de las respuestas del artículo 8, para no tocar el motor. Buscar por empleo o por número de OPEC queda como idea para después.
  2. El texto de la OPEC se muestra en mayúsculas, como viene, para respetar la regla de texto literal. Pasarlo a mayúscula inicial queda a decisión de la persona responsable.
  3. Las hojas de control del reporte no se usan, y el asistente no calcula el cumplimiento de la reserva del 7 %.
  4. Textos nuevos de interfaz, para aprobar: los de la sección 6, parte «Fase 9».
- **Matriz de observaciones:** 11.492 observaciones (235 acogidas, 1.901 acogidas parcialmente y 9.355 no acogidas) con datos personales en las observaciones. No se usa en la fase 9. Usarla como banco de preguntas para pruebas y sinónimos queda pendiente de autorización.

## Fase 9 — Vacantes, requisitos y funciones desde la OPEC, v0.5 (8 de octubre de 2026)

La persona responsable aprobó el plan e indicó implementarlo.

### Línea base (9.0)

`npm run prueba` en verde antes de empezar: funcional 16/16, perfiles 108, tablas y glosario 63, navegación 94, diseño 140, axe 40/40, reflujo 20/20, teclado 8/8, voz 5/5 y región viva 5/5. `openpyxl` 3.1.5 está instalado.

### Qué se hizo

- **`CLAUDE.md`:** la OPEC pasa a ser fuente del asistente (frase inicial y regla 1), y se agrega el comando de `opec.py`.
- **`herramientas/opec.py` (nuevo).** Lee solo la hoja «Base de datos» del reporte y solo 14 columnas. Valida modalidad, marca de discapacidad, requisitos únicos por empleo y emparejamiento de entidades. Genera `herramientas/opec.json`, de 487 kB, con los textos repetidos guardados una sola vez. Resumen con `rp docentes 07.10.2026.xlsx`, corte del 2026-10-07:
  - 31.164 vacantes: 28.915 sin reserva y 2.249 con reserva;
  - 90 entidades, 2.291 números de OPEC, 81 textos distintos y 0 vacantes excluidas;
  - alias usados: Cartagena → Cartagena de Indias, Cúcuta → San José de Cúcuta, La Estrella (Antioquia) → La Estrella y Lorica → Santa Cruz de Lorica. Santiago de Cali y Valle del Cauca se emparejaron con la normalización y no necesitaron alias.
- **`construir.mjs`.** Valida `opec.json` (fecha, entidades de `kb.json`, índices de texto y suma de vacantes) y lo incrusta como `opec`. El archivo pasó de 1,89 MB a 2,38 MB, por debajo del límite de 1 MB de crecimiento.
- **`src/js/opec.js` (nuevo).** Arma el bloque «Vacantes en la OPEC» con los textos de la sección 6. Fecha del corte con los meses escritos en una lista; cifras con `toLocaleString('es-CO')`.
- **`respuestas.js`.**
  - El bloque va después de la nota de validez y antes de «Otras fuentes relacionadas», cuando la fuente principal es `Artículo 8` del acuerdo de la entidad de la respuesta.
  - `imprimirRespuesta` no abre los `details.opec-empleo` cerrados.
  - El segundo párrafo del saludo incluye la OPEC y su fecha.
- **`main.js`:** llama a `iniciarOpec(datos.opec)`.
- **`chat.css`:** estilos del bloque, sin `text-transform`.
- **Versión:** v0.5 en `package.json` (0.5.0), la cabecera y el pie. `LEEME.md` tiene una sección nueva, «Cómo actualizar la OPEC»; también se actualizaron los requisitos, la estructura, las pruebas y las limitaciones, y se corrigió un salto de línea que faltaba en la lista «Qué hace». `CHANGELOG.md` tiene la entrada v0.5. `preguntas.json` pasa a `fase_actual: 9`.

### Pruebas

```
Fase 9: 16 OK, 0 con diferencias, 0 omitidos
Perfiles y bienvenida: 108 OK, 0 con diferencias
Tablas, glosario, temas reservados e impresión: 63 OK, 0 con diferencias
Navegación guiada y estructura de respuesta: 94 OK, 0 con diferencias
Diseño y presentación: 140 OK, 0 con diferencias
Vacantes en la OPEC: 43 OK, 0 con diferencias
Accesibilidad: axe 48/48, reflujo 24/24, teclado 8/8, voz 5/5, región viva 5/5.
```

`pruebas/opec.mjs` es nueva y tiene 43 comprobaciones:

- datos: 90 entidades, la suma de vacantes y ninguna clave ni código de verificación de más;
- el bloque aparece en los casos 4, 9 y E1 y no aparece en los casos 1, 2, 3, 5, 7, 11, 12 y 16;
- cifras por fila y total (Antioquia 2.076 + 157 = 2.233; Amazonas 36 + 3 = 39), línea de fuente sin «Borrador» y un solo «· Borrador» por respuesta;
- tabla con `caption` y encabezados de columna y de fila;
- detalle de «DOCENTE DE PRIMARIA» con teclado y textos literales, sin `text-transform`;
- impresión, regiones vivas, voz (lectura automática y «Escuchar»), saludo, red y consola.

En `accesibilidad.mjs` se agregó el estado «respuesta con OPEC» (caso 4, con el desplegable y un empleo abiertos) a axe y al reflujo. El informe tiene las secciones «Vacantes en la OPEC» y las dos pruebas manuales nuevas.

### Diferencias, decisiones y dudas

1. **Dos comprobaciones de `tablas_glosario.mjs` chocaban con el plan de la fase 9.** El plan decía que no debía cambiar. La primera esperaba que todo título de tabla empezara por «TABLA No.»; la tabla de la OPEC tiene su propio título, el de la sección 6. La segunda esperaba que al imprimir se abrieran todos los desplegables; el plan pide imprimir cerrados los empleos de la OPEC. Ahora miran solo lo que vigilaban: los títulos de `.official` y los desplegables que no son `.opec-empleo`. `opec.mjs` comprueba la impresión del bloque.
2. **Tolerancia de 1 px en `diseno.mjs`.** La comprobación «el comienzo de la respuesta nueva no queda tapado» falló de forma intermitente: `top` daba −0,11 px por un redondeo del desplazamiento suave. La pregunta de esa prueba no muestra la OPEC. Ahora acepta `top >= -1`, como las demás medidas de posición de esa prueba.
3. **Tabla en celular.** La primera versión partía los encabezados letra por letra («Sin reserv a»). Ahora los encabezados y el título cortan solo entre palabras. A 390 px la tabla es más ancha que la pantalla y se desplaza dentro de su contenedor, igual que las tablas del artículo 8. Reflujo y axe siguen en verde.
4. **La tabla usa el mismo contenedor que las tablas del texto oficial** (`.tabla-scroll` con `role="group"`, `tabindex="0"` y `aria-label`), para que sea navegable con teclado cuando se desplaza. El plan solo mencionaba `.tabla-scroll`.
5. **El `id` del encabezado del bloque** se numera en `opec.js` (`opec1`, `opec2`…) y no con el `id` de la respuesta, que se crea después en `addBot`. Sigue siendo único en la página.
6. **Pendiente de decisión de la persona responsable:** mostrar el texto de la OPEC con mayúscula inicial en lugar de mayúsculas sostenidas, y el uso de la matriz de observaciones.
7. **No se hizo `git push`.**

### Decisión posterior (8 de octubre de 2026)

La persona responsable decidió que el texto de la OPEC se siga mostrando como viene, en mayúsculas, porque las siglas deben verse en mayúscula. Se cierra el punto 6 de la lista anterior. Se quitó del pendiente de `CHANGELOG.md` y de las ideas del plan. No cambia el código.

### Publicación de la v0.5 (8 de octubre de 2026)

La persona responsable pidió publicar la v0.5. Antes del `git push` se quitó de la bitácora una nota interna de trabajo que no correspondía al repositorio público. Para no dejarla en la historia, se reescribieron los tres commits locales que aún no se habían enviado. Se enviaron a `master` («Plan de la fase 9», «Fase 9: vacantes, requisitos y funciones desde la OPEC» y «Fase 9: el texto de la OPEC se conserva en mayúsculas»). El flujo «Publicar en GitHub Pages» terminó sin errores, y la página https://angelicasanchezcnsc-stack.github.io/asistente-docentes/ muestra «v0.5 · Prototipo». La rama local de respaldo se borró. Las menciones anteriores de esta fase a «No se hizo `git push`» describen el estado antes de esta publicación.

## Fase 10 preparada, sin implementar (8 de octubre de 2026)

La persona responsable autorizó usar la matriz de observaciones de la consulta pública para dos fines: un banco de preguntas para medir el asistente y agregar sinónimos, y un informe de temas frecuentes sin pregunta frecuente para el equipo temático. Pidió que no quede ningún dato personal ni sensible de la ciudadanía. Se escribió la fase 10 (v0.6) en `PLAN_IMPLEMENTACION.md`. **No se cambió código ni pruebas.**

- **Diseño de privacidad.**
  - Todo texto derivado de la matriz va a `C:\01_APLICACIONES\CHATBOT\PRIVADO_CONSULTA_PUBLICA\`, fuera de la carpeta del proyecto, para que no llegue a git, a GitHub Pages ni a los .zip del proyecto.
  - El script lee solo dos columnas: «Artículo Acuerdo» y «Observación recibida».
  - Los filtros descartan oraciones con datos de contacto o identificación, en primera persona, con datos sensibles o con nombres propios que no están en los documentos.
  - Hay dos revisiones humanas: las preguntas candidatas y el vocabulario.
  - Los filtros se vuelven a aplicar al banco aprobado.
  - Hay una prueba de privacidad que revisa que ningún archivo versionado contenga texto de la ciudadanía.
  - En el proyecto solo quedan cifras agregadas y las palabras aprobadas como sinónimos.
  - La carpeta privada se borra cuando lo indique la persona responsable, a más tardar con los acuerdos definitivos.
- **Volumen estimado,** medido en memoria sin guardar texto: de 11.492 observaciones salen 598 oraciones con forma de pregunta. Los filtros descartan 37 en primera persona y 30 con nombres propios fuera de los documentos, y 95 están repetidas. Quedan unas 436 candidatas para la revisión humana.
- **Qué cambia en el asistente:** solo los sinónimos que la persona responsable apruebe, y solo si no cambian el resultado de ninguna prueba existente. El asistente no muestra observaciones ni respuestas de la consulta.

### Aclaración: quién es el «equipo temático» (8 de octubre de 2026)

El término venía de los textos del prototipo v0.1 y nunca se definió. La persona responsable aclaró que es ella quien concentra la información del prototipo y quien redacta y valida las preguntas frecuentes. En el plan (fase 10) y en `LEEME.md`, «equipo temático» pasa a «la persona responsable». Los textos de interfaz que todavía lo mencionan (respuesta «No encontrado» y panel de la bitácora) y la nota de `faq.json` quedan pendientes de su aprobación.

## Textos sin el «equipo temático», v0.5.1 (8 de octubre de 2026)

La persona responsable aprobó cambiar los textos que prometían que un «equipo temático» revisa cada pregunta, y corregir la nota de `faq.json`. Los textos nuevos están en el plan, sección 6, «Ajuste del 8 de octubre de 2026».

- `respuestas.js`: cambian el segundo párrafo y la lectura en voz alta de «No encontrado». El aviso de la opinión «No» pasa a «Gracias por su opinión.»; la bitácora sigue registrando el motivo «No le sirvió la respuesta».
- `index.html`: cambia la ayuda del panel de la bitácora, que ya no menciona «No me sirvió».
- `faq.json`: solo la clave `nota`, que ahora dice «borrador para validación de la persona responsable». Las preguntas frecuentes no cambian.
- Pruebas: en `diseno.mjs` se actualizó el aviso de «No» y se agregaron 4 comprobaciones (párrafo y lectura de «No encontrado», ayuda del panel y que ninguna parte de la página mencione al «equipo temático»).
- Versión 0.5.1.
- Resultado: funcional 16/16, perfiles 108, tablas y glosario 63, navegación 94, diseño 144, OPEC 43, axe 48/48, reflujo 24/24, teclado 8/8, voz 5/5 y región viva 5/5.
- No se hizo `git push`.

## Fase 11 preparada, sin implementar (8 de octubre de 2026)

La persona responsable pidió un diseño más minimalista, accesible y limpio, con burbujas de chat que distingan mejor a la persona del asistente y temas más pequeños, sin el número de preguntas. Se le mostró una maqueta y aprobó los puntos (a) a (d): texto oficial plegado, saludo corto con «Cómo respondo», «Temas» y «Su pregunta», y «Perfil» y «Bitácora» dentro de «Más». Se escribió la fase 11 en `PLAN_IMPLEMENTACION.md`, con los textos nuevos en la sección 6. **No se cambió código ni pruebas.**

- **Burbujas.**
  - La persona va a la derecha, en `#2C2C2C` con texto blanco y la esquina inferior derecha recortada.
  - El asistente va a la izquierda, en `#F1F1F1` sin borde y con la esquina inferior izquierda recortada; en alto contraste lleva borde de 2 px.
  - Se distinguen por color, lado y forma (WCAG 1.4.1).
- **Temas:** burbujas de una línea con icono de 18 px, sin conteo, y área táctil de 44 px.
- **Respuestas:**
  - a la vista quedan la respuesta corta y la fuente;
  - el texto oficial (con la nota de validez), la OPEC y las otras fuentes quedan en desplegables;
  - «Copiar» abre los desplegables para que el texto copiado siga incluyendo el texto oficial.
- **Texto nuevo propuesto dentro del plan, para revisión:** la aclaración de la pregunta frecuente pasa a «{estado}. Respuesta frecuente redactada a partir del texto oficial.», porque el texto oficial ya no «aparece abajo» a la vista.
- **Orden:** la fase 11 no depende de la fase 10. La persona responsable decide cuál va primero.

## Fase 10, pasos 10.0 y 10.1 — Preguntas candidatas de la consulta pública (8 de octubre de 2026)

La persona responsable aprobó este orden: publicar la v0.5.1, hacer el paso 10.1 para que ella revise las candidatas a su ritmo, implementar la fase 11 mientras tanto y cerrar la fase 10 cuando termine su revisión. También aprobó el texto de la aclaración de la fase 11: «{estado}. Respuesta frecuente redactada a partir del texto oficial.».

- **Publicación de la v0.5.1.** Se hizo `git push`. El flujo de GitHub Pages terminó sin errores, y la página muestra «v0.5.1 · Prototipo» sin la mención al «equipo temático».
- **Línea base.** El código del asistente no cambió desde la última corrida completa (v0.5.1: funcional 16/16, perfiles 108, tablas 63, navegación 94, diseño 144, OPEC 43, axe 48/48, reflujo 24/24, teclado 8/8, voz 5/5, región viva 5/5).
- **10.0:**
  - `CLAUDE.md`: regla 5 con la carpeta privada y comandos de `consulta_publica.py`;
  - `.gitignore`: `privado/` y `PRIVADO_CONSULTA_PUBLICA/` como resguardo.
- **10.1: `herramientas/consulta_publica.py extraer`.**
  - Lee solo «Artículo Acuerdo» y «Observación recibida».
  - Escribe `candidatas.csv` en `C:\01_APLICACIONES\CHATBOT\PRIVADO_CONSULTA_PUBLICA\`, fuera del proyecto.
  - No sobrescribe un archivo existente sin `--sobrescribir`, para no perder una revisión hecha.
  - Los subcomandos `banco` y `sinonimos` se implementan después de la revisión.
- **Refuerzo del filtro de primera persona.** Al revisar solo las primeras palabras de las candidatas (sin leer las oraciones completas), aparecieron verbos en primera persona que el filtro del plan no cubría («hago», «deseo», «quisiera», «considero»). Se agregaron 19 formas verbales y el plan quedó actualizado.
- **Resultado (solo conteos):**
  - 11.492 observaciones y 556 oraciones interrogativas;
  - descartadas: 70 en primera persona, 42 con nombres propios fuera de los documentos, 0 con datos de contacto o identificación y 0 con datos sensibles; 70 repetidas;
  - **374 candidatas** para revisión.
  - Verificación sobre el archivo: 0 correos, 0 enlaces, 0 números de 5 o más dígitos, y 0 filas que no pasen de nuevo los filtros.
- **Pendiente:** la revisión de `candidatas.csv` por la persona responsable, con `si` o `no` en la columna `decision`.

## Fase 11 — Diseño minimalista, v0.6 (8 de octubre de 2026)

Se implementó antes del cierre de la fase 10, según el orden que aprobó la persona responsable. Por eso es la v0.6 y la fase 10 pasa a v0.7.

### Línea base (11.0)

`npm run prueba` estaba en verde con la v0.5.1 (funcional 16/16, perfiles 108, tablas 63, navegación 94, diseño 144, OPEC 43, axe 48/48, reflujo 24/24). Las capturas del antes se tomaron del `asistente-docentes.html` del último commit y se guardaron fuera del repositorio.

### Qué se hizo

- **`temas.css`:** tokens `--burbuja-bot` y `--burbuja-bot-borde` en las cuatro variantes, con los valores de 11.1.
- **`marca-earm.css`:**
  - fondo de la página en `--superficie` y sin degradados decorativos;
  - cabecera de una fila (`.tools` con `flex: none`);
  - estilos del botón «Más» y su menú.
- **`chat.css`:**
  - burbujas de 11.2;
  - `.resumen` sin recuadro;
  - `.pie-respuesta`, que reúne acciones y opinión con botones sin borde, subrayados con el foco o el puntero;
  - `details.more > summary` con 10 px de relleno, para que su área táctil llegue a unos 44 px;
  - caja de pregunta en forma de burbuja, con «Su pregunta · No escriba datos personales.» en una línea;
  - el pie de la burbuja no se dibuja si no tiene acciones visibles (el saludo sin «Escuchar»);
  - sin espacio vacío arriba de la primera línea de la burbuja.
- **`navegacion.css`:**
  - temas como burbujas de 44 px, con icono de 18 px;
  - preguntas del tema con borde fuerte y «Volver a los temas» con borde discontinuo;
  - «Su entidad (opcional)» como burbuja.
  - En celular: arriba la marca en una línea con el botón de la ONU; abajo el logo y los botones; márgenes más cortos (12 px arriba y 8 px entre bloques) para que el saludo y los cinco temas quepan a 390 × 844.
- **`index.html`:**
  - cabecera sin `.earm-version`, con `role="group"` en lugar de `toolbar` y el botón «Más» (divulgación con `aria-expanded` y `aria-controls`);
  - título «Temas»;
  - etiqueta «Su pregunta» y `textarea` de una fila.
- **`temas.js`:** sin el conteo de preguntas.
- **`respuestas.js`:**
  - texto oficial plegado (`textoOficialPlegado`, con la nota de validez dentro);
  - pasajes con frases clave con el texto completo plegado;
  - aclaración nueva;
  - acciones y opinión en `.pie-respuesta`;
  - «Copiar» abre y vuelve a cerrar lo plegado;
  - el saludo sin «Copiar» ni «Imprimir», con dos párrafos visibles y «Cómo respondo».
- **`opec.js`:** bloque dentro de `details.opec-plegable` con el total, y el `h3` en `sr-only`.
- **`main.js`:**
  - menú «Más»: se cierra con Escape (el foco vuelve a «Más»), con un clic fuera o al elegir;
  - al cerrar la bitácora o el perfil, el foco vuelve a «Más»;
  - la caja de pregunta crece hasta 180 px.
- **`impresion.css`:** oculta `.pie-respuesta`.
- **Versión:** 0.6.0 en `package.json` y v0.6 en el pie. Se actualizaron `LEEME.md` y `CHANGELOG.md`, y el informe de pruebas lista la prueba manual de la fase 11.

### Pruebas

```
Fase 9: 16 OK, 0 con diferencias, 0 omitidos
Perfiles y bienvenida: 108 OK, 0 con diferencias
Tablas, glosario, temas reservados e impresión: 63 OK, 0 con diferencias
Navegación guiada y estructura de respuesta: 94 OK, 0 con diferencias
Diseño y presentación: 187 OK, 0 con diferencias
Vacantes en la OPEC: 45 OK, 0 con diferencias
Accesibilidad: axe 56/56, reflujo 28/28, teclado 8/8, voz 5/5, región viva 5/5.
```

- **`diseno.mjs` (de 144 a 187 comprobaciones).** En las cuatro variantes revisa:
  - lado, fondo y esquinas de las burbujas;
  - contraste sobre la burbuja del asistente (normal: texto 12,4:1, secundario 7,4:1, enlaces 5,9:1);
  - borde de 2 px en alto contraste;
  - fondo plano.

  Además revisa los temas (44 px, redondeados, título «Temas»), la cabecera de una fila sin versión, «Más» (Enter, Escape con foco, clic fuera, «Bitácora» y foco al cerrarla), la caja de pregunta (etiqueta, 44 px y crecimiento hasta 180 px), «Ver texto oficial» con su resumen, la nota de validez y la apertura con Enter, la aclaración nueva, la fila de acciones, la copia con lo plegado, los pasajes, la OPEC plegada y el inicio a 390 × 844 con el saludo y los cinco temas.
- **Comprobaciones actualizadas según el plan:**
  - `diseno.mjs`: iconos de 18 px; nombre del tema sin la cuenta; caso 5 con «Ver texto oficial» abierto; resumen sin recuadro; saludo corto con «Cómo respondo»; disposición del logo;
  - `navegacion.mjs`: título «Temas», tarjetas sin cuenta, «Perfil» dentro de «Más»;
  - `perfiles.mjs`: «Perfil» dentro de «Más» y el foco vuelve a «Más»;
  - `opec.mjs`: bloque plegado con su total (2 comprobaciones nuevas), se abre antes del detalle y de «Escuchar», y el párrafo de fuentes del saludo va en «Cómo respondo»;
  - `accesibilidad.mjs`: estado «menú «Más» abierto» (56 y 28), teclado con `btn-mas`, versión leída del pie.
  - `funcional.mjs` y `tablas_glosario.mjs` no cambiaron.

### Diferencias, decisiones y dudas

1. **Logo a 320 px.** El logo y los dos botones no caben en una fila, y los botones bajan a una tercera fila. La prueba lo acepta solo en celular y solo si los botones quedan debajo del logo. A 390 px van en la misma fila.
2. **Logo de la CNSC.** Al ajustar el celular lo reduje primero a 32 px, sin que el plan lo pidiera. Lo devolví a 44 px.
3. **Foco al cerrar la bitácora.** Se mueve en el evento `close` del diálogo, que el navegador dispara en una tarea posterior. La prueba espera hasta 1 s.
4. **Pasaje de Amazonas (caso 9).** No tiene frases clave, así que su texto oficial queda a la vista (regla 11.4, paso 2). La prueba distingue los dos casos.
5. **Capturas del antes y el después** (escritorio y celular, inicio y respuesta) fuera del repositorio. Se enviaron a la persona responsable.
6. **No se hizo `git push`.**

### Publicación de la v0.6 (8 de octubre de 2026)

La persona responsable pidió publicar la v0.6. Antes del `git push` se comprobó que ningún archivo versionado viene de la carpeta privada. Se enviaron a `master` los commits del paso 10.1 y de la fase 11. El flujo «Publicar en GitHub Pages» terminó sin errores, y la página https://angelicasanchezcnsc-stack.github.io/asistente-docentes/ muestra la v0.6 en el pie, el título «Temas» y el botón «Más». Las menciones anteriores de la fase 11 a «No se hizo `git push`» describen el estado antes de esta publicación.


## Fase 10, pasos 10.2 a 10.7 — Banco, medición, sinónimos e informe (8 de octubre de 2026)

- **10.2. Revisión.** La persona responsable revisó `candidatas.csv` e indicó en el chat que todas las preguntas son «sí». No llenó la columna, así que el agente escribió `si` en las 374 filas por instrucción expresa de ella. Es su decisión, no del agente.
- **10.3. Banco.** `consulta_publica.py banco`:
  - 374 aprobadas y 0 rechazadas, todas con fuente esperada;
  - los filtros se volvieron a aplicar y ninguna falla;
  - `vocabulario.csv` tiene solo 3 palabras («clara», 11 preguntas; «claramente», 7; «claro», 7).
  - Se agregó el subcomando `verificar`, que la prueba de privacidad usa para repetir los filtros sin duplicarlos en JavaScript.
- **10.4. Medición (línea base, v0.6, sin entidad).** Prueba nueva `pruebas/consulta_publica.mjs` (6 comprobaciones, en verde). La parte de privacidad comprueba:
  - que la carpeta privada está fuera del proyecto;
  - que git no versiona archivos privados;
  - que ningún archivo versionado contiene preguntas del banco (360 de 30 o más caracteres revisadas);
  - que el banco pasa de nuevo los filtros;
  - que los resultados no contienen preguntas.

| Tipo de respuesta | % de las 374 |
| --- | --- |
| Pregunta frecuente | 0 |
| Pasaje | 15,5 |
| Depende de su entidad | 0,5 |
| No encontrado | 83,7 |
| Tema reservado | 0,3 |

  De las respuestas de pasaje, el 10,3 % cita como fuente principal el artículo o capítulo que la persona comentó.
- **Lectura de la medición.** Son preguntas escritas para comentar un borrador; muchas piden cambios o explicaciones del porqué, y no preguntan por una regla. Aun así, muestran que el motor, con sus umbrales actuales (`faqOk` y `passOk` de la fase 1), casi no reconoce cómo pregunta la ciudadanía. No se cambiaron umbrales (prohibido por el plan). Mejorar esto requiere preguntas frecuentes nuevas o revisar los umbrales en una fase aparte.
- **10.5. Sinónimos.**
  - `construir.mjs` lee `herramientas/sinonimos_ciudadania.json`, valida cada palabra (forma, y que no esté en `SYN` ni en `STOP`) y la incluye como `sinonimos`;
  - `main.js` hace `Object.assign(SYN, datos.sinonimos)` antes de crear los índices;
  - con el vocabulario de 3 palabras sin equivalencias, el archivo queda vacío (`{}`) y las pruebas existentes dan lo mismo.
- **10.6. Informe.** Se agregó el subcomando `informe "<matriz>"` (en lugar de que la prueba completara el informe): escribe `temas_frecuentes.md` en la carpeta privada, con la medición por artículo y hasta 5 ejemplos. Sin ejemplos, los artículos más observados son:

| Artículo o capítulo | Observaciones | Aprobadas | Pregunta frecuente | Sin respuesta (%) |
| --- | --- | --- | --- | --- |
| Artículo 19 (valoración de antecedentes) | 1.292 | 70 | ninguna | 82,9 |
| Anexo, capítulo 5 (valoración de antecedentes) | 520 | 26 | ninguna | 84,6 |
| Artículo 8 (empleos convocados) | 366 | 34 | vacantes-entidad, un-empleo | 79,4 |
| Artículo 13 (pruebas y ponderación) | 335 | 20 | pruebas-pesos, puntaje-minimo | 90,0 |
| Observación sobre la OPEC | 322 | 14 | vacantes-entidad, un-empleo | 57,1 |
| Artículo 7 (requisitos y exclusión) | 306 | 11 | requisitos-generales | 63,6 |
| Artículo 5 (normas que rigen) | 278 | 5 | ninguna | 60,0 |
| Artículo 1 (convocatoria) | 268 | 6 | ninguna | 100 |
| Anexo, capítulo 4 (verificación de requisitos) | 256 | 12 | reclamacion-vrm | 91,7 |
| Artículo 17 (verificación de requisitos) | 252 | 5 | ninguna | 100 |

- **10.7.** Se actualizaron `LEEME.md` (sección «Consulta pública»), `CHANGELOG.md` (fase 10, sin cambio de versión porque no hay sinónimos) y el informe de pruebas (secciones 11b y 11c, solo cifras).
- **Pruebas:** funcional 16/16, perfiles 108, tablas 63, navegación 94, diseño 187, OPEC 45, consulta pública 6, axe 56/56, reflujo 28/28, teclado 8/8, voz 5/5 y región viva 5/5.
- **No se hizo `git push`.**
