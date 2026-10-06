# Plan de implementación — Asistente Docentes v0.2

Versión del plan: 6 de octubre de 2026 (las fases 7 y 8 se agregaron el mismo día, después de cerrar las fases 0 a 6). Responsable funcional: Angélica (Despacho EARM, CNSC).

Este plan está escrito para que un agente de código lo ejecute sin interpretar. Cada fase dice qué archivos tocar, qué hacer, qué no hacer y cómo se comprueba que quedó bien. Ejecuta las fases en orden. No adelantes trabajo de una fase posterior.

---

## 1. Objetivo de esta versión

Llevar el prototipo v0.1 a una v0.2 que:

1. Mantenga exactamente el comportamiento actual de búsqueda y respuesta (con fuente, sin inventar).
2. Use el **panel de herramientas de accesibilidad del Instrumento EBAR** (el mismo de IncluIA), con temas definidos uno por uno y lectura en voz alta solo con voces locales.
3. Incorpore de **Lexible** la bienvenida de accesibilidad: perfiles por tipo de discapacidad, aviso de lector de pantalla externo y atajos de teclado.
4. Lea las tablas fila por fila, enlace un glosario literal, bloquee los temas en reserva de Sala Plena y permita imprimir una respuesta.
5. Siga la identidad visual del kit EARM (la misma de Lexible e IncluIA).
6. Quede probado con Playwright y axe-core.
7. (Fase 7, v0.3) Se pueda recorrer sin escribir, con tarjetas de temas, un buscador de entidad dentro de la respuesta y una estructura fija de respuesta con letra más grande y sin mayúsculas sostenidas.
8. (Fase 8, v0.4) Se muestre en una sola columna, resuelva el celular y presente cada respuesta con una línea de fuente, un recuadro de resumen y la opinión como grupo propio.

Fuera de alcance: modelos de IA, servidor, base de datos, la colección de municipios (la construye otra persona), cambios en el contenido de las preguntas frecuentes.

---

## 2. Estado actual (v0.1)

Carpeta del proyecto: `C:\01_APLICACIONES\CHATBOT\PROTOTIPO ASISTENTE DOCENTES\`

```
PROTOTIPO ASISTENTE DOCENTES/
├── asistente-docentes.html        ← resultado (se abre con doble clic)
├── LEEME.md
└── herramientas/
    ├── extract.py                 ← lee los HTML accesibles (Lexible) y genera raw.json
    ├── buildkb.py                 ← genera kb.json (textos únicos, acuerdos, texto común)
    ├── construir_html.py          ← inyecta kb.json y faq.json en plantilla.html
    ├── plantilla.html             ← TODA la app: HTML + CSS + JS en un archivo (~640 líneas)
    ├── faq.json                   ← 12 preguntas frecuentes con fuente
    ├── kb.json                    ← base de conocimiento (~1,3 MB)
    └── raw.json                   ← intermedio (13 MB, no se versiona)
```

Fuentes de datos (no se tocan): `C:\01_APLICACIONES\CHATBOT\ACUERDOS DOCENTES Y DIRECTIVOS DOCENTOS ACCESIBLES\*.html` (90 acuerdos) y `C:\01_APLICACIONES\CHATBOT\Proyecto Anexo Tecnico Docentes 2026 Formato accesible_accesible.html`.

Cómo funciona hoy `plantilla.html` (léelo completo en la fase 0):

- `window.KB` y `window.FAQ` se inyectan como JSON.
- Motor de búsqueda propio (BM25 con grupos de sinónimos, normalización sin tildes, raíz de 6 letras), funciones `norm`, `stem`, `toks`, `qgroups`, clase `Index`.
- `answer(q)` decide entre: pregunta frecuente (`faqOk`), «Depende de su entidad», pasaje del documento (`passOk`) o «No encontrado» (registra en bitácora).
- Selector de entidad (90 entidades) y detección de entidad en el texto de la pregunta.
- Bitácora en `localStorage` con descarga CSV.
- Botones de cabecera: A−, A+, Alto contraste, Lectura automática, Bitácora. Selector de velocidad de voz. Voz con `speechSynthesis` (cualquier voz: **esto se corrige en la fase 2**).

---

## 3. Recursos que se reutilizan (solo lectura)

Pide acceso de lectura a estas carpetas si no lo tienes.

**EBAR (dentro de IncluIA)** — `C:\01_APLICACIONES\INCLU-IA\01_APP_VIGENTE\inclu-ia\`

| Archivo | Para qué |
| --- | --- |
| `public\ebar\js\panel-accesibilidad.js` | Panel completo. Exporta `iniciarPanelAccesibilidad(config)` y `PREDETERMINADO`. |
| `public\ebar\js\voz-motor.js` | Motor de voz: solo voces locales, lee tablas fila por fila. Exporta `hablar`, `callar`, `frasesDe`, `fragmentos`, `hayVoz`, `vocesDisponibles`, `vozPreferida`, `alCambiarVoces`, `lecturaSoportada`. |
| `public\ebar\css\panel-accesibilidad.css` | Estilos del panel y de las opciones globales (enlaces, cursor, animaciones, dislexia, foco, guía, objetivos). Usa `url('../fuentes/…')`. |
| `public\ebar\fuentes\*` | Atkinson Hyperlegible Next (3 pesos, OFL) y OpenDyslexic (2 pesos, licencia propia). Copia también `OFL.txt` y `OpenDyslexic-LICENCIA.txt`. |
| `components\AccessibilityWidget.tsx` | **Ejemplo de integración** del panel en una app distinta al EBAR: configuración, `aplicar(estado)`. Úsalo como modelo. |
| `app.css` (líneas 7 a 60) | Ejemplo de tokens `--a11y-*` con la paleta EARM. |

**Lexible** — `C:\01_APLICACIONES\LEXIBLE\lexible-revisada\Lexible-revisada-20261005\` (solo referencia de diseño; no se copia código React)

| Archivo | Para qué |
| --- | --- |
| `components\AccessibilityPanel.tsx` líneas 36–116 | Lista de perfiles y sus descripciones. |
| `components\AccessibilityPanel.tsx` líneas 836–860 | Bloque de atajos de teclado. |
| `app.css` | Clases de marca `.earm-brand-mark`, `.earm-wordmark`, `.earm-version`, `.earm-footer`. |

---

## 4. Estructura de destino

```
PROTOTIPO ASISTENTE DOCENTES/
├── CLAUDE.md
├── PLAN_IMPLEMENTACION.md
├── BITACORA_IMPLEMENTACION.md     ← la creas en la fase 0 y la actualizas en cada fase
├── CHANGELOG.md
├── LEEME.md
├── package.json                   ← scripts construir y prueba; devDependencies: esbuild, playwright, axe-core
├── .gitignore                     ← node_modules/, herramientas/raw.json, pruebas/resultados/
├── asistente-docentes.html        ← RESULTADO (generado, sí se versiona)
├── src/
│   ├── index.html                 ← estructura HTML con marcadores <!--CSS--> <!--JS--> <!--DATOS-->
│   ├── css/
│   │   ├── marca-earm.css         ← tokens EARM, cabecera, pie
│   │   ├── temas.css              ← 4 variantes de contraste (fase 2)
│   │   ├── chat.css               ← conversación, respuestas, formulario
│   │   ├── navegacion.css         ← fase 7: tarjetas de temas y buscador de entidad
│   │   └── impresion.css          ← fase 4
│   └── js/
│       ├── main.js                ← punto de entrada
│       ├── motor-busqueda.js      ← norm, stem, toks, qgroups, Index, STOP, SYN
│       ├── base-conocimiento.js   ← pasajes, alcance por entidad, FAQ, detección de entidad
│       ├── respuestas.js          ← answer(), dibujo de respuestas
│       ├── bitacora.js
│       ├── accesibilidad.js       ← fase 2: integra el panel EBAR
│       ├── bienvenida.js          ← fase 3: perfiles Lexible
│       ├── glosario.js            ← fase 4
│       ├── reservados.js          ← fase 4
│       ├── temas.js               ← fase 7: tarjetas de temas
│       ├── entidades.js           ← fase 7: buscador de entidad
│       └── iconos.js              ← fase 8: iconos de línea
├── vendor/ebar/                   ← copias SIN MODIFICAR (fase 2)
│   ├── ORIGEN.md                  ← ruta de origen, fecha y SHA-256 de cada archivo
│   ├── js/panel-accesibilidad.js
│   ├── js/voz-motor.js
│   ├── css/panel-accesibilidad.css
│   └── fuentes/…
├── herramientas/
│   ├── extract.py  buildkb.py  faq.json  kb.json
│   ├── glosario.json              ← fase 4
│   ├── temas_reservados.json      ← fase 4
│   ├── temas.json                 ← fase 7: temas y sus preguntas frecuentes
│   └── construir.mjs              ← reemplaza a construir_html.py (fase 1)
└── pruebas/
    ├── preguntas.json             ← casos y resultado esperado
    ├── funcional.mjs
    ├── accesibilidad.mjs
    ├── navegacion.mjs             ← fase 7
    ├── diseno.mjs                 ← fase 8
    └── INFORME_PRUEBAS.md         ← generado
```

`construir.mjs` hace esto, en orden:

1. Empaqueta `src/js/main.js` con esbuild (`bundle: true`, `format: 'iife'`, `target: 'es2020'`, sin minificar para que sea legible).
2. Empaqueta las hojas CSS con esbuild (`loader: { '.woff': 'dataurl', '.woff2': 'dataurl' }`), de modo que las fuentes quedan incrustadas.
3. Lee `kb.json`, `faq.json` (y desde la fase 4 el glosario y los temas reservados) y los inserta como `<script type="application/json" id="datos-kb">…</script>`, reemplazando cada `</` por `<\/`.
4. Sustituye los marcadores de `src/index.html` y escribe `asistente-docentes.html`. Imprime el tamaño final.

---

## 5. Fases

### Fase 0 — Preparación y línea base

1. Comprueba `node -v` (22 o superior) y `python --version` (3.10 o superior) con `beautifulsoup4`. Si falta algo, **detente** y explica a la persona qué instalar; no instales software del sistema.
2. `git init` si no hay repositorio. Crea `.gitignore` (ver sección 4). Primer commit con el estado actual: «Estado inicial v0.1».
3. Crea `package.json` con `esbuild`, `playwright` y `axe-core` como devDependencies y los scripts `construir` y `prueba`. `npx playwright install chromium`.
4. En `herramientas/plantilla.html`, en la función que agrega la respuesta (`addBot`), agrega al `<article>` tres atributos de datos, sin cambiar nada más:
   - `data-tipo`: `faq`, `pasaje`, `depende-entidad`, `no-encontrado` (más adelante `tema-reservado`).
   - `data-fuentes`: los rótulos de las fuentes mostradas, separados por ` | ` (por ejemplo `Artículo 13, Parágrafo segundo`).
   - `data-entidad`: la entidad usada, o vacío.
   - `data-fuente-principal`: el rótulo de la fuente principal de la respuesta (la primera del bloque «Texto oficial»), sin las de «Otras fuentes relacionadas».
   Regenera con `python herramientas/construir_html.py`.
5. Crea `pruebas/preguntas.json` con los casos de la sección 7 y `pruebas/funcional.mjs` (Playwright, Chromium, abre el archivo con `file://`, escribe cada pregunta, espera la respuesta y compara `data-tipo`, `data-fuentes` y `data-entidad`). Los casos marcados «desde fase 4» se omiten hasta esa fase.
6. Corre la prueba y guarda la salida en la bitácora como **línea base**.

**Aceptación:** la prueba funcional pasa todos los casos vigentes con el archivo actual. Commit «Fase 0: línea base de pruebas».

### Fase 1 — Separar el código y construir con esbuild (sin cambiar comportamiento)

1. Divide `plantilla.html` en la estructura de `src/` de la sección 4. Convierte el JavaScript en módulos ES (`import`/`export`). Mueve sin reescribir: misma lógica, mismos umbrales (`faqOk`: `cov >= 0.66` y `wcov >= 0.6`; `passOk`: `wcov >= 0.6` y `s >= 1`; especificidad por entidad: `wcov >= 0.8`), mismos sinónimos y palabras vacías.
2. Los datos ya no van en `window.KB`: `main.js` los lee de `<script type="application/json" id="datos-kb">` con `JSON.parse`.
3. Escribe `herramientas/construir.mjs` (sección 4) y el script `npm run construir`. Borra `construir_html.py` y `plantilla.html` solo cuando el nuevo resultado pase las pruebas.
4. Actualiza `LEEME.md` con los comandos nuevos.

