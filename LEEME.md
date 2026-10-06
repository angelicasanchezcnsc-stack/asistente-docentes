# Asistente Docentes v0.1 (prototipo)

Asistente del proceso de selección Docentes y Directivos Docentes. Responde solo con los proyectos de acuerdo (90 entidades) y el proyecto de Anexo Técnico Docentes 2026, en versión borrador, y muestra en cada respuesta el texto oficial y su fuente.

## Cómo abrirlo

Abra `asistente-docentes.html` con doble clic en Chrome o Edge. Funciona sin servidor y sin internet (solo la tipografía se descarga de internet si hay conexión). Para publicarlo basta subir ese único archivo a cualquier servidor web.

## Qué hace

- Busca en la colección del proceso elegido y responde con el fragmento oficial y su fuente: documento, artículo o numeral y versión.
- Si la persona elige su entidad, usa el texto exacto del acuerdo de esa entidad. Sin entidad, usa el texto común a los acuerdos y avisa cuando la información depende de la entidad (por ejemplo, vacantes).
- Preguntas frecuentes en lenguaje claro (`herramientas/faq.json`), cada una atada a su fuente y marcada como borrador para validación.
- Si no encuentra la respuesta, no la inventa: la registra en la bitácora.
- Accesibilidad: lector de pantalla (región de conversación anunciada, etiquetas, teclado), botón Escuchar, lectura automática, velocidad de voz, dictado por micrófono (Chrome y Edge), alto contraste, tamaño de texto y diseño para celular. Revisado con axe-core sin errores WCAG 2.1 AA.

## Cómo actualizar la base de conocimiento

Requiere Python 3 con `beautifulsoup4` (`pip install beautifulsoup4`). Desde la carpeta `herramientas`:

1. Reemplace los HTML accesibles de la carpeta `CHATBOT` (acuerdos y anexo) por las versiones nuevas.
2. `python extract.py` (lee los HTML y genera `raw.json`).
3. `python buildkb.py` (genera `kb.json`).
4. `python construir_html.py` (genera `asistente-docentes.html` en la carpeta del prototipo).

Para agregar una pregunta frecuente, copie una entrada de `faq.json`, ajuste `pregunta`, `claves` (palabras con que la gente pregunta), `respuesta` y `fuentes` (rótulo exacto, por ejemplo `Artículo 13` o `Numeral 2.7`), y repita el paso 4.

## Limitaciones de esta versión

- Las fuentes son borradores; la etiqueta «Borrador» aparece en cada respuesta.
- La bitácora se guarda en el navegador de quien usa el asistente; se descarga en CSV desde el botón Bitácora. En la versión publicada debe guardarse en un servidor.
- Fuera de las preguntas frecuentes, la respuesta es el texto oficial con las frases más relevantes resaltadas, no un resumen redactado. Un resumen automático requiere autorizar un modelo de lenguaje.
- En el selector de proceso, Planeación de municipios de 5.ª y 6.ª categoría (a cargo de Fabian Blanco) aparece como «próximamente»: usará el mismo motor con su propia base de documentos.
