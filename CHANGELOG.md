# Cambios

## v0.4 — 6 de octubre de 2026

### Nuevo

- **Una sola columna centrada** (800 px como máximo) en todas las pantallas, con la conversación sin desplazamiento interno y la **caja de pregunta fija abajo**. La caja pasa al final de la columna cuando la ventana mide menos de 500 px de alto o cuando ocupa más de un tercio de la ventana (por ejemplo, con el texto al 200 %).
- **Celular:** el botón de accesibilidad con el símbolo de la ONU va en la cabecera (ya no flota sobre el contenido), con margen lateral de 16 px. El selector de entidad queda plegado («Su entidad (opcional)») debajo de los temas.
- **Iconos de línea** (estilo Lucide) junto al texto de cada tarjeta de tema y texto visible «Dictar» junto al micrófono.
- **Aviso inicial corto** con «Ver más» («Ver menos»), que despliega el texto completo.
- **Recuadro propio para «En pocas palabras»** en las preguntas frecuentes.
- **Opinión como grupo propio:** «¿Le sirvió esta respuesta?» con «Sí» y «No», separada de Copiar e Imprimir.
- **Saludo nuevo del chat**, en cuatro párrafos, con el número de entidades leído de los datos.
- Prueba `pruebas/diseno.mjs` y dos estados nuevos en las pruebas de accesibilidad («aviso y configuración desplegados»).

### Cambiado

- **La fuente va en una sola línea** de texto, sin insignias: «Fuente: … · común a N de 90 acuerdos · Borrador».
- **Sin resaltado de palabras** en las respuestas de preguntas frecuentes; en los fragmentos, solo en las frases clave.
- «Copiar» copia la respuesta sin los botones, la opinión ni el aviso de voz.
- «Me sirvió» y «No me sirvió» pasan a «Sí» y «No» dentro del grupo de opinión.
- El panel lateral «Antes de preguntar» desaparece: sus selectores van en «Su entidad (opcional)».
- Las tarjetas de temas y sus títulos se parten antes de desbordar a 320 px con texto al 200 %.

### Pendiente

- Las pruebas manuales de la v0.3 y, para esta versión, el celular real (iPhone con Safari y Android con Chrome: botón en la cabecera y caja fija con el teclado en pantalla y en horizontal) y el modo de contraste forzado de Windows (ver `pruebas/INFORME_PRUEBAS.md`).

## v0.3 — 6 de octubre de 2026

### Nuevo

- **Tarjetas de temas** para llegar a las preguntas frecuentes sin escribir: Inscripción y pago, Vacantes, Pruebas y puntajes, Resultados y reclamaciones, y Etapas del proceso (`herramientas/temas.json`, validado al construir). La sección se pliega al enviar cualquier pregunta y se reabre con «Ver los temas». Reemplaza la lista de siete preguntas del panel lateral.
- **Buscador de entidad dentro de la respuesta «Depende de su entidad»:** campo con lista de opciones (patrón combobox), sin importar tildes, mayúsculas ni el orden de las palabras, con máximo de 8 opciones, manejo por teclado y avisos en la región de estado de la página. Al elegir la entidad, la misma pregunta se responde con el acuerdo de esa entidad.
- **Preguntas parecidas** cuando una pregunta no se encuentra (sugeridas con el mismo índice de las preguntas frecuentes, sin cambiar los umbrales del motor).
- Prueba `pruebas/navegacion.mjs` y nuevos estados en las pruebas de accesibilidad (temas y buscador de entidad).

### Cambiado

- **Estructura fija de cada respuesta:** respuesta corta, fuente en una línea, texto oficial con su nota de validez y, al final, otras fuentes relacionadas. Una sola etiqueta «Borrador» visible por respuesta, sin encabezados vacíos y con la aclaración de la pregunta frecuente sin insignia.
- **Excepción de accesibilidad al sistema de diseño EARM (aprobada por la persona responsable):** se quitaron las mayúsculas sostenidas de botones, etiquetas, encabezados de respuesta, insignias, tablas de la bitácora y pie. Las mayúsculas sostenidas dificultan la lectura de personas con dislexia o baja visión. El nombre de la marca conserva sus mayúsculas.
- **Letra más grande por defecto:** el tamaño base pasa a 18 px (el panel sigue mostrando «100 %» como tamaño normal), ningún texto visible mide menos de 0,75 rem y las líneas de respuesta no pasan de 70 caracteres.
- «Depende de su entidad» ya no manda al panel lateral a elegir la entidad y volver a preguntar.
- Las palabras largas se parten antes de desbordar a 320 px con texto al 200 %.