**Aceptación:** `npm run construir` genera `asistente-docentes.html`; abre con doble clic sin errores de consola; `npm run prueba` da los mismos resultados que la línea base. Commit «Fase 1: código separado y construcción con esbuild».

### Fase 2 — Panel de accesibilidad del EBAR, temas y voz local

1. Copia a `vendor/ebar/` los archivos de la sección 3 (EBAR) **sin modificarlos**. Escribe `vendor/ebar/ORIGEN.md` con la ruta de origen, la fecha y el SHA-256 de cada archivo.
2. Elimina de la cabecera los botones A−, A+, Alto contraste y Lectura automática, y el selector «Velocidad de la voz». Conserva «Bitácora». Agrega en la cabecera un botón «Accesibilidad» (con el texto visible) que también abra el panel.
3. En `src/js/accesibilidad.js`, inicia el panel siguiendo el modelo de `AccessibilityWidget.tsx`:

```js
import { iniciarPanelAccesibilidad } from '../../vendor/ebar/js/panel-accesibilidad.js';

export const panel = iniciarPanelAccesibilidad({
  clave: 'accesibilidad.preferencias',          // misma clave que EBAR e IncluIA
  aplicar,                                      // ver abajo
  contenedorLectura: () => document.getElementById('log'),
  bloquesSueltos: true,
  conBotonesEscuchar: true,
  disparadores: [document.getElementById('btn-accesibilidad')],
  opciones: ['texto', 'contraste', 'espaciado', 'interlineado', 'tipografia', 'dislexia',
             'facilitado', 'enlaces', 'animaciones', 'cursor', 'guia', 'foco', 'objetivos'],
  textos: { botonesEscuchar: 'Botón «Escuchar» en cada respuesta' }
});
```

   `aplicar(estado)` hace solo esto: `document.documentElement.style.fontSize = estado.texto + '%'`; marca o desmarca la clase `tipografia-legible` en `<html>`; y muestra u oculta los botones «Escuchar» de las respuestas según `estado.botonesEscuchar` (con el atributo `hidden`, para que no sumen paradas de tabulación cuando están apagados). El contraste lo leen las hojas de estilo desde `data-a11y-contraste`, que el panel ya publica en `<html>`.

4. Importa `vendor/ebar/css/panel-accesibilidad.css` desde la hoja principal para que esbuild incruste las fuentes. Define en `marca-earm.css`, con `html:root`, los tokens `--a11y-*` copiados de `inclu-ia/app.css` (líneas 14 a 23).
5. En `src/css/temas.css` define las **cuatro variantes** con variables CSS, una por valor de `html[data-a11y-contraste]`. Nada de inversión de colores ni reglas `body * { … !important }`. Valores:

| Variable | `normal` | `oscuro` | `alto` | `alto-oscuro` |
| --- | --- | --- | --- | --- |
| `--fondo` | #FAFAFA | #1A1B1E | #FFFFFF | #000000 |
| `--superficie` | #FFFFFF | #24262B | #FFFFFF | #000000 |
| `--texto` | #2C2C2C | #F1F1F1 | #000000 | #FFFFFF |
| `--texto-secundario` | #4F4F4F | #C8C8C8 | #000000 | #FFFFFF |
| `--borde` | #D6D6D6 | #4A4D55 | #000000 | #FFFFFF |
| `--grosor-borde` | 1px | 1px | 2px | 2px |
| `--acento` (botón principal) | #FFEE58 | #FFEE58 | #FFEE58 | #FFEE58 |
| `--acento-texto` | #2C2C2C | #2C2C2C | #000000 | #000000 |
| `--enlace` | #1D4ED8 | #93C5FD | #0000CC | #FFEE58 |
| `--foco` | #1D4ED8 | #FFEE58 | #000000 | #FFEE58 |
| `--oficial-fondo` | #FFFEF3 | #2B2A1F | #FFFFFF | #000000 |
| `--resaltado-fondo` | #FFF59D | #6B5F00 | #FFEE58 | #FFEE58 |
| `--resaltado-texto` | #2C2C2C | #FFFFFF | #000000 | #000000 |
| `--usuario-fondo` | #2C2C2C | #FFEE58 | #000000 | #FFEE58 |
| `--usuario-texto` | #FFFFFF | #1A1B1E | #FFFFFF | #000000 |
| `--aviso-fondo` | #FFFBEB | #3A2E05 | #FFFFFF | #000000 |
| `--aviso-texto` | #78350F | #FDE68A | #000000 | #FFEE58 |

   El botón principal en las variantes de alto contraste lleva borde de 2px del color de `--texto`. Las orbes decorativas del fondo solo se ven en `normal`. Revisa si `panel-accesibilidad.css` ya trae reglas para `data-a11y-contraste`; si las trae, no las dupliques.

6. Define lo que significa `data-a11y-facilitado='si'` en `chat.css`: ancho máximo de 65 caracteres en los textos de respuesta, 1,2 em entre párrafos, «Otras fuentes relacionadas» siempre cerrado y orbes ocultas.
7. **Voz:** borra la función `speak()` propia. Los botones «Escuchar» de cada respuesta usan el motor del EBAR:

```js
import { hablar, callar, frasesDe, fragmentos, hayVoz, vozPreferida } from '../../vendor/ebar/js/voz-motor.js';
// al pulsar Escuchar sobre el <article> de la respuesta:
const estado = panel.estado();
hablar(fragmentos(frasesDe(articulo)), { voz: vozPreferida(estado.voz), velocidad: estado.velocidad, alTerminar });
```

   Si `hayVoz()` es falso, los botones «Escuchar» quedan deshabilitados y muestran debajo el texto de la sección 6 («Sin voz local»). Nunca uses una voz que no sea local.

8. Las preferencias del chatbot que no son del panel (perfil, lector externo, lectura automática) van en otra clave: `asistente-docentes.preferencias`.

**Aceptación:** el panel abre con el botón flotante, con el botón «Accesibilidad» y con Alt + A; Escape lo cierra y devuelve el foco. Las cuatro variantes de contraste se ven completas (cabecera, respuestas, formulario, pie, bitácora) y pasan axe sin errores de contraste. Los botones «Escuchar» aparecen solo con la opción activa. La prueba funcional sigue igual. Commit «Fase 2: panel EBAR, temas y voz local».

### Fase 3 — Bienvenida de accesibilidad con perfiles (diseño Lexible)

1. En la primera visita (no existe `asistente-docentes.preferencias.bienvenida`), antes de iniciar el panel, abre un `<dialog>` nativo modal titulado «Antes de empezar: ajuste el asistente a su medida». Un solo diálogo con cuatro grupos, cada uno con su encabezado «Paso N de 4» (no un asistente de varias pantallas):
   - **Paso 1. Perfil:** grupo de botones de opción (`fieldset` + `legend`) con los nueve perfiles de la tabla de abajo; cada opción muestra el nombre y, debajo, la descripción.
   - **Paso 2. Lector de pantalla:** casilla «Uso un lector de pantalla (JAWS, NVDA, VoiceOver o TalkBack)». Casilla «Leer en voz alta cada respuesta nueva»: se deshabilita y se desmarca cuando la primera está marcada, y muestra el texto de la sección 6 («Lector externo»).
   - **Paso 3. Presentación:** texto fijo de la sección 6 («Paso 3») y la lista, en texto, de los ajustes que activa el perfil elegido (se actualiza al cambiar de perfil).
   - **Paso 4. Atajos de teclado:** lista de definición con Tab, Shift + Tab, Enter, Escape, Alt + A (abre el panel de accesibilidad) y Alt + 1 (va a la caja de pregunta). Implementa Alt + 1.
   - Casilla «Recordar mis preferencias en este equipo» (marcada por defecto) y botones «Guardar y empezar» y «Omitir».
2. Al guardar: combina el preajuste del perfil con el estado que haya en `localStorage['accesibilidad.preferencias']` (o con `PREDETERMINADO` si no hay), escríbelo en esa clave y **después** inicia el panel. Guarda perfil, lector externo y lectura automática en `asistente-docentes.preferencias`. Si «Recordar» está desmarcado, usa `sessionStorage`.
3. Agrega en la cabecera el botón «Perfil». Al cambiar de perfil después de la primera visita, el panel ya está iniciado y no expone forma de cambiar su estado: guarda el nuevo estado y recarga la página. Para no perder la conversación, guarda antes en `sessionStorage` la lista de preguntas hechas y la entidad elegida, y al cargar vuelve a responderlas en el mismo orden (el motor es determinista, así que las respuestas salen idénticas). Anuncia «Se aplicó el perfil …» al terminar.
4. **Lector externo marcado:** desactiva la lectura automática y no la ofrece; los botones «Escuchar» siguen disponibles si la persona los activa en el panel.
5. **Lectura automática marcada:** al aparecer una respuesta nueva, léela con el motor del EBAR (bloque «En pocas palabras» o «Lo más relevante» y la línea de la fuente). Nunca leas la bienvenida sola al cargar la página.

Preajustes (claves del estado del panel; lo que no aparece queda como esté):

| Perfil | Descripción visible | Preajuste del panel | Lectura automática sugerida |
| --- | --- | --- | --- |
| Visual | Texto grande, alto contraste, foco visible y áreas de clic amplias. | `texto: 150, contraste: 'alto', foco: true, objetivos: true` | Sí |
| Auditivo | La interfaz no depende del sonido: todo aviso es visual. | ninguno | No |
| Físico | Botones y áreas de clic grandes, cursor grande y foco reforzado. | `objetivos: true, foco: true, cursor: true` | No |
| Intelectual | Lectura facilitada, tipografía legible y más espacio entre líneas. | `facilitado: true, tipografia: true, interlineado: 1` | No |
| Psicosocial | Sin animaciones, lectura facilitada y más espacio entre líneas. | `animaciones: true, facilitado: true, interlineado: 1` | No |
| Sordoceguera | Texto muy grande, alto contraste oscuro, foco reforzado y más espacio. | `texto: 200, contraste: 'alto-oscuro', foco: true, objetivos: true, espaciado: 1` | No |
| Múltiple | Texto grande, alto contraste, sin animaciones y áreas de clic amplias. | `texto: 150, contraste: 'alto', objetivos: true, animaciones: true, foco: true` | No |
| Adulto mayor | Texto grande, más espacio entre líneas y áreas de clic amplias. | `texto: 150, interlineado: 1, objetivos: true, foco: true` | Sí |
| Sin preferencia | Configuración estándar. Puede ajustarla en cualquier momento con Alt + A. | ninguno | No |

La lectura automática sugerida solo aplica si la persona no marcó lector externo.

**Aceptación:** el diálogo se abre una vez, tiene foco inicial en el primer perfil, se opera completo con teclado, Escape equivale a «Omitir» y al cerrar el foco va a la caja de pregunta. Cada perfil produce su preajuste (prueba automática por perfil). axe sin errores con el diálogo abierto. Commit «Fase 3: bienvenida y perfiles».

### Fase 4 — Tablas, glosario, temas reservados e impresión

**4.1 Tablas accesibles.** Al dibujar el texto oficial, si la línea anterior a una tabla empieza por «TABLA No.», úsala (junto con la línea siguiente, si es el título en mayúsculas) como `<caption>` y no la repitas como párrafo. Encabezados con `<th scope="col">`. La lectura fila por fila ya la hace `frasesDe` del motor del EBAR; compruébala con la respuesta de vacantes del artículo 8.

**4.2 Glosario literal.**

1. Crea `herramientas/glosario.json` con estas entradas (no agregues otras sin fuente):

