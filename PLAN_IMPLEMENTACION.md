# Plan de implementación — Asistente Docentes v0.2

Versión del plan: 6 de octubre de 2026. Responsable funcional: Angélica (Despacho EARM, CNSC).

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
│       └── reservados.js          ← fase 4
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
│   └── construir.mjs              ← reemplaza a construir_html.py (fase 1)
└── pruebas/
    ├── preguntas.json             ← casos y resultado esperado
    ├── funcional.mjs
    ├── accesibilidad.mjs
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

---

## 8. Pruebas manuales que quedan para las personas (lístalas en el informe)

- NVDA + Firefox y JAWS + Chrome en Windows: bienvenida, pregunta, respuesta con tabla, glosario, panel.
- VoiceOver en iPhone (Safari) y TalkBack en Android (Chrome).
- Lectura en voz alta con una voz local instalada (Windows: Microsoft Sabina o Raúl).
- Zoom del navegador al 400 % en computador.
- Validación de los textos de los perfiles y de las preguntas frecuentes con personas con discapacidad.

---

## 9. Lo que no debes hacer

- No cambiar umbrales, sinónimos ni lógica del motor de búsqueda (salvo lo que pide la fase 4.3).
- No editar `faq.json` ni el texto de los documentos.
- No agregar entradas al glosario sin regla de extracción literal.
- No usar Tailwind por CDN, ni React, ni librerías de interfaz: el resultado debe funcionar sin internet.
- No usar `localStorage` sin `try/catch`.
- No dejar `console.log` de depuración.
- No publicar el archivo en ningún servidor.
