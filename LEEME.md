# Asistente Docentes v0.5 (prototipo)

Asistente del Despacho del Comisionado Edwin Arturo Ruiz Moreno (CNSC) para el proceso de selección de Docentes y Directivos Docentes. Responde **solo** con los proyectos de acuerdo (90 entidades territoriales certificadas) y el proyecto de Anexo Técnico Docentes 2026, en versión borrador, y con la OPEC del proceso (vacantes, requisitos y funciones de cada empleo), y muestra en cada respuesta el texto oficial y su fuente. No usa modelos de inteligencia artificial: busca y muestra.

## Cómo abrirlo

Abra `asistente-docentes.html` con doble clic en Chrome o Edge. Es un solo archivo: no necesita servidor ni internet (las fuentes van incrustadas). No pide ni guarda datos personales; la bitácora se guarda solo en el navegador.

## Qué hace

- Busca en los documentos y responde con el fragmento oficial y su fuente: documento, artículo o numeral, y la etiqueta «Borrador».
- Si la persona elige su entidad, usa el texto exacto del acuerdo de esa entidad. Sin entidad, usa el texto común a los acuerdos y avisa cuando la información depende de la entidad (por ejemplo, las vacantes).
- **Una sola columna** de 800 px como máximo, centrada, en todas las pantallas. De arriba abajo: el saludo, los temas, «Su entidad (opcional)» (plegado), la conversación y la caja de pregunta, que queda fija abajo (pasa al final de la columna si la ventana mide menos de 500 px de alto o si la caja ocupa más de un tercio de la ventana, por ejemplo con el texto al 200 %). En celular (menos de 640 px) el botón de accesibilidad con el símbolo de la ONU va en la cabecera y no tapa nada.
- **Advertencia de datos personales:** la caja de pregunta lleva debajo de su título el texto de ayuda «No escriba datos personales.», enlazado con la caja (`aria-describedby`).
- **Logo de la CNSC** en la cabecera, incrustado en el archivo (`src/img/cnsc-logo.png`, copia del de IncluIA).
- **Saludo primero:** al abrirlo, lo primero que se ve es «Hola. Soy el asistente del proceso de selección de Docentes y Directivos Docentes.», con una breve orientación (elegir un tema o escribir, la entidad se pide cuando hace falta y dónde cambiar la letra o escuchar las respuestas). Después van los temas.
- **Temas:** al abrirlo se ven cinco tarjetas con su icono (Inscripción y pago, Vacantes, Pruebas y puntajes, Resultados y reclamaciones, Etapas del proceso) que llevan a las preguntas frecuentes sin escribir.
- **Vacantes en la OPEC:** cuando una respuesta muestra el artículo 8 del acuerdo de una entidad (por ejemplo, «¿cuántas vacantes ofrece Antioquia?»), debajo aparece el bloque «Vacantes en la OPEC», con la fecha de corte y una tabla por empleo (sin reserva, con reserva para personas con discapacidad y total). Debajo de la tabla, un desplegable da para cada empleo el número de OPEC y sus vacantes, los tipos de discapacidad de las vacantes con reserva, los requisitos de estudio y experiencia, las alternativas y las funciones. El texto sale literal de la OPEC (en mayúsculas, como viene) y las cifras se suman desde los datos. Las cifras de la OPEC pueden ser distintas de las del proyecto de acuerdo, que es anterior, y la respuesta lo dice.
- Preguntas frecuentes en lenguaje claro (`herramientas/faq.json`), cada una atada a su fuente y marcada como borrador para validación.
- **Buscador de entidad dentro de la respuesta:** cuando la información depende de la entidad, la respuesta trae un campo para escribir el nombre (sin tildes y en cualquier orden), con lista de opciones y manejo por teclado. Al elegirla, el asistente vuelve a responder con el acuerdo de esa entidad.
- **Estructura fija de cada respuesta:** en las preguntas frecuentes, «En pocas palabras» en su recuadro; luego la fuente en una sola línea («Fuente: … · común a N de 90 acuerdos · Borrador»), el texto oficial con su nota de validez y las otras fuentes relacionadas. Sin resaltado de palabras en las preguntas frecuentes (en los fragmentos solo se resaltan las frases clave). Al pie, «Escuchar», «Copiar» e «Imprimir» van aparte de la opinión («¿Le sirvió esta respuesta?» con «Sí» y «No»). La letra base es de 18 px y las líneas no pasan de 70 caracteres. Si no encuentra la respuesta, ofrece «Preguntas parecidas».
- Si no encuentra la respuesta, no la inventa: la registra en la bitácora (botón «Bitácora», con descarga en CSV; los números de 6 o más dígitos se ocultan).
- **Bienvenida y perfiles.** En la primera visita, un diálogo permite elegir un perfil (Visual, Auditivo, Físico, Intelectual, Psicosocial, Sordoceguera, Múltiple, Adulto mayor o Sin preferencia), indicar si se usa un lector de pantalla y activar la lectura en voz alta de cada respuesta nueva. El botón «Perfil» lo vuelve a abrir y conserva la conversación.
- **Panel de accesibilidad** del Instrumento EBAR (el mismo de IncluIA): botón «Accesibilidad» o Alt + A. Tamaño del texto, cuatro variantes de contraste (normal, oscuro, alto y alto oscuro), espaciado, altura de línea, tipografías legible y para dislexia, lectura facilitada, resaltado de enlaces, sin animaciones, cursor grande, guía de lectura, foco reforzado y áreas de clic amplias.
- **Lectura en voz alta** solo con voces instaladas en el equipo (nunca voces en línea). Se prefiere una voz latinoamericana: el asistente ofrece primero la colombiana (es-CO), luego las demás de América (es-MX, es-US, es-AR…) y por último las de España (es-ES). Si el equipo solo tiene voces de España, junto al botón «Escuchar» aparece cómo agregar una voz latinoamericana (en Windows, «Español (México)», con las voces Sabina o Raúl). Se activa con «Botón «Escuchar» en cada respuesta» en el panel. Las tablas se leen fila por fila, con el encabezado de cada columna. Si el equipo no tiene una voz en español, el botón queda deshabilitado y explica cómo instalarla.
- **Tablas** con su título (`<caption>`), **glosario** (la primera aparición de cada término es un botón que abre su definición literal con su fuente), **nota de validez** al final de cada texto oficial e **impresión** de una sola respuesta con el botón «Imprimir».
- **Temas en reserva de Sala Plena:** las preguntas sobre el valor de los derechos de participación reciben un aviso en lugar de una respuesta, y los pasajes con ese valor no se buscan.
- Atajos de teclado: Alt + A abre el panel de accesibilidad, Alt + 1 va a la caja de pregunta, Enter envía la pregunta y Escape cierra los diálogos.