```json
[
  {"termino": "OPEC", "variantes": ["OPEC"], "fuente": {"tipo": "anexo", "rotulo": "Numeral 1.1"},
   "regla": {"oracion_con": "en adelante OPEC"}},
  {"termino": "SIMO", "variantes": ["SIMO"], "fuente": {"tipo": "anexo", "rotulo": "Numeral 1.1"},
   "regla": {"oracion_con": "en adelante SIMO"}},
  {"termino": "Educación formal", "variantes": ["educación formal"], "fuente": {"tipo": "anexo", "rotulo": "Numeral 4.1.1"},
   "regla": {"desde": "i) Educación Formal:", "hasta": "ii) Educación Continua"}},
  {"termino": "Educación continua", "variantes": ["educación continua", "formación continua"], "fuente": {"tipo": "anexo", "rotulo": "Numeral 4.1.1"},
   "regla": {"desde": "ii) Educación Continua:", "hasta": "b) Experiencia:"}},
  {"termino": "Experiencia directiva docente", "variantes": ["experiencia directiva docente"], "fuente": {"tipo": "anexo", "rotulo": "Numeral 4.1.1"},
   "regla": {"desde": "iii) Experiencia Directiva Docente:", "hasta": "iv) Experiencia Docente:"}},
  {"termino": "Experiencia docente", "variantes": ["experiencia docente"], "fuente": {"tipo": "anexo", "rotulo": "Numeral 4.1.1"},
   "regla": {"desde": "iv) Experiencia Docente:", "hasta": "v) Experiencia en otros cargos:"}},
  {"termino": "Experiencia en otros cargos", "variantes": ["experiencia en otros cargos"], "fuente": {"tipo": "anexo", "rotulo": "Numeral 4.1.1"},
   "regla": {"desde": "v) Experiencia en otros cargos:", "hasta": "Comoquiera que"}}
]
```

2. En `buildkb.py`, une las partes de cada rótulo del anexo (quita las líneas «(continuación)»), aplica la regla y guarda en `kb.json` la clave `glosario` con `termino`, `variantes`, `fuente` y `definicion` (texto **literal**). Regla `oracion_con`: la oración completa que contiene el marcador. Regla `desde`/`hasta`: desde el marcador inicial (incluido) hasta el final (excluido), sin espacios sobrantes. Si una regla no encuentra su marcador, `buildkb.py` termina con error y dice cuál.
3. Escribe en la bitácora las siete definiciones extraídas para que la persona las revise.
4. En la interfaz, la **primera aparición** de cada término en cada respuesta se vuelve un botón con el término (estilo de enlace, subrayado punteado) que abre un `<dialog>` con el título del término, la definición y la fuente («Fuente: Proyecto de Anexo Técnico Docentes 2026, Numeral 4.1.1» con la etiqueta «Borrador»). Al cerrar, el foco vuelve al término. No enlaces términos dentro de encabezados de tabla ni dentro del propio diálogo.

**4.3 Temas en reserva de Sala Plena.**

1. Crea `herramientas/temas_reservados.json`:

```json
[
  {
    "id": "valor-derechos-participacion",
    "grupo_a": ["valor", "cuesta", "cuestan", "costo", "precio", "tarifa", "uvt", "smdlv", "salario minimo", "salarios minimos", "pesos", "cuanto vale", "monto", "cuanto hay que pagar"],
    "grupo_b": ["inscripcion", "inscribirme", "inscribirse", "derechos de participacion", "participacion", "concurso"],
    "excluir_pasajes_con": "(UVT|SMDLV|salarios? m[ií]nimos?|valor en pesos|unidad de valor)",
    "mensaje": "ver sección 6, «Tema reservado»"
  }
]
```

2. Antes de buscar preguntas frecuentes o pasajes: normaliza la pregunta (sin tildes, minúsculas). Si contiene, como palabra o frase completa (no como parte de otra palabra), al menos un término del `grupo_a` **y** al menos uno del `grupo_b`, responde con el mensaje de la sección 6 («Tema reservado»), `data-tipo="tema-reservado"`, sin fuente, y registra en la bitácora con motivo «Tema reservado».
3. Excluye del índice de búsqueda (y de las fuentes de las preguntas frecuentes) todo pasaje cuyo texto cumpla la expresión `excluir_pasajes_con`. Escribe en la bitácora cuántos pasajes se excluyeron y sus rótulos.
4. «¿Cómo pago los derechos de participación?», «¿Las personas con discapacidad pagan la inscripción?» y «¿Qué pruebas se aplican y cuánto vale cada una?» **no** deben bloquearse (las dos primeras no tienen términos del `grupo_a` y la tercera no tiene términos del `grupo_b`). Están en los casos de prueba.

**4.4 Nota de validez.** Al final de cada bloque «Texto oficial» agrega, en texto secundario, la nota de la sección 6 («Nota de validez»).

**4.5 Imprimir.** Botón «Imprimir» en cada respuesta que imprime solo esa respuesta (agrega una clase temporal al `<article>` y usa `src/css/impresion.css`: oculta cabecera, panel, formulario, pie, botones y las demás respuestas; texto negro sobre blanco; muestra completos los desplegables de esa respuesta).

**Aceptación:** pasan los casos «desde fase 4»; la respuesta de vacantes tiene `<caption>`; el glosario abre y devuelve el foco; axe sin errores. Commit «Fase 4: tablas, glosario, temas reservados e impresión».

### Fase 5 — Pruebas completas e informe

En `pruebas/accesibilidad.mjs`, con Playwright y axe-core (reglas `wcag2a`, `wcag2aa`, `wcag21aa`, `best-practice`):

1. axe en las cuatro variantes de contraste, con texto al 100 % y al 200 %, con una respuesta de pregunta frecuente, una de pasaje con tabla y una «No encontrado» en pantalla, y también con el panel abierto y con la bienvenida abierta.
2. Reflujo: ventana de 320 px de ancho y texto al 200 %: `document.documentElement.scrollWidth <= innerWidth + 1` (sin desplazamiento horizontal), salvo dentro de las tablas, que se desplazan en su propio contenedor.
3. Teclado: desde la carga, con Tab se llega a «Saltar a escribir la pregunta»; Alt + 1 lleva a la caja de pregunta; Enter envía; Alt + A abre el panel y Escape lo cierra devolviendo el foco.
4. Voz: simula `speechSynthesis.getVoices()` con una sola voz en español **no local** (`localService: false`) y comprueba que «Escuchar» queda deshabilitado con el aviso «Sin voz local».
5. Región viva: la conversación tiene `role="log"` y cada respuesta nueva queda dentro de ella.

Genera `pruebas/INFORME_PRUEBAS.md` con: fecha, versión, resultado por caso funcional, resultado de axe por combinación, reflujo, teclado, voz, y la lista de pruebas manuales pendientes (sección 8).

**Aceptación:** cero errores de axe y todos los casos en verde. Commit «Fase 5: pruebas e informe».

### Fase 6 — Documentación

1. `LEEME.md`: qué es, cómo abrirlo, cómo actualizar la base cuando lleguen los acuerdos definitivos (Angélica los pasa por Lexible y los pone en la carpeta `CHATBOT`; luego `extract.py`, `buildkb.py`, `npm run construir`), cómo agregar preguntas frecuentes, entradas de glosario y temas reservados, y limitaciones.
2. `CHANGELOG.md` con la entrada v0.2.
3. Cambia la versión visible a `v0.2` en cabecera y pie.

**Aceptación:** un tercero puede regenerar el archivo siguiendo solo el `LEEME.md`. Commit «Fase 6: documentación v0.2».

### Fase 7 — Navegación guiada y estructura fija de respuesta (v0.3)

**Para qué.** Hoy la persona llega a una pantalla densa: un aviso largo, un selector de 90 entidades en un panel lateral y un chat que obliga a escribir. Esta fase reduce lo que hay que leer, escribir y encontrar, pensando en personas con discapacidad visual, motriz, cognitiva y sorda, en adultos mayores y en la ciudadanía en general. Son tres cambios de interfaz:

1. **Tarjetas de temas** para llegar a las preguntas frecuentes sin escribir.
2. **Buscador de entidad dentro de la respuesta** «Depende de su entidad».
3. **Estructura fija de cada respuesta**, con letra más grande y sin mayúsculas sostenidas.

**No cambia:** el motor de búsqueda (umbrales, sinónimos, índices), `faq.json`, `kb.json`, el glosario, los temas reservados ni los textos de los documentos. Tampoco se agregan preguntas frecuentes: lo que no tiene una pregunta validada (por ejemplo «Fechas» o «Ajustes razonables») no tiene tarjeta.

**Reglas de esta fase.** Usa solo los textos de la sección 6 (parte «Fase 7»). No hagas `git push`: cada `push` a `master` publica el asistente en GitHub Pages y esa decisión es de la persona responsable. Ejecuta los pasos en orden.

#### 7.0 Preparación

1. Ejecuta `npm run prueba` y confirma que todo está en verde (línea base de la fase 7). Si algo falla, **detente** y avisa. Anota en la bitácora los totales de cada archivo.
2. Lee `src/index.html`, `src/js/main.js`, `src/js/respuestas.js`, `src/css/chat.css` y `src/css/marca-earm.css` completos antes de tocarlos.

#### 7.1 Tarjetas de temas

1. Crea `herramientas/temas.json` con este contenido literal (cada `faq` es el `id` de una pregunta de `faq.json`; el orden de las preguntas es el de la lista):

```json
[
  {"id": "inscripcion", "titulo": "Inscripción y pago",
   "faq": ["requisitos-generales", "un-empleo", "pago", "gratuidad-discapacidad"]},
  {"id": "vacantes", "titulo": "Vacantes",
   "faq": ["vacantes-entidad", "un-empleo"]},
  {"id": "pruebas", "titulo": "Pruebas y puntajes",
   "faq": ["pruebas-pesos", "aptitudes-componentes", "puntaje-minimo", "entrevista"]},
  {"id": "resultados", "titulo": "Resultados y reclamaciones",
   "faq": ["reclamacion-escritas", "reclamacion-vrm"]},
  {"id": "etapas", "titulo": "Etapas del proceso",
   "faq": ["etapas"]}
]
```

2. En `herramientas/construir.mjs`: lee `temas.json`, valida y lo inserta en los datos como la clave `temas` (junto a `kb`, `faq` y `reservados`). La construcción **termina con error y un mensaje claro** si: un `id` de tema se repite; un `titulo` está vacío; una lista `faq` está vacía; un `id` de `faq` no existe en `faq.json`; o alguna pregunta de `faq.json` no aparece en ningún tema. Agrega `navegacion.css` a la lista de hojas CSS (después de `chat.css`).
3. En `src/index.html`:
   - Quita del panel lateral el subtítulo «Preguntas frecuentes» (`#sugTitle`) y la lista `#sugeridas`. Conserva «Proceso de selección» y «Entidad territorial certificada».
   - Dentro de `section.chat`, **antes** de `#log`, agrega esta sección (los textos entre llaves se escriben desde los datos):

```html
<section id="temas" class="temas" aria-labelledby="temas-titulo">
  <div class="temas-cabecera">
    <h2 id="temas-titulo">¿Sobre qué quiere saber?</h2>
    <button type="button" class="btn" id="temas-alternar" aria-expanded="true" aria-controls="temas-cuerpo">Ocultar los temas</button>
  </div>
  <div id="temas-cuerpo">
    <ul class="temas-tarjetas" id="temas-lista"></ul>
    <div id="temas-preguntas" hidden>
      <h3 id="temas-subtitulo" tabindex="-1"></h3>
      <ul class="temas-lista-preguntas" id="temas-lista-preguntas"></ul>
      <button type="button" class="btn" id="temas-volver">Volver a los temas</button>
    </div>
  </div>
</section>
```

4. Crea `src/js/temas.js`, que exporta `iniciarTemas({ temas, faq, enviarPregunta })` y devuelve `{ plegar(), desplegar() }`. Comportamiento:
   - **Tarjetas:** una `<li>` con un `<button type="button" class="tema-tarjeta" data-tema="{id}">` por tema, en el orden de `temas.json`. El botón contiene `<span class="tema-titulo">{titulo}</span>` y `<span class="tema-cuenta">{n} preguntas</span>` (`1 pregunta` si es una).
   - **Abrir un tema** (clic, Enter o Espacio en la tarjeta): oculta `#temas-lista`, muestra `#temas-preguntas`, escribe el título en `#temas-subtitulo`, llena `#temas-lista-preguntas` con un `<button type="button" class="tema-pregunta">` por pregunta (texto = `pregunta` de `faq.json`) y mueve el foco a `#temas-subtitulo`.
   - **Elegir una pregunta:** llama a `enviarPregunta(texto)` (la misma ruta que el formulario).
   - **«Volver a los temas»:** oculta las preguntas, muestra las tarjetas y devuelve el foco a la tarjeta que se había abierto.
   - **Escape** dentro de `#temas-preguntas` equivale a «Volver a los temas».
   - **Plegar:** al enviarse **cualquier** pregunta (texto escrito, dictado o tarjeta) la sección se pliega: `#temas-cuerpo` se oculta con el atributo `hidden`, `aria-expanded="false"`, el botón dice «Ver los temas» y el estado interno vuelve a la lista de tarjetas. **Desplegar:** el botón alterna; al desplegar, `aria-expanded="true"` y el texto «Ocultar los temas».
   - Al cargar, la sección está desplegada, salvo que se esté restaurando una conversación (cambio de perfil): entonces nace plegada.