### Corregido

- La construcción escapaba mal las secuencias `</` de los datos y del código incrustado (el escape se perdía al escribir el archivo); ahora un texto con `</script` no puede cerrar la etiqueta de datos.

### Pendiente

- Las mismas pruebas manuales de la v0.2 y, para esta versión, el buscador de entidad con lectores de pantalla y las pruebas de uso con personas de distintos grupos (ver `pruebas/INFORME_PRUEBAS.md`).
- Ideas para después: bienvenida por necesidades, Lectura Fácil, pictogramas, videos en lengua de señas, botón «¿Qué significa?» junto al glosario, barra de acciones, mover la bitácora a un menú de administración y tarjetas de «Fechas» y «Ajustes razonables» cuando existan preguntas frecuentes validadas.

## v0.2 — 6 de octubre de 2026

### Nuevo

- **Panel de accesibilidad del Instrumento EBAR** (el mismo de IncluIA), con la misma clave de preferencias. Reemplaza los botones A−, A+, Alto contraste, Lectura automática y la velocidad de la voz de la cabecera. Se abre con el botón «Accesibilidad» o con Alt + A.
- **Cuatro variantes de contraste** (normal, oscuro, alto y alto oscuro) definidas una por una con variables CSS, sin inversión de colores.
- **Lectura en voz alta solo con voces locales**, con el motor del EBAR. Botón «Escuchar» en cada respuesta (opcional en el panel) y aviso cuando el equipo no tiene una voz en español. Las tablas se leen fila por fila.
- **Bienvenida de accesibilidad con perfiles**, de Lexible: nueve perfiles con su preajuste del panel, aviso de lector de pantalla externo, lectura automática de cada respuesta nueva y lista de atajos de teclado. Botón «Perfil» para cambiarlo sin perder la conversación. Alt + 1 va a la caja de pregunta.
- **Tablas con título** y encabezados por columna.
- **Glosario literal**: siete términos (OPEC, SIMO, educación formal, educación continua y tres tipos de experiencia) extraídos del anexo con reglas, que abren su definición con fuente y etiqueta «Borrador».
- **Temas en reserva de Sala Plena**: las preguntas sobre el valor de los derechos de participación reciben un aviso, y los pasajes con ese valor salen del índice y de las preguntas frecuentes.
- **Nota de validez** al final de cada texto oficial y botón «Imprimir» para una sola respuesta.
- **Botón flotante del panel con el símbolo de accesibilidad de la ONU**, el mismo de IncluIA, incrustado en el archivo.
- **Identidad visual del kit EARM** (la de Lexible e IncluIA): marca con el cuadro oscuro, el nombre en Plus Jakarta Sans con la segunda palabra resaltada y el chip de versión en JetBrains Mono, y texto en Atkinson Hyperlegible Next. Todas las fuentes van incrustadas.
- **Pruebas** con Playwright y axe-core: casos funcionales, perfiles, tablas y glosario, y accesibilidad (24 combinaciones de axe, reflujo a 320 px, teclado, voz y región viva), con informe en `pruebas/INFORME_PRUEBAS.md`.
- Atributos `data-tipo`, `data-fuentes`, `data-fuente-principal` y `data-entidad` en cada respuesta, para las pruebas.

### Cambiado

- El código ya no está en un solo archivo: se divide en `src/` (módulos ES y hojas CSS) y se empaqueta con esbuild (`npm run construir`) en el mismo `asistente-docentes.html` de siempre. Se eliminaron `plantilla.html` y `construir_html.py`.
- Ya no se descarga ninguna fuente de internet.
- El motor de búsqueda, los umbrales, los sinónimos y las preguntas frecuentes no cambiaron.

### Corregido

- Con texto al 200 % y 320 px de ancho, la página se desbordaba horizontalmente.
- La primera parada de Tab caía en el botón «Copiar» de la bienvenida y no en «Saltar a escribir la pregunta».
- La región con desplazamiento de la bitácora no se podía enfocar con teclado.

### Pendiente

- Pruebas manuales con NVDA, JAWS, VoiceOver y TalkBack; con una voz local instalada; con zoom al 400 %; y la validación de los textos de los perfiles y de las preguntas frecuentes con personas con discapacidad.

## v0.1 — 5 de octubre de 2026

Prototipo inicial: búsqueda en los proyectos de acuerdo y el anexo técnico, preguntas frecuentes con fuente, selector de entidad, bitácora y botones de tamaño de texto, alto contraste y lectura en voz alta.