## Qué necesita para regenerarlo

- Node 22 o superior y npm.
- Python 3.10 o superior con `beautifulsoup4` y `openpyxl` (`python -m pip install beautifulsoup4 openpyxl`).
- La primera vez, en la carpeta del prototipo: `npm install` y `npx playwright install chromium`.

Los comandos se ejecutan desde la carpeta del prototipo (`PROTOTIPO ASISTENTE DOCENTES`).

## Cómo actualizar la base cuando lleguen los acuerdos definitivos

1. Pase los acuerdos y el anexo por Lexible y ponga los HTML accesibles en la carpeta `CHATBOT`, que está un nivel arriba del prototipo, reemplazando los anteriores:
   - los acuerdos, en `CHATBOT\ACUERDOS DOCENTES Y DIRECTIVOS DOCENTOS ACCESIBLES\` (un `.html` por entidad, con el nombre `Proyecto de Acuerdo <entidad>.html`);
   - el anexo, en `CHATBOT\Proyecto Anexo Tecnico Docentes 2026 Formato accesible_accesible.html`.
2. `python herramientas/extract.py` lee los HTML y genera `herramientas/raw.json` (intermedio, no se versiona). Si la carpeta `CHATBOT` está en otro lugar, pase su ruta como argumento.
3. `python herramientas/buildkb.py` genera `herramientas/kb.json`: textos únicos, acuerdos, texto común y glosario. Si una regla del glosario no encuentra su marcador, termina con un error que dice cuál.
4. Revise `herramientas/faq.json` y `herramientas/glosario.json`: cada pregunta frecuente cita un rótulo (por ejemplo, `Artículo 13`) y cada definición un numeral del anexo. Si los acuerdos definitivos cambian la numeración, hay que ajustarlos.
5. `npm run construir` genera `asistente-docentes.html` (archivo único) en la carpeta del prototipo.
6. `npm run prueba` ejecuta las pruebas y genera `pruebas/INFORME_PRUEBAS.md`. Si cambian los textos, los resultados esperados de `pruebas/preguntas.json` (que citan artículos y numerales) pueden necesitar revisión.

Se versionan `kb.json`, `faq.json`, `glosario.json`, `temas_reservados.json`, `opec.json` y el `asistente-docentes.html` generado; `raw.json` y `node_modules` no.

## Cómo actualizar la OPEC

La OPEC sale del reporte de vacantes en Excel (hoy, `rp docentes 07.10.2026.xlsx`, con corte del 7 de octubre de 2026). El Excel no se copia al prototipo.

1. `python herramientas/opec.py "<ruta del reporte .xlsx>" --corte AAAA-MM-DD` genera `herramientas/opec.json`. Por ejemplo: `python herramientas/opec.py "C:\01_APLICACIONES\CHATBOT\rp docentes 07.10.2026.xlsx" --corte 2026-10-07`.
2. El script lee **solo la hoja «Base de datos»**. Las demás hojas del reporte son de control interno y no se usan. De esa hoja toma solo estas columnas: entidad, número de OPEC, modalidad, denominación, nivel, estado, origen, proceso, tipos de discapacidad, requisitos de estudio y experiencia, alternativas y funciones. No toma NIT, identificadores, códigos de verificación ni fechas de generación.
3. Cuenta solo las vacantes de la convocatoria del proceso (`origen_modelo` = `CONVOCATORIA`, `estado` = 1). Las demás las excluye y avisa cuántas son por entidad.
4. El texto queda literal. Solo se quitan los espacios sobrantes de los extremos, y la alternativa de estudio y experiencia se parte por `---`.
5. Termina con un error que dice el motivo en estos casos:
   - falta la hoja o una columna;
   - aparece una modalidad desconocida;
   - la marca de discapacidad no corresponde a la modalidad;
   - un empleo trae dos juegos de requisitos;
   - una entidad de la OPEC no se empareja con un acuerdo de `kb.json`, o un acuerdo queda sin OPEC.

   Los nombres que no se emparejan con la normalización se agregan en la tabla `ALIAS` del script.
6. Al final imprime los totales (vacantes, sin reserva, con reserva, entidades y números de OPEC), las excluidas y los alias usados. Revíselos.
7. `npm run construir`, que vuelve a validar las cifras, y `npm run prueba`. Los valores esperados de `pruebas/opec.mjs` se leen de `opec.json`.

## Cómo agregar contenido

**Pregunta frecuente.** Copie una entrada de `herramientas/faq.json` y ajuste:

- `id`: nombre corto y único.
- `pregunta`: la pregunta en lenguaje claro (también es el texto del botón que la lanza desde un tema).
- `claves`: palabras con que la gente pregunta, separadas por espacios (ayudan a encontrarla).
- `respuesta`: respuesta breve redactada a partir del texto oficial; `{entidad}` se reemplaza por la entidad elegida.
- `fuentes`: lista de `{"tipo": "anexo" | "acuerdo", "rotulo": "Artículo 13"}`. El rótulo debe existir tal cual en los documentos (por ejemplo, `Artículo 8, Parágrafo quinto` o `Numeral 2.7`).
- `estado`: «Borrador para validación», hasta que el equipo temático la valide.
- `requiereEntidad` y `sinEntidad` (opcionales): para respuestas que cambian según la entidad.

Después, `npm run construir` y `npm run prueba`. No se edita el texto de los documentos.

**Tema de las tarjetas.** Cada tema de `herramientas/temas.json` tiene un `id`, un `titulo`, un `icono` (uno de los de `src/js/iconos.js`: `carpeta-lista`, `maletin`, `lapiz`, `documento-alerta` o `ruta`) y la lista de `id` de las preguntas frecuentes que muestra, en orden. Para un icono nuevo, agregue su SVG de línea (estilo Lucide, `currentColor`) a `ICONOS` en `src/js/iconos.js`. `npm run construir` falla, diciendo cuál, si un `id` de tema se repite, si un tema no tiene título, icono ni preguntas, si el icono no existe, si cita una pregunta que no existe en `faq.json` o si alguna pregunta de `faq.json` no está en ningún tema. Una pregunta nueva debe agregarse a un tema. No se crean tarjetas de temas sin preguntas frecuentes validadas.

**Entrada del glosario.** Copie una de `herramientas/glosario.json` (`termino`, `variantes` con las formas en que aparece en el texto, `fuente` con el rótulo del anexo) y escriba su regla de extracción literal: `oracion_con` (la oración completa que contiene el marcador) o `desde` y `hasta` (marcador inicial, incluido, y marcador final, excluido). `python herramientas/buildkb.py` extrae la definición y falla, diciendo cuál marcador no encontró, si la regla no coincide con el texto. No se agregan términos sin una regla de extracción literal.

**Tema reservado.** Agregue una entrada a `herramientas/temas_reservados.json`:

- `grupo_a` y `grupo_b`: términos sin tildes y en minúscula. La pregunta se reserva si trae al menos uno de cada grupo, como palabra o frase completa.
- `excluir_pasajes_con`: expresión regular de los pasajes que dejan de buscarse y de citarse (no distingue mayúsculas).
- El texto del aviso está en `src/js/reservados.js` (`MENSAJE_RESERVADO`); el campo `mensaje` del JSON solo remite a él.

Cuando la Sala Plena apruebe el valor, se quita la entrada, se regenera y las pruebas 12 y 13 de `pruebas/preguntas.json` dejan de aplicar.

## Estructura de la carpeta

- `asistente-docentes.html`: el resultado (se abre con doble clic).
- `src/`: código fuente. `index.html` (estructura), `css/` (marca, contraste, chat, navegación e impresión) y `js/` (módulos ES: motor de búsqueda, base de conocimiento, respuestas, bitácora, accesibilidad, bienvenida, glosario, temas reservados, tarjetas de temas, buscador de entidad, iconos y bloque de la OPEC).
- `vendor/ebar/`: copias **sin modificar** del panel de accesibilidad del EBAR, su motor de voz y las fuentes. `ORIGEN.md` registra de dónde salen y su SHA-256. No se editan: se adaptan por configuración y con CSS propio.
- `herramientas/`: `extract.py`, `buildkb.py`, `opec.py`, `construir.mjs` y los datos (`kb.json`, `faq.json`, `glosario.json`, `temas_reservados.json`, `temas.json`, `opec.json`).
- `pruebas/`: pruebas con Playwright y axe-core, y `INFORME_PRUEBAS.md`.
- `CLAUDE.md` y `PLAN_IMPLEMENTACION.md`: reglas y plan del proyecto. `BITACORA_IMPLEMENTACION.md`: qué se hizo en cada fase, resultados y dudas. `CHANGELOG.md`: cambios por versión.

## Pruebas

`npm run prueba` ejecuta, en orden: las pruebas funcionales (`preguntas.json`), las de bienvenida y perfiles, las de tablas, glosario, temas reservados e impresión, las de navegación guiada (temas, buscador de entidad, estructura de respuesta y preguntas parecidas), las de diseño (columna, celular, caja de pregunta, fuente, resumen, opinión y saludo), las del bloque de la OPEC (datos, cifras, tabla, detalle por empleo, voz e impresión) y las de accesibilidad (axe en cuatro variantes de contraste con texto al 100 % y al 200 %, reflujo a 320 px, teclado, voz sin voz local y región viva). La última genera `pruebas/INFORME_PRUEBAS.md`, que también lista las pruebas manuales que faltan.

## Cómo publicarlo en GitHub Pages

El flujo `.github/workflows/publicar.yml` publica **solo** `asistente-docentes.html` (como `index.html`) en GitHub Pages cada vez que cambia ese archivo en la rama `master`, o a mano desde la pestaña Actions. No construye nada: el HTML generado ya está versionado, así que antes de subir cambios se ejecuta `npm run construir`.

GitHub Pages gratuito exige un repositorio **público**: con él quedan visibles el código, el plan y la bitácora, y los mensajes de los commits con su autor (`Despacho EARM CNSC`, `despacho-earm@cnsc.gov.co`). Publicar es un acto del Despacho: lo que se sube puede quedar copiado o indexado aunque después se borre.

Primera publicación (en la carpeta del prototipo, con `gh` ya autenticado en la cuenta o la organización que corresponda):

1. Cree el repositorio público y suba el contenido: `gh repo create asistente-docentes --public --source . --push` (cambie el nombre si hace falta; con una organización, `ORGANIZACION/asistente-docentes`).
2. En GitHub, en **Settings → Pages → Build and deployment → Source**, elija **GitHub Actions**.
3. En la pestaña **Actions**, ejecute «Publicar en GitHub Pages» con **Run workflow** (o haga cualquier cambio en `asistente-docentes.html`). Al terminar, el paso «Publicar» muestra la dirección, que será `https://<cuenta>.github.io/asistente-docentes/`.