5. En `src/js/main.js`:
   - Lee `datos.temas` y llama a `iniciarTemas`.
   - Quita el código de `#sugeridas` (render y clic).
   - Extrae del manejador del formulario una función `enviar(q)` que hace lo que hoy hace el envío (`historial.push`, `addUser`, estado «Buscando en los documentos…», `answer` con el mismo `setTimeout` y manejo de errores) y además pliega los temas. El formulario y `enviarPregunta` llaman a `enviar`. Tras elegir una pregunta de un tema, el foco va a `#pregunta`.
   - `restaurarSesion()` pliega los temas si la conversación restaurada tiene preguntas.
6. Crea `src/css/navegacion.css` (tarjetas y buscador de entidad). Tarjetas: cuadrícula `repeat(auto-fit, minmax(min(100%, 12rem), 1fr))` con 12 px de separación; cada tarjeta con alto mínimo de 4 rem, borde `var(--grosor-borde) solid var(--borde)`, fondo `var(--superficie)`, texto `var(--texto)`, título de 1,05 rem en negrita y la cuenta en `var(--texto-secundario)`; `:hover` y `:focus-visible` con borde `var(--texto)` y el anillo de foco ya definido; sin que el color sea la única señal. Todos los colores salen de las variables de `temas.css`. Las preguntas del tema son botones de ancho completo, con alto mínimo de 2,75 rem, alineados a la izquierda.

#### 7.2 Buscador de entidad dentro de la respuesta

Hoy «Depende de su entidad» manda a la persona al panel lateral y le pide volver a preguntar. Ahora la respuesta trae un buscador.

1. Crea `src/js/entidades.js`, que exporta:
   - `buscarEntidades(consulta, entidades, claves, max = 8)`: normaliza la consulta con `norm` y la parte en palabras de 2 o más letras; si no hay ninguna devuelve `{ lista: [], hayMas: false }`. Una entidad coincide si **todas** las palabras aparecen en su nombre normalizado (sin tildes, sin importar el orden). Orden del resultado: primero las entidades cuya parte territorial normalizada (`claves`, la `k` de `entKeys`) empieza por la primera palabra; luego el resto; dentro de cada grupo, orden alfabético en español (`localeCompare(..., 'es')`). Devuelve las primeras `max` y `hayMas` verdadero si había más.
   - `crearBuscadorEntidad({ id, entidades, claves, alElegir })`: devuelve el elemento DOM del buscador (siguiente punto).
2. Estructura del buscador, con el `id` único de la respuesta (`{id}`):

```html
<div class="buscador-entidad" data-a11y-omitir>
  <label for="{id}-entrada">Nombre de su entidad</label>
  <input type="text" id="{id}-entrada" role="combobox" aria-autocomplete="list" aria-expanded="false"
         aria-controls="{id}-lista" autocomplete="off" spellcheck="false">
  <ul id="{id}-lista" role="listbox" aria-label="Entidades encontradas" hidden></ul>
  <p class="hint" id="{id}-estado"></p>
</div>
```

3. Comportamiento (patrón combobox de WAI-ARIA 1.2):
   - Con 2 o más caracteres se llena la lista (`<li role="option" id="{id}-op{n}">`) y `aria-expanded="true"`. Con menos de 2, la lista se oculta y el estado queda vacío.
   - **Los anuncios van en `#status` de la página** (`p#status`, `role="status"`, fuera de `#log`), no en la respuesta: `#log` ya es una región viva y un `role="status"`, `role="alert"` o `aria-live` dentro de él duplicaría los anuncios. El `<p class="hint" id="{id}-estado">` del buscador muestra el mismo texto, **sin `role` ni `aria-live`**. Mensajes: «Una entidad encontrada.» / «{n} entidades encontradas.» / «Sin resultados. Revise la ortografía o escriba otra parte del nombre.» Si `hayMas`, agrega «Hay más entidades: siga escribiendo para acotar.» (el conteo es el total de coincidencias).
   - Flecha abajo / arriba mueven la opción activa (`aria-activedescendant` en el campo, `aria-selected="true"` en la opción; circular). **Enter** elige la opción activa; si no hay ninguna activa y hay **exactamente una** coincidencia, elige esa. **Escape** cierra la lista y deja el texto. **Tab** cierra la lista y sigue el orden normal. El clic o toque en una opción la elige. Las opciones miden al menos 2,75 rem de alto.
4. **Al elegir una entidad:** el buscador se reemplaza por `<p class="plain">Entidad elegida: {entidad}.</p>`; `#entidad` (el selector del panel lateral) toma ese valor; el estado de la página anuncia «Entidad elegida: {entidad}.» (`#status`) y se vuelve a enviar **la misma pregunta** con la entidad elegida (`enviar(q)` de `main.js`, que agrega la pregunta otra vez como mensaje de la persona y su respuesta). La respuesta nueva debe tener `data-entidad` igual a la entidad elegida.
5. En `src/js/respuestas.js`, las dos ramas «Depende de su entidad» (la de `specIndex` y la de una pregunta frecuente con `requiereEntidad` sin entidad) pasan a:
   - `<h3>Depende de su entidad</h3>`, el párrafo `plain` que ya existe (sin cambios) y, **en lugar** de «Elija su entidad en el panel «Antes de preguntar» y vuelva a preguntar.», el párrafo de instrucción de la sección 6 y el buscador. Se quita el `setTimeout(() => entSel.focus(), 50)`: el foco queda donde está.
   - `ctx` recibe `alElegirEntidad(q, entidad)` y `entidades` (los 90 nombres y sus claves), que `main.js` conecta con `enviar`.
   - El buscador va marcado `data-a11y-omitir` para que la lectura en voz alta no lo recorra; el texto que se lee es el mismo de antes con la instrucción nueva.
6. `data-tipo` sigue siendo `depende-entidad`, sin fuentes, y `data-entidad` vacío.

#### 7.3 Estructura fija de la respuesta

Todas las respuestas de pregunta frecuente y de pasaje siguen el mismo orden:

1. **Respuesta corta** (`En pocas palabras` o `Lo más relevante del texto oficial`).
2. **La fuente, en una línea** (`.src`), justo debajo, con la etiqueta «Borrador».
3. **Texto oficial** (`<h3>Texto oficial</h3>` y su contenido, con los desplegables que ya existen), seguido de la **nota de validez**.
4. **Otras fuentes relacionadas** (desplegable), igual que hoy.

Pasos en `src/js/respuestas.js`:

1. **Pregunta frecuente:** `<h3>En pocas palabras</h3>`, `p.plain`, la línea de la fuente principal (`sourceLabel` de `srcs[0]`, con «Borrador»), el `p.hint` (**sin** insignia: el texto pasa a ser `{estado}. Respuesta frecuente redactada a partir del texto oficial que aparece abajo.`, con el `estado` de la pregunta), `<h3>Texto oficial</h3>` y los bloques de texto oficial, y la nota de validez. `passageBlock` recibe un parámetro `{ fuente: 'ninguna' | 'sin-borrador' | 'completa' }`: el primer bloque lleva `ninguna` (su fuente ya se mostró arriba); los siguientes de una pregunta con varias fuentes llevan `sin-borrador` (la línea «Fuente: …» sin la insignia); en «Otras fuentes relacionadas» y «Texto más cercano» se deja `completa`. `sourceLabel` acepta `{ conBorrador }`.
2. **Pasaje:** si hay frases clave, `<h3>Lo más relevante del texto oficial</h3>` y el bloque `official`; si **no** hay, se omite ese encabezado (hoy queda vacío). Luego la línea de la fuente, `<h3>Texto oficial</h3>`, el bloque con `fuente: 'ninguna'` y la nota de validez.
3. Consecuencia: en una respuesta hay **una sola** insignia «Borrador» visible fuera de desplegables.
4. **«No encontrado»:** después del párrafo «Su pregunta quedó registrada…» y antes de «Texto más cercano», agrega las **preguntas parecidas**: `faqIndex.search(q, 3, drop)` (el mismo `drop` que usa `answer`), conservando los resultados con `cov >= 0.5`. Si hay al menos uno: `<h3>Preguntas parecidas</h3>` y una lista de botones `button.btn.pregunta-parecida` con la `pregunta` de cada pregunta frecuente; al activarlos se llama a `enviar` con ese texto. Si no hay ninguno, no se agrega nada. El umbral 0,5 es solo de esta sugerencia: no cambia `faqOk`, `passOk` ni ningún umbral del motor.

Pasos de presentación (`marca-earm.css`, `chat.css`, `navegacion.css`, `accesibilidad.js`):

5. **Sin mayúsculas sostenidas.** Quita `text-transform: uppercase` de `.btn`, `label.lbl`, `.msg.bot h3`, `table.data th`, `.badge` y `footer.foot`; deja `letter-spacing` en 0 en esos elementos (`.earm-version` conserva el suyo). Ningún elemento visible puede tener `text-transform` distinto de `none`. El nombre de la marca ya está escrito en mayúsculas en el HTML y no cambia.
6. **Tamaño base de 18 px.** `html { font-size: 112.5%; }` en `marca-earm.css`, y en `accesibilidad.js` el `aplicar(estado)` fija `font-size` en `estado.texto * 1.125 + '%'` (la constante se llama `ESCALA_BASE`). El panel sigue mostrando «100 %» como tamaño normal. Tamaño mínimo de cualquier texto visible: **0,75 rem**. Sube a ese mínimo lo que hoy es menor (por ejemplo `.badge`, `.earm-version`, `label.lbl`, `.msg.bot h3`, `table.data th`, `.brand p`) y pasa a 1 rem el texto de `.msg` y a 0,95 rem `.official`.
7. **Líneas cortas siempre:** `max-width: 70ch` en `.plain`, `.official p` y `.hint` dentro de las respuestas (la lectura facilitada mantiene sus 65 caracteres).
8. Ajusta lo que haga falta en el CSS para que los resultados de reflujo (320 px, texto al 200 %) y de axe se mantengan en verde con el tamaño base nuevo. No cambies textos para lograrlo.

#### 7.4 Pruebas

1. **`pruebas/navegacion.mjs`** (Playwright + axe-core, Chromium, `file://`, bienvenida dada por vista, igual que `funcional.mjs`). Guarda sus resultados en `pruebas/resultados/navegacion.json`. Comprobaciones:
   - **Temas.** Al cargar: existe `#temas`, desplegada, con el título «¿Sobre qué quiere saber?» y tantas tarjetas como temas, con sus títulos y su cuenta de preguntas leídos de `temas.json` y `faq.json` (no escritos a mano). Ya no existe `#sugeridas`. Al abrir cada tema se listan exactamente sus preguntas, en orden; el foco queda en el subtítulo; «Volver a los temas» devuelve el foco a la tarjeta; Escape hace lo mismo. Con solo teclado (Tab, Enter): abrir «Pruebas y puntajes», elegir «¿Cuánto vale la entrevista?» y obtener una respuesta `faq` con fuente principal `Numeral 6.1`, con la sección plegada, `aria-expanded="false"`, el botón «Ver los temas» y el foco en `#pregunta`. «Ver los temas» la despliega. Escribir y enviar una pregunta también la pliega. Cada pregunta de cada tema, al elegirla, devuelve una respuesta cuyo `data-tipo` es `faq` o `depende-entidad` (esta última solo para `vacantes-entidad` sin entidad).
   - **Datos.** Toda pregunta de `faq.json` está en algún tema, y todo `id` de `temas.json` existe en `faq.json` (refuerza la validación de `construir.mjs`).
   - **Regiones vivas.** Dentro de `#log` no hay ningún elemento con `role="status"`, `role="alert"` ni `aria-live` (se comprueba con varias respuestas en pantalla, incluida una «Depende de su entidad» con el buscador abierto, y con la bienvenida del chat). Los mensajes del buscador («{n} entidades encontradas.», «Sin resultados…», «Entidad elegida: …») aparecen en `#status` y el `<p class="hint">` del buscador repite el texto sin `role` ni `aria-live`.
   - **Buscador de entidad** (casos de la sección 7, tabla «Fase 7 · entidad»). Incluye: el buscador aparece en las dos ramas de `depende-entidad`; nombre accesible «Nombre de su entidad»; `role="combobox"`, `aria-expanded`, `aria-controls` y `aria-activedescendant` correctos; sin tildes y sin importar el orden; máximo 8 opciones y aviso de «más entidades»; sin resultados; teclado (flechas, Enter, Escape, Tab) y clic; al elegir, aparece de nuevo la pregunta de la persona, una respuesta nueva con la entidad, el selector del panel lateral actualizado y el anuncio «Entidad elegida: …» en `#status`; la lectura en voz alta (espía de `speechSynthesis`) no incluye el buscador; las opciones miden al menos 44 px de alto; tras un cambio de perfil con la conversación conservada, las dos preguntas y las dos respuestas son idénticas (`data-tipo`, `data-fuente-principal`, `data-entidad`).
   - **Estructura.** Para una pregunta frecuente (caso 1), una de varias fuentes (caso 5) y un pasaje (caso 7): el orden en el DOM es respuesta corta, `.src`, `<h3>Texto oficial</h3>`, `.nota-validez` y, si existe, `details.relacionadas`; hay exactamente una insignia «Borrador» visible fuera de desplegables; y no hay un `<h3>` vacío. Ningún elemento visible tiene `text-transform` distinto de `none` (recorre `body *`). Con el panel en 100 %, el tamaño de `body` es 18 px; al 200 %, 36 px; el menor texto visible mide al menos 12 px (0,75 rem). `.plain` tiene `max-width: 70ch`.
   - **Preguntas parecidas** (tabla «Fase 7 · parecidas»): aparecen o no según los casos; al activar una se obtiene su respuesta `faq`; en «No encontrado» sin sugerencias no aparece el bloque.
2. **`pruebas/accesibilidad.mjs`:** agrega, al axe y al reflujo, el estado **«temas y buscador de entidad»**: página sin preguntas con un tema abierto y, en otra página, una respuesta «Depende de su entidad» con «antio» escrito en el buscador y la lista abierta. Quedan 32 combinaciones de axe y 16 de reflujo. En la prueba de teclado, la lista de controles alcanzados incluye `temas-alternar`.
3. **Pruebas existentes que cambian** (solo lo indicado): en `pruebas/perfiles.mjs` el tamaño de texto esperado en `<html>` pasa de `{texto}%` a `{texto × 1,125}%`; en `pruebas/funcional.mjs` y `pruebas/tablas_glosario.mjs` no debe cambiar nada (si falla algo, es un defecto de la fase y se corrige en la fase).
4. **`package.json`:** `npm run prueba` ejecuta, en este orden: `funcional.mjs`, `perfiles.mjs`, `tablas_glosario.mjs`, `navegacion.mjs` y `accesibilidad.mjs`. El informe (`INFORME_PRUEBAS.md`) incluye la sección «Navegación guiada y estructura de respuesta» con el resumen de `navegacion.mjs`.

#### 7.5 Documentación y cierre

1. `LEEME.md`: describe las tarjetas de temas (y cómo agregar o cambiar un tema en `herramientas/temas.json`, con la validación de `construir.mjs`), el buscador de entidad y la estructura de respuesta. Quita la mención de las preguntas frecuentes del panel lateral.
2. `CHANGELOG.md`: entrada **v0.3** (nuevo, cambiado, pendiente). En «Cambiado», anota que quitar las mayúsculas sostenidas (botones, etiquetas, encabezados, insignias y pie) es una **excepción de accesibilidad al sistema de diseño EARM**, aprobada por la persona responsable. `package.json` pasa a `0.3.0` y la versión visible (cabecera, chip y pie) a `v0.3`.
3. `BITACORA_IMPLEMENTACION.md`: qué cambió, línea base, resultados de cada archivo de pruebas, decisiones y dudas.
4. Commit «Fase 7: navegación guiada y estructura de respuesta». **No hagas `push`.**

**Aceptación:** `npm run prueba` pasa completa (los archivos anteriores con los mismos resultados, salvo el ajuste de `perfiles.mjs`, más `navegacion.mjs` y los 32 y 16 de `accesibilidad.mjs`) con cero violaciones de axe; los casos de las tablas «Fase 7» de la sección 7 dan lo esperado; con teclado se llega desde la carga a una respuesta sin escribir; el informe se regenera.

**Ideas para después (no las hagas en la fase 7):** bienvenida por necesidades en lugar de perfiles por condición; versiones en Lectura Fácil de las preguntas frecuentes y pictogramas, validados con personas con discapacidad intelectual; videos en Lengua de Señas Colombiana; botón «¿Qué significa?» junto a los términos del glosario; barra fija con «Nueva consulta» e «Imprimir»; mover la bitácora a un menú de administración; aviso inicial corto con «Ver más»; tarjetas de «Fechas» y «Ajustes razonables» cuando existan preguntas frecuentes validadas.

### Fase 8 — Diseño de una columna, celular y presentación de la respuesta (v0.4)

**Para qué.** Con la v0.3 la navegación ya no obliga a escribir, pero la pantalla sigue siendo densa y en el celular el botón flotante tapa contenido. Esta fase ordena la página en **una sola columna centrada**, resuelve el celular, hace más clara cada respuesta (una línea de fuente, sin resaltado innecesario, resumen en su recuadro, opinión como grupo propio) y cambia el saludo del chat por el texto aprobado. Son nueve cambios de interfaz:

1. Iconos de línea en las tarjetas de temas y texto visible «Dictar» junto al micrófono.
2. Celular: el botón flotante de accesibilidad va en la cabecera; margen lateral de 16 px; orden con aviso, temas, selector de entidad plegado («Su entidad (opcional)»), conversación y caja de pregunta.
3. Una sola columna centrada (máximo 800 px) en todas las pantallas, conversación sin desplazamiento interno y caja de pregunta fija abajo.
4. Aviso inicial corto («Prototipo con documentos en borrador. No escriba datos personales.») con «Ver más», que despliega debajo el texto actual completo.
5. Fuente en una sola línea por respuesta, sin insignias.
6. Sin resaltado de palabras en las respuestas frecuentes; en los fragmentos, solo en las frases clave.
7. «En pocas palabras» en un recuadro propio.
8. Opinión («¿Le sirvió esta respuesta?») como grupo propio, separado de Copiar e Imprimir.
9. Saludo inicial nuevo, con el texto literal aprobado en la sección 6.

**No cambia:** el motor de búsqueda (umbrales, sinónimos, índices), `faq.json`, `kb.json`, el glosario, los temas reservados, `temas.json` (salvo el campo `icono`), ni ningún texto de contenido. Los únicos textos nuevos son los de la sección 6, parte «Fase 8».

**Reglas de esta fase.** Usa solo los textos de la sección 6 (parte «Fase 8»). No modifiques `vendor/`: el botón flotante del panel se reubica solo con CSS propio. No hagas `git push`: cada `push` a `master` publica en GitHub Pages y esa decisión es de la persona responsable. Las pruebas de axe y de reflujo deben seguir en verde en las **cuatro variantes de contraste**, con texto al 100 % y al 200 %. Ejecuta los pasos en orden.

#### 8.0 Preparación

1. Ejecuta `npm run prueba` y confirma que todo está en verde (línea base de la fase 8). Si algo falla, **detente** y avisa. Anota en la bitácora los totales de cada archivo.
2. Lee completos `src/index.html`, `src/js/main.js`, `src/js/respuestas.js`, `src/js/accesibilidad.js`, `src/js/temas.js`, `src/css/marca-earm.css`, `src/css/chat.css`, `src/css/navegacion.css`, `src/css/impresion.css` y las pruebas `navegacion.mjs`, `tablas_glosario.mjs` y `accesibilidad.mjs`.

#### 8.1 Iconos en las tarjetas y «Dictar» visible

1. Crea `src/js/iconos.js`, que exporta `ICONOS` (nombre → contenido SVG) y `icono(nombre)`, que devuelve el SVG en línea con estos atributos exactos: `class="icono" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"`. Sin `<title>`, sin `<desc>` y sin colores escritos a mano: el color es siempre `currentColor`. Los iconos son de línea, del estilo de Lucide (ISC); contenido literal de cada uno:

| Nombre | Tema | Contenido |
| --- | --- | --- |
| `carpeta-lista` | Inscripción y pago | `<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><path d="M8 12h8"/><path d="M8 16h8"/>` |
| `maletin` | Vacantes | `<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>` |
| `lapiz` | Pruebas y puntajes | `<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>` |
| `documento-alerta` | Resultados y reclamaciones | `<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 9v4"/><path d="M12 17h.01"/>` |
| `ruta` | Etapas del proceso | `<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>` |

2. En `herramientas/temas.json` agrega a cada tema el campo `icono` con el nombre de la tabla (`inscripcion` → `carpeta-lista`, `vacantes` → `maletin`, `pruebas` → `lapiz`, `resultados` → `documento-alerta`, `etapas` → `ruta`). `construir.mjs` importa `ICONOS` de `src/js/iconos.js` y **termina con error** si un tema no tiene `icono` o si el nombre no existe.
3. `src/js/temas.js`: cada tarjeta pasa a `<button type="button" class="tema-tarjeta" data-tema="{id}">{icono}<span class="tema-texto"><span class="tema-titulo">…</span><span class="tema-cuenta">…</span></span></button>`. El icono va **siempre junto al texto** (nunca solo). `navegacion.css`: la tarjeta es una fila (`display: flex; align-items: center; gap: 12px`), el icono mide 28 px y no se encoge (`flex: none`), su color es el del título de la tarjeta (`color: inherit`), y las tarjetas conservan alto mínimo de 4 rem, borde y foco.
4. Micrófono (`src/index.html`): el botón `#micBtn` pasa a mostrar su texto: `<svg …/><span>Dictar</span>` (se quita la clase `sr-only` del texto). Conserva `aria-label="Dictar la pregunta con el micrófono"` (contiene el texto visible) y `aria-pressed`. El icono del micrófono sigue siendo el que ya existe.

#### 8.2 Celular (menos de 640 px)

**Punto de corte.** «Celular» es un ancho de ventana **menor que 640 px** (`max-width: 639px`). Cambia a `639px` también las reglas existentes de `chat.css` que hoy usan `max-width: 640px` (la cabecera estática y la reorganización del formulario), para que todo cambie en el mismo punto: a 640 px ya rige el diseño de escritorio.

1. **Botón flotante del panel en la cabecera.** El panel crea el botón `.a11y-disparador` (con el símbolo de la ONU) y lo deja flotando abajo a la derecha; no se modifica `vendor/`. En `navegacion.css` (o `marca-earm.css`), para `max-width: 639px`, con selectores `html .a11y-disparador` y `html .a11y-disparador--logo` (más específicos que los de la hoja del panel):
   - `position: absolute; top: 10px; right: 16px; bottom: auto; left: auto;` (se desplaza con la cabecera, que en celular no es fija); `width` y `height` de **56 px**; el núcleo blanco y la imagen escalados en proporción (núcleo 44 px, imagen 38 px); `z-index` por debajo del panel abierto.
   - La marca (`.brand`) reserva el espacio: `padding-right: 72px`.
   - Desde 640 px el botón sigue flotando abajo a la derecha, como hoy.
   - En ningún ancho el botón debe cubrir contenido: entre 640 px y 1100 px el interior del formulario (`.form-interior`) deja un margen derecho de 7 rem (`padding-right: 7rem` en ese rango; reemplaza la regla actual de 1320 px, que ya no hace falta con la columna de 800 px). Por encima de 1100 px la columna centrada deja libre el lado derecho.
2. **Margen lateral de 16 px en la cabecera.** Hoy `.bar` anula el relleno lateral de `.wrap` (`padding: 10px 0`). Debe quedar `.bar { padding: 10px 16px }`. A 320, 360, 390 y 1100 px de ancho: el borde izquierdo de la marca está a 16 px o más del borde de la ventana y el borde derecho del último botón de la cabecera (y del botón de la ONU en celular) está a 16 px o más del borde derecho.
3. **Orden en el celular.** De arriba abajo: cabecera, aviso, temas, **selector de entidad** (plegado), conversación y, al final, la caja de pregunta. Es el mismo orden en todas las pantallas (ver 8.3). El selector de entidad queda **plegado** **justo debajo de `#temas` y antes de la conversación**: va dentro de un `<details id="entidad-detalles" class="configuracion">` cerrado por defecto, cuyo `<summary id="entidad-resumen">` dice «Su entidad (opcional)». Dentro van, con los mismos `id` y etiquetas de hoy, `#proceso`, `#entidad` y la ayuda `#entHint`.