Para actualizar: `npm run construir`, `npm run prueba`, commit y `git push`. La bitácora de preguntas sigue guardándose solo en el navegador de cada persona; en la versión publicada no llega al equipo temático.

## Limitaciones

- Las fuentes son borradores; la etiqueta «Borrador» aparece en cada respuesta, y rige el texto del acto administrativo que publique la CNSC.
- Fuera de las preguntas frecuentes, la respuesta es el texto oficial con las frases más relevantes resaltadas, no un resumen redactado.
- La bitácora se guarda en el navegador de quien usa el asistente y se descarga en CSV. En una versión publicada, debe guardarse en un servidor.
- Las pruebas automáticas corren en Chromium. Faltan las pruebas manuales con lectores de pantalla (NVDA, JAWS, VoiceOver, TalkBack), con una voz local instalada, con zoom al 400 % y con personas con discapacidad.
- «Escuchar» no lee el texto de los desplegables cerrados.
- La OPEC es la del corte indicado en cada respuesta. La OPEC oficial es la publicada en SIMO; el área responsable debe cotejar el asistente con SIMO.
- La OPEC no dice en qué establecimiento educativo está cada vacante («donde se ubique el cargo»). La escogencia de la vacante se hace en la audiencia pública del artículo 31.
- Solo las respuestas del artículo 8 muestran la OPEC. Todavía no se puede buscar un empleo ni un número de OPEC desde la caja de pregunta.
- Con «Recordar mis preferencias» desmarcado, el estado del panel de accesibilidad se guarda igual en el navegador (es la única clave que lee el panel).
- En el selector de proceso, Planeación de municipios de 5.ª y 6.ª categoría (a cargo de Fabian Blanco) aparece como «próximamente»: usará el mismo motor con su propia base de documentos.