#### 8.3 Una sola columna

1. **`src/index.html`.** Reemplaza la cuadrícula de dos columnas (`.grid`, `aside.card`, `section.chat`) por una sola columna dentro de `<main id="contenido" class="columna" role="main">`, con este orden y estos elementos (los textos ya existen salvo los de la sección 6):

```html
<main id="contenido" class="columna" role="main">
  <div class="aviso-inicio" id="aviso"> … (8.4) … </div>
  <section id="temas" …> … sin cambios … </section>
  <details id="entidad-detalles" class="configuracion">
    <summary id="entidad-resumen">Su entidad (opcional)</summary>
    … #proceso, #entidad y #entHint, con sus etiquetas …
  </details>
  <section class="conversacion" aria-labelledby="chatTitle">
    <h2 id="chatTitle" class="sr-only">Conversación</h2>
    <div id="log" role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversación con el asistente"></div>
  </section>
  <form class="form" id="form" autocomplete="off" aria-labelledby="pregunta-etiqueta">
    <div class="form-interior"> … el contenido actual del formulario (etiqueta con `id="pregunta-etiqueta"`, caja, micrófono de 8.1, «Enviar» y `#status`) … </div>
  </form>
</main>
```

2. **Ancho.** `.wrap` y `.columna` miden como máximo **800 px**, centrados (`margin: 0 auto`), con 16 px de relleno lateral (la cabecera también usa 800 px). Desaparecen las reglas de `.grid`, `.card` de la columna y `.chat` de `chat.css`; la conversación no va dentro de una tarjeta con borde.
3. **Sin desplazamiento interno.** Nada de la columna tiene `overflow-y: auto` ni `scroll`, ni altura fija: se desplaza la página. Excepciones: `.tabla-scroll` (solo horizontal), la lista de opciones del buscador de entidad (`.buscador-entidad ul`) y los diálogos. `#log` no tiene `flex: 1` ni altura mínima propia.
4. **Caja de pregunta fija abajo, con dos excepciones.** Por defecto: `.form { position: fixed; left: 0; right: 0; bottom: 0; z-index: 40; }` con fondo `var(--superficie)` y borde superior de ancho completo; su contenido (`.form-interior`) tiene el ancho de la columna (máximo 800 px, centrado, 16 px de relleno lateral). Para que no tape el final del contenido, `src/js/main.js` publica en `<html>` la variable `--alto-form` (px) con el alto del formulario; `body { padding-bottom: var(--alto-form, 7rem); }` y `html { scroll-padding-bottom: var(--alto-form, 7rem); }` (esto último evita que la caja fija tape el comienzo de una respuesta nueva al desplazarla a la vista). El formulario sigue siendo el último elemento de `main`, para que el orden del teclado no cambie. Es un formulario con nombre (`aria-labelledby` de su etiqueta), por lo que cuenta como región para axe.
   **Excepciones: la caja deja de ser fija y pasa a `position: static`, al final de la columna,** cuando **(a)** la ventana mide **menos de 500 px de alto** o **(b)** el alto de la caja supera **un tercio del alto de la ventana** (por ejemplo, con el texto al 200 %). Implementación: una función `ajustarFormulario()` en `main.js`, llamada al cargar, en `resize` y `orientationchange` y desde un `ResizeObserver` sobre `.form-interior`, mide el alto de `.form-interior` (más su relleno y borde, que no cambian entre los dos modos, así que la medida no oscila), decide el modo con `window.innerHeight < 500 || alto > window.innerHeight / 3`, lo escribe en `form.dataset.modo` (`"fijo"` o `"estatico"`) y publica `--alto-form` (en el modo estático vale `0px`). CSS: `.form[data-modo="estatico"] { position: static; }` con un margen superior de 16 px. El modo estático conserva todo lo demás (ancho de columna, orden, foco, anuncios).
5. **Respuestas.** Tras enviar una pregunta, la respuesta nueva se desplaza a la vista con `scrollIntoView` (ya existe) y queda por debajo de la cabecera y por encima de la caja fija (gracias al `scroll-padding-bottom` del paso anterior).
6. **Impresión (`impresion.css`).** Los elementos nuevos también se ocultan al imprimir una respuesta: `.aviso-inicio`, `#temas`, `#entidad-detalles`, `.opinion`; se quitan las reglas de `main aside`, `.grid` y `.notice`, que ya no existen. Actualiza la prueba de impresión de `tablas_glosario.mjs` con esos selectores.
7. **Pruebas que cambian por la estructura.** `tablas_glosario.mjs`: antes de `selectOption('#entidad', …)` abre `#entidad-detalles` (`open = true`). `accesibilidad.mjs`: en la lista de controles que alcanza Tab, `entidad` se reemplaza por `entidad-resumen` y se agrega `aviso-alternar`.

#### 8.4 Aviso inicial corto

1. Plegado, el aviso muestra **una frase completa, sin recortes**: «Prototipo con documentos en borrador. No escriba datos personales.» (texto aprobado, sección 6) y el botón «Ver más». Al pulsar el botón se despliega **debajo** el texto actual completo, **sin cambios** (incluida la versión de los documentos, `#kbVersion`), y el botón pasa a «Ver menos». Estructura: `<div class="aviso-inicio" id="aviso"><p class="aviso-corto">Prototipo con documentos en borrador. No escriba datos personales.</p><button type="button" class="btn" id="aviso-alternar" aria-expanded="false" aria-controls="aviso-texto">Ver más</button><p class="aviso-texto" id="aviso-texto" hidden><strong>Prototipo.</strong> …texto actual completo…</p></div>`.
2. El texto largo, plegado, queda oculto con el **atributo `hidden`** (no solo con CSS): no se ve y tampoco lo leen los lectores de pantalla ni entra en el orden del teclado. Desplegado (`aria-expanded="true"`) se quita `hidden`, el texto se ajusta a varias líneas y el botón dice «Ver menos». Nace plegado. Sin `white-space: nowrap`, sin `text-overflow` y sin recortes de ninguna clase.
3. Estilo: mismos colores del aviso actual (`--aviso-fondo`, `--aviso-texto`), la frase corta y el botón en la misma fila cuando caben (el botón pasa debajo en anchos estrechos), el texto largo debajo con un filete sutil; sin que el color sea la única señal.

#### 8.5 Fuente en una sola línea

1. En `src/js/respuestas.js`, `sourceLabel` produce una **sola línea de texto**, sin insignias, con partes separadas por « · »:
   - Anexo: `Fuente: Proyecto de Anexo Técnico Docentes 2026, Numeral 6.1 · Borrador`.
   - Acuerdo de una entidad: `Fuente: Proyecto de Acuerdo de {entidad}, {rótulo} · Borrador`.
   - Texto común: `Fuente: Proyectos de Acuerdo de convocatoria, {rótulo} · común a {n} de {N} acuerdos · Borrador`.
   «Fuente:» va en negrita y «Borrador» en `<span class="fuente-borrador">` (negrita). `N` sale de los datos (`base.N`), igual que hoy. Sin `.badge`.
2. Se mantiene el parámetro `conBorrador`: la fuente principal lleva « · Borrador»; las demás fuentes visibles de una pregunta con varias fuentes, no; «Otras fuentes relacionadas» y «Texto más cercano», sí. En toda respuesta hay **una sola** fuente visible con «Borrador» fuera de desplegables.
3. El diálogo del glosario usa la misma línea (`Fuente: Proyecto de Anexo Técnico Docentes 2026, Numeral N · Borrador`), con una función compartida.
4. Se eliminan las reglas `.badge`, `.badge.warn`, `.badge.info` y `.badge.ok` si ya nada las usa. `data-fuentes`, `data-fuente-principal` y `sourceSpeech` no cambian.

#### 8.6 Resaltado

1. `highlight` solo se aplica a las **frases clave** del bloque «Lo más relevante del texto oficial» de las respuestas de **pasaje**. No se resalta nada en: respuestas de pregunta frecuente (ni en el texto oficial que muestran), el bloque «Texto oficial» de las respuestas de pasaje, «Otras fuentes relacionadas», «Texto más cercano», títulos de tablas ni celdas de tablas. En la práctica: `renderOfficial` se llama sin términos de búsqueda en todos esos casos (`qt = []`).
2. El CSS de `mark` se conserva (lo usan las frases clave). El enlace de glosario sigue funcionando (ahora sin marcas que partan las palabras).

#### 8.7 «En pocas palabras» en su recuadro

1. En las respuestas de **pregunta frecuente**, el encabezado «En pocas palabras» y su párrafo van dentro de `<div class="resumen">…</div>`. La fuente y la aclaración (`p.hint`) quedan fuera del recuadro, justo debajo.
2. `.resumen` es **distinto** del texto oficial (`.official`, con franja izquierda de acento y fondo crema): borde completo de `calc(var(--grosor-borde) + 1px) solid var(--texto)`, esquinas de 14 px, relleno de 12 px 14 px, fondo `var(--superficie)`, y el encabezado como título del recuadro. Todos los colores salen de las variables de `temas.css`; debe distinguirse en las cuatro variantes sin depender solo del color.
3. En las respuestas de pasaje, el bloque de frases clave sigue siendo `.official` (es texto literal del documento); no usa `.resumen`.
4. La lectura automática (`leerRespuestaAutomatica`) sigue leyendo «En pocas palabras» y la fuente: `h3` + `p.plain` siguen siendo hermanos dentro del recuadro.

#### 8.8 Opinión como grupo propio

1. Las acciones se separan en dos grupos al pie de cada respuesta:
   - `<div class="actions" data-a11y-omitir>`: «Escuchar» (oculto hasta activar la opción del panel), «Copiar» e «Imprimir».
   - Solo en respuestas con pregunta (frecuente y pasaje): `<div class="opinion" role="group" aria-labelledby="{id}-op" data-a11y-omitir><span id="{id}-op">¿Le sirvió esta respuesta?</span><button type="button" class="btn ghost" data-ok>Sí</button><button type="button" class="btn ghost" data-no>No</button></div>`.
2. Comportamiento igual al actual: «Sí» anuncia «Gracias por su opinión.»; «No» registra en la bitácora con el motivo «No le sirvió la respuesta» y anuncia «Gracias. La pregunta quedó en la bitácora para mejorar la base.»; ambos botones se deshabilitan después. Las respuestas «Depende de su entidad», «No encontrado» y «Tema reservado» no llevan opinión (como hoy).
3. `.opinion` va visualmente separada de `.actions` (en su propia fila, con una línea superior sutil y el mismo estilo de botones). El botón «Copiar» copia el texto de la respuesta **sin** los grupos `.actions`, `.opinion` ni el aviso de voz: oculta esos elementos con `display: none` mientras lee `articulo.innerText` y los restablece. Impresión: `.opinion` no se imprime.

#### 8.9 Saludo inicial nuevo

1. Reemplaza el mensaje de bienvenida de la conversación (el último `addBot` de `main.js`) por cuatro párrafos con el texto literal de la sección 6 («Saludo del chat»): el primero dentro de `<strong>` (en el `p.plain`) y los otros tres en `<p>`. El texto sale de **una sola lista** de cuatro cadenas (constante `SALUDO` en un módulo, por ejemplo `respuestas.js`) de la que salen el HTML visible y el texto que se pasa como lectura (`speech`). En el segundo párrafo, el número de entidades es `N = KB.nAcuerdos` (hoy 90): nunca escrito a mano.
2. El saludo no se lee solo al cargar (regla de la fase 3) y no lleva `data-tipo`, así que ninguna prueba lo cuenta como respuesta. Conserva sus botones «Escuchar» (con la opción activa), «Copiar» e «Imprimir». No lleva el grupo de opinión.
3. Se eliminan los dos textos anteriores del saludo (el visible y el de lectura) y la frase «elíjala en el panel «Antes de preguntar»».
4. Ajusta las pruebas que comparen el saludo anterior (si existe alguna) y agrega la nueva (8.10).

#### 8.10 Pruebas

1. **`pruebas/diseno.mjs`** (nuevo; Playwright + axe-core, Chromium, `file://`, bienvenida dada por vista como en `navegacion.mjs`; guarda `pruebas/resultados/diseno.json`). Comprobaciones:
   - **Iconos.** Cada tarjeta tiene un `svg.icono` con `aria-hidden="true"`, `focusable="false"`, `stroke="currentColor"`, 24 × 24 de atributo y 28 px de ancho visible, sin `<title>`; el icono está a la izquierda del texto y dentro del mismo botón; los cinco iconos son distintos y corresponden a los de la tabla de 8.1 (`outerHTML` igual al literal); el color calculado del trazo es el del título de la tarjeta, en las cuatro variantes de contraste (así su contraste es el del texto); el nombre accesible de la tarjeta sigue siendo su título y su cuenta. El micrófono muestra el texto «Dictar» (visible, no `sr-only`) y su nombre accesible contiene «Dictar».
   - **Columna.** A 1280, 1100, 900, 700 y 390 px de ancho: `main` y la cabecera no pasan de 800 px y están centrados (márgenes izquierdo y derecho iguales con 1 px de tolerancia); sin desplazamiento horizontal. Orden vertical (por `getBoundingClientRect().top`) a 390 px y a 1280 px: **aviso, temas, entidad, conversación, formulario** (con el formulario en modo estático, su posición vertical es la última de la columna). `#entidad-detalles` está cerrado y `#entidad` no es visible; su `summary` dice «Su entidad (opcional)»; al abrirlo con teclado (Enter) se ve y se puede elegir.
   - **Sin desplazamiento interno.** Con cinco respuestas: ningún elemento de `main` (salvo `.tabla-scroll` en horizontal y `.buscador-entidad ul`) tiene `overflow-y` `auto` o `scroll`; `#log` crece (su alto es mayor que el de la ventana); el desplazamiento es el de la página (`window.scrollY` cambia al enviar una pregunta).
   - **Caja fija abajo, y sus excepciones.** (1) A **390 × 740 con el texto al 100 %**: `form.dataset.modo === "fijo"`, `#form` tiene `position: fixed` y, con la conversación vacía y con cinco respuestas, arriba del todo, a la mitad y al final de la página, su borde inferior coincide con el de la ventana (1 px de tolerancia). Con la página al final, el pie (`footer.foot`) queda por completo por encima de la caja (su borde inferior es menor o igual que el borde superior del formulario). Al enviar una pregunta, el comienzo de la respuesta nueva no queda tapado por la caja ni por nada más (su `top` es mayor que 0 y menor que el `top` del formulario). A **1280 × 800 al 100 %** también es fija. (2) A **390 × 740 con el texto al 200 %**: el alto de `.form-interior` supera un tercio de 740 px, `data-modo === "estatico"`, `#form` tiene `position: static`, está al final de la columna (su `top` es mayor que el de cualquier elemento de la conversación y menor que el del pie), `--alto-form` vale `0px` y no queda nada tapado. (3) A **740 × 390** (ventana de menos de 500 px de alto) con el texto al 100 %: `data-modo === "estatico"` y `position: static`. (4) Al cambiar el tamaño de la ventana de 390 × 740 a 740 × 390 y de vuelta, el modo cambia solo, sin recargar. `--alto-form` sigue al alto real de la caja cuando esta crece (se escriben varias líneas en la caja de pregunta).
   - **Botón de la ONU.** A 320, 360, 390 y 639 px: `.a11y-disparador` tiene `position: absolute`, está dentro del rectángulo de la cabecera, mide al menos 44 px por lado, no se superpone con la marca ni con los botones de la cabecera, y con la página desplazada hasta el final no cubre ningún control (`#pregunta`, `#micBtn`, el botón «Enviar», tarjetas, botones de respuesta). A 640, 641, 800, 1024 y 1280 px: `position: fixed` y sin superposición con los controles del formulario. Con el panel abierto en celular, el panel queda por encima. Alt + A y el botón «Accesibilidad» siguen abriendo el panel.
   - **Cabecera.** A 320, 360, 390 y 1100 px: la marca está a 16 px o más del borde izquierdo y el último botón (o el botón de la ONU) a 16 px o más del derecho.
   - **Aviso.** Plegado por defecto: se ve exactamente la frase «Prototipo con documentos en borrador. No escriba datos personales.» (completa: su `scrollWidth` no supera su `clientWidth`, sin `text-overflow`), el botón dice «Ver más» con `aria-expanded="false"`, y `#aviso-texto` tiene el atributo `hidden` (no es visible, no está en el árbol de accesibilidad y su contenido no entra en la lectura de la página). Al pulsar: `aria-expanded="true"`, `#aviso-texto` sin `hidden` y visible debajo de la frase corta, su `textContent` es idéntico al texto del aviso de la v0.3, escrito literal en la prueba (donde la versión de los documentos es la clave `version` de `kb.json`), y el botón dice «Ver menos». Al pulsar de nuevo vuelve a quedar con `hidden`. Se opera con teclado (Enter y Espacio).
   - **Fuente.** Casos 2 (anexo), 4 (acuerdo de una entidad), 1 (texto común) y 5 (varias fuentes), y el caso 7 (pasaje): el `.src` principal coincide con el formato de 8.5 y con la tabla «Fase 8 · fuente» de la sección 7 (con `N` leído de `kb.json`), no hay `.badge` en la página, exactamente un `.src` visible fuera de desplegables contiene «· Borrador», y `.src` está debajo del resumen o de las frases clave.
   - **Resaltado.** En las respuestas de pregunta frecuente (casos 1, 2, 5, 10, 14, 16) no hay ningún `mark`. En las de pasaje (casos 7 y 8) hay `mark` solo dentro del bloque «Lo más relevante del texto oficial» y ninguno en «Texto oficial», «Otras fuentes relacionadas» ni «Texto más cercano».
   - **Resumen.** En las respuestas de pregunta frecuente existe `.resumen` con «En pocas palabras» y su `p.plain` dentro y la fuente fuera; su borde superior mide al menos 2 px y el de `.official` es 0; no está dentro de `.official`; en las respuestas de pasaje no hay `.resumen`. La lectura automática (perfil Visual) sigue leyendo el resumen y la fuente.
   - **Opinión.** En respuestas de pregunta frecuente y de pasaje: `.opinion` es un `role="group"` con nombre «¿Le sirvió esta respuesta?» y botones «Sí» y «No»; es un grupo distinto de `.actions`, que ya no contiene «Me sirvió» ni «No me sirvió». «Sí» anuncia «Gracias por su opinión.» y deshabilita ambos; «No» agrega a la bitácora una entrada con motivo «No le sirvió la respuesta», anuncia el texto de 8.8 y deshabilita ambos. «Depende de su entidad», «No encontrado», «Tema reservado» y el saludo no llevan opinión.
   - **Copiar.** Con un espía de `navigator.clipboard.writeText`, el texto copiado de una respuesta contiene el resumen y no contiene «Copiar», «Imprimir», «¿Le sirvió esta respuesta?» ni el aviso de voz; los grupos vuelven a verse después.
   - **Saludo.** El primer artículo de `#log` tiene exactamente cuatro párrafos, el primero dentro de `<strong>`, con el texto de la sección 6 y `N` igual a `nAcuerdos` de `kb.json`; no contiene «panel «Antes de preguntar»»; no se lee al cargar; con «Escuchar» activado, el espía de voz recibe los cuatro párrafos.
   - **Regiones vivas.** Se repite la comprobación de la fase 7: sin `role="status"`, `role="alert"` ni `aria-live` dentro de `#log` (la opinión y el saludo no los usan).
2. **`pruebas/accesibilidad.mjs`:** agrega a axe y a reflujo el estado **«aviso y configuración desplegados»** (aviso en «Ver menos», `#entidad-detalles` abierto y una respuesta con opinión en pantalla). Quedan **40 combinaciones de axe** (4 variantes × 2 tamaños × 5 estados) y **20 de reflujo** (a 320 px y texto al 200 %; ahí el formulario va en modo estático). La cabecera con el botón de la ONU debe caber a 320 px con texto al 200 %: si no cabe, ajusta el CSS (por ejemplo, que el botón pase a su propia línea alineado a la derecha) sin cambiar textos. La prueba de teclado agrega `aviso-alternar` y `entidad-resumen`.
3. **`pruebas/navegacion.mjs`:** actualiza lo que cambia por la fase 8: la comprobación de «una sola insignia Borrador» pasa a contar `.src` visibles con «· Borrador» (debe ser 1) y sin `.badge`; el orden en el DOM usa `.resumen` en lugar del encabezado suelto; el resto sigue igual.
4. **`pruebas/tablas_glosario.mjs`:** actualiza los selectores de impresión y abre `#entidad-detalles` antes de `selectOption('#entidad')` (8.3, pasos 6 y 7); la comprobación de la fuente del glosario sigue el formato de 8.5.
5. **`package.json`:** `npm run prueba` ejecuta, en este orden: `funcional.mjs`, `perfiles.mjs`, `tablas_glosario.mjs`, `navegacion.mjs`, `diseno.mjs` y `accesibilidad.mjs`. El informe incluye la sección «Diseño y presentación» con el resumen de `diseno.mjs`.

#### 8.11 Documentación y cierre

1. `LEEME.md`: describe la columna única, el celular, el aviso, la línea de fuente, el recuadro «En pocas palabras», la opinión y los iconos (y cómo agregar el icono de un tema nuevo: nombre en `iconos.js` y campo `icono` en `temas.json`).
2. `CHANGELOG.md`: entrada **v0.4** (nuevo, cambiado, pendiente). `package.json` pasa a `0.4.0` y la versión visible (cabecera, chip y pie) a `v0.4`.
3. `BITACORA_IMPLEMENTACION.md`: qué cambió, línea base, resultados de cada archivo de pruebas, decisiones y dudas.
4. Commit «Fase 8: diseño de una columna y presentación de la respuesta». **No hagas `push`.**

**Aceptación:** `npm run prueba` pasa completa (los archivos anteriores con los mismos resultados, salvo los ajustes indicados, más `diseno.mjs` y los 40 y 20 de `accesibilidad.mjs`) con cero violaciones de axe en las cuatro variantes de contraste; en 390 × 740 el botón de la ONU está en la cabecera y no tapa nada; el saludo coincide con la sección 6; el informe se regenera.

**Ajuste posterior a la ejecución (6 de octubre de 2026, pedido de la persona responsable):** se eliminó el aviso inicial de 8.4 (la frase corta, el botón «Ver más» y el texto largo) porque «se sabe que es un prototipo», y el saludo de 8.9 pasó a ser lo primero que se ve: va en `<div id="saludo">` arriba de `#temas`, fuera de `#log` (su encabezado oculto es de nivel 2). El orden queda: saludo, temas, entidad (plegada), conversación, formulario. Las pruebas de `diseno.mjs` y `accesibilidad.mjs` se actualizaron en consecuencia (el estado «aviso y configuración desplegados» pasó a «configuración desplegada»; siguen 40 combinaciones de axe y 20 de reflujo).

**Ideas para después (no las hagas en la fase 8):** versión en Lectura Fácil de las preguntas frecuentes; pictogramas validados; videos en Lengua de Señas Colombiana; bienvenida por necesidades; botón «¿Qué significa?» junto al glosario; mover la bitácora a un menú de administración.

---

## 6. Textos de interfaz (úsalos literal)

- **Sin voz local:** «Este equipo no tiene instalada una voz en español. En Windows puede agregarla en Configuración, Hora e idioma, Voz; en Android y en iPhone, en los ajustes de accesibilidad o de texto a voz.»
- **Lector externo** (bajo la casilla deshabilitada): «Como usa un lector de pantalla, el asistente no leerá en voz alta por su cuenta, para que no se superpongan las dos voces.»
- **Paso 3:** «El perfil activa estos ajustes. Puede cambiarlos cuando quiera con el botón Accesibilidad o con Alt + A.»
- **Tema reservado:** «Este tema está en estudio. El valor de los derechos de participación y la forma de calcularlo se definirán en el acuerdo que apruebe la Sala Plena de la CNSC. Cuando se publique, este asistente mostrará el texto oficial.»
- **Nota de validez:** «Versión accesible para consulta. Rige el texto del acto administrativo que publique la CNSC.»
- **Perfil aplicado** (anuncio): «Se aplicó el perfil {nombre}.»
- **Bienvenida, título:** «Antes de empezar: ajuste el asistente a su medida»
- **Botones de la bienvenida:** «Guardar y empezar», «Omitir»; casilla «Recordar mis preferencias en este equipo».

**Fase 7** (úsalos literal):

- **Temas, título:** «¿Sobre qué quiere saber?»
- **Temas, botón:** «Ocultar los temas» (con la sección desplegada) y «Ver los temas» (plegada).
- **Cuenta de preguntas de una tarjeta:** «{n} preguntas»; «1 pregunta» si es una.
- **Volver:** «Volver a los temas»
- **Buscador de entidad, instrucción** (reemplaza «Elija su entidad en el panel «Antes de preguntar» y vuelva a preguntar.»): «Escriba el nombre de su entidad y elíjala de la lista: el asistente volverá a responder con el texto de su acuerdo.»
- **Buscador de entidad, etiqueta:** «Nombre de su entidad». Nombre de la lista: «Entidades encontradas».
- **Buscador de entidad, estado:** «Una entidad encontrada.» / «{n} entidades encontradas.» / «Sin resultados. Revise la ortografía o escriba otra parte del nombre.» Si hay más de 8: se agrega «Hay más entidades: siga escribiendo para acotar.»
- **Entidad elegida** (texto y anuncio): «Entidad elegida: {entidad}.»
- **Sugerencias** (encabezado, en «No encontrado»): «Preguntas parecidas»
- **Aclaración de la pregunta frecuente** (sin insignia): «{estado}. Respuesta frecuente redactada a partir del texto oficial que aparece abajo.», con el `estado` de la pregunta (por ejemplo, «Borrador para validación»).

**Fase 8** (úsalos literal):

- **Saludo del chat** (reemplaza el mensaje de bienvenida de la conversación, el que se ve y el que se lee en voz alta; cuatro párrafos, el primero en negrita):
  1. «**Hola. Soy el asistente del proceso de selección de Docentes y Directivos Docentes.**»
  2. «Respondo con los proyectos de acuerdo de las {N} entidades y con el proyecto de anexo técnico. En cada respuesta le muestro el texto oficial y de dónde sale.»
  3. «Puede elegir un tema o escribir su pregunta. Si la respuesta depende de su entidad, se la pediré en ese momento.»
  4. «Para cambiar el tamaño de la letra, el contraste o escuchar las respuestas, use el botón Accesibilidad.»
  `{N}` es la cantidad de acuerdos de `kb.json` (`nAcuerdos`, hoy 90); nunca se escribe a mano.
- **Aviso inicial, plegado** (frase completa, con el botón «Ver más»): «Prototipo con documentos en borrador. No escriba datos personales.» Con «Ver más» se despliega debajo el texto actual completo, sin cambios (incluida la versión de los documentos); el botón pasa a «Ver menos».
- **Opinión:** «¿Le sirvió esta respuesta?» con los botones «Sí» y «No». Los anuncios son los de hoy: «Gracias por su opinión.» y «Gracias. La pregunta quedó en la bitácora para mejorar la base.»
- **Micrófono:** texto visible «Dictar».
- **Línea de fuente:** «Fuente: {documento}, {rótulo}» seguida, si corresponde, de «· común a {n} de {N} acuerdos» y de «· Borrador», separadas por « · ».
- **Selector de entidad plegado** (resumen del `<details>`): «Su entidad (opcional)»

Los demás textos ya existen en v0.1; no los cambies.

---

## 7. Casos de prueba funcionales (`pruebas/preguntas.json`)

Cada caso se ejecuta con la entidad vacía al empezar, salvo que diga otra cosa. «Fuente contiene» se compara con `data-fuente-principal` (en las preguntas frecuentes con varias fuentes, con `data-fuentes`).

| # | Pregunta | Tipo esperado | Fuente contiene | Entidad esperada | Desde |
| --- | --- | --- | --- | --- | --- |
| 1 | ¿cuál es el puntaje mínimo para aprobar? | faq | Artículo 13, Parágrafo segundo | — | 0 |
| 2 | cuantos dias tengo para reclamar los resultados de la prueba escrita | faq | Numeral 2.7 | — | 0 |
| 3 | ¿cuántas vacantes hay? | depende-entidad | — | — | 0 |
| 4 | cuantas vacantes ofrece Antioquia | faq | Artículo 8 | Secretaría de Educación Departamental de Antioquia | 0 |
| 5 | me puedo inscribir a dos empleos | faq | Artículo 8, Parágrafo quinto | — | 0 |
| 6 | ¿cuál es el horario de atención de la CNSC en Bogotá? | no-encontrado | — | Secretaría de Educación Distrital de Bogotá | 0 |
| 7 | qué pasa en la audiencia de escogencia de vacante | pasaje | Numeral 7.3 | — | 0 |
| 8 | en qué ciudades se presentan las pruebas | pasaje | Numeral 2.4 | — | 0 |
| 9 | cuántas vacantes de docente de preescolar hay en Amazonas | pasaje | Artículo 8 | Secretaría de Educación Departamental de Amazonas | 0 |
| 10 | las personas con discapacidad pagan | faq | Artículo 6, Parágrafo primero | — | 0 |
| 11 | quién gana el mundial de fútbol | no-encontrado | — | — | 0 |
| 12 | cuánto cuesta la inscripción | tema-reservado | — | — | 4 |
| 13 | cuál es el valor de los derechos de participación | tema-reservado | — | — | 4 |
| 14 | ¿Cómo pago los derechos de participación? | faq | Numeral 1.2.5 | — | 0 |
| 15 | ¿qué es la OPEC? | cualquiera distinto de no-encontrado; la respuesta contiene el botón de glosario «OPEC» | — | — | 4 |
| 16 | ¿Qué pruebas se aplican y cuánto vale cada una? | faq | Artículo 13 | — | 0 |

Si en la fase 0 algún caso vigente no da lo esperado con v0.1, no cambies el motor: anota la diferencia en la bitácora y pregunta.

### Casos de la fase 7

Se verifican en `pruebas/navegacion.mjs`. Los resultados salen de la v0.2 publicada (comprobados el 6 de octubre de 2026); si cambian los acuerdos, se revisan.

**Buscador de entidad.** Se hace la pregunta (sin entidad elegida) y se escribe el texto en el buscador:

| # | Pregunta | Se escribe | Resultado esperado |
| --- | --- | --- | --- |
| E1 | ¿cuántas vacantes hay? | antio | Una opción, «Secretaría de Educación Departamental de Antioquia». Con Enter se elige, y la respuesta nueva es `faq`, fuente principal `Artículo 8`, entidad Antioquia. |
| E2 | ¿cuántas vacantes ofrece mi entidad? | bogota | Una opción, «Secretaría de Educación Distrital de Bogotá». Con clic se elige: `faq`, `Artículo 8`, entidad Bogotá. |
| E3 | ¿cuántas vacantes hay? | antioquia departamental | Una opción (las palabras en otro orden). |
| E4 | ¿cuántas vacantes hay? | BOGOTÁ | Una opción (mayúsculas y tilde). |
| E5 | ¿cuántas vacantes hay? | cali | Una opción, «Secretaría de Educación Distrital de Santiago de Cali». |
| E6 | ¿cuántas vacantes hay? | secretaria | 8 opciones y el estado «{n} entidades encontradas. Hay más entidades: siga escribiendo para acotar.», con `n` igual al número de entidades que contienen la palabra. |
| E7 | ¿cuántas vacantes hay? | zzzz | Sin lista; estado «Sin resultados. Revise la ortografía o escriba otra parte del nombre.» |
| E8 | ¿cuántas vacantes hay? | a | Sin lista y estado vacío (menos de 2 caracteres). |

**Preguntas parecidas** («No encontrado»; el bloque solo aparece si alguna pregunta frecuente tiene `cov >= 0.5`):

| # | Pregunta | Tipo | Preguntas parecidas esperadas (en este orden) |
| --- | --- | --- | --- |
| P1 | cuánto dura la entrevista | no-encontrado | «¿Cuánto vale la entrevista?» |
| P2 | cuándo salen los resultados | no-encontrado | «¿Cuánto tiempo tengo para reclamar los resultados de las pruebas escritas?»; «¿Cómo reclamo el resultado de requisitos mínimos?» |
| P3 | cuánto tarda el proceso | no-encontrado | «¿Cuáles son las etapas del proceso?» |
| P4 | qué pasa si no apruebo | no-encontrado | ninguna (sin el bloque) |
| P5 | dónde reclamo si no estoy de acuerdo | no-encontrado | ninguna (sin el bloque) |
| P6 | quién gana el mundial de fútbol | no-encontrado | ninguna (sin el bloque) |

**Temas.** Las doce preguntas de `faq.json`, escritas tal cual, dan `faq` (`vacantes-entidad`, sin entidad, da `depende-entidad`). «¿Cuánto vale la entrevista?», elegida desde el tema «Pruebas y puntajes», da `faq` con fuente principal `Numeral 6.1`.

### Casos de la fase 8

Se verifican en `pruebas/diseno.mjs`.

**Fuente en una línea** (`.src` de la fuente principal; `{n}` y `{N}` se leen de los datos: la v0.3 muestra n = 89 y N = 90 en el caso 1):

| Caso (sección 7) | Respuesta | Línea de fuente esperada |
| --- | --- | --- |
| 1 | pregunta frecuente, texto común | `Fuente: Proyectos de Acuerdo de convocatoria, Artículo 13, Parágrafo segundo · común a {n} de {N} acuerdos · Borrador` |
| 2 | pregunta frecuente, anexo | `Fuente: Proyecto de Anexo Técnico Docentes 2026, Numeral 2.7 · Borrador` |
| 4 | pregunta frecuente con entidad | `Fuente: Proyecto de Acuerdo de Secretaría de Educación Departamental de Antioquia, Artículo 8 · Borrador` |
| 5 | pregunta frecuente con dos fuentes | la primera como en el caso 1; la segunda (`Numeral 1.2.5`), visible y sin «· Borrador» |
| 7 | pasaje del anexo | `Fuente: Proyecto de Anexo Técnico Docentes 2026, Numeral 7.3 · Borrador` |

**Ventanas** (ancho × alto) para las pruebas de columna, cabecera, botón de la ONU y caja de pregunta (a estas se suman 740 × 390, horizontal, y 390 × 740 con el texto al 200 %): 320 × 640, 360 × 740, 390 × 740, 639 × 800, 640 × 800, 641 × 800, 800 × 800, 1024 × 800, 1100 × 900 y 1280 × 800.

---

## 8. Pruebas manuales que quedan para las personas (lístalas en el informe)

- NVDA + Firefox y JAWS + Chrome en Windows: bienvenida, pregunta, respuesta con tabla, glosario, panel.
- VoiceOver en iPhone (Safari) y TalkBack en Android (Chrome).
- Lectura en voz alta con una voz local instalada (Windows: Microsoft Sabina o Raúl).
- Zoom del navegador al 400 % en computador.
- Validación de los textos de los perfiles y de las preguntas frecuentes con personas con discapacidad.
- (Fase 7) Buscador de entidad con NVDA, JAWS, VoiceOver y TalkBack: que anuncien el número de resultados y la opción activa.
- (Fase 8) Celular real (iPhone con Safari y Android con Chrome): que el botón de accesibilidad en la cabecera no tape nada, que la caja de pregunta fija se comporte bien con el teclado en pantalla y en horizontal, y que las tarjetas con iconos se vean completas.
- (Fase 8) Modo de contraste forzado de Windows: que los iconos y los recuadros se vean.
- (Fase 7) Pruebas de uso con 4 o 5 personas por grupo (baja visión o ceguera, sordera, discapacidad física, discapacidad intelectual y adultos mayores). Tareas: «encuentre cuántos días tiene para reclamar los resultados» y «encuentre las vacantes de su entidad». Se anota si lo logra, cuánto tarda y dónde se detiene.

---

## 9. Lo que no debes hacer

- No cambiar umbrales, sinónimos ni lógica del motor de búsqueda (salvo lo que pide la fase 4.3).
- No editar `faq.json` ni el texto de los documentos.
- No agregar entradas al glosario sin regla de extracción literal.
- No usar Tailwind por CDN, ni React, ni librerías de interfaz: el resultado debe funcionar sin internet.
- No usar `localStorage` sin `try/catch`.
- No dejar `console.log` de depuración.
- No publicar el archivo en ningún servidor por tu cuenta. La publicación en GitHub Pages (`.github/workflows/publicar.yml`) se dispara con cada `git push` a `master`: **no hagas `push`**; lo decide la persona responsable.
- (Fase 8) No modificar `vendor/` para mover el botón flotante del panel (solo CSS propio); no cambiar textos de contenido fuera del saludo; no escribir a mano el número de acuerdos.
- (Fase 7) No agregar preguntas frecuentes ni texto jurídico para llenar un tema; no cambiar los umbrales del motor para que una sugerencia aparezca o no.
