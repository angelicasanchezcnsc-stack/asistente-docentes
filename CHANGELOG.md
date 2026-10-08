# Cambios

## Fase 10 — 8 de octubre de 2026 (sin cambio de versión)

### Nuevo

- **Preguntas de la consulta pública, sin datos personales.**
  - `herramientas/consulta_publica.py` extrae, filtra y organiza las preguntas de la matriz de observaciones.
  - Todo lo que tiene texto de la ciudadanía queda fuera del proyecto, en `PRIVADO_CONSULTA_PUBLICA`.
  - `pruebas/consulta_publica.mjs` revisa la privacidad y mide el asistente con 374 preguntas reales aprobadas por la persona responsable.
  - El informe de pruebas muestra solo cifras.
- Los sinónimos aprobados (`herramientas/sinonimos_ciudadania.json`) se incluyen al construir y se suman a los del motor.

### Resultado

- De las 374 preguntas, el asistente respondió el 15,5 % con fragmentos del texto oficial y el 0 % con preguntas frecuentes. Pidió la entidad en el 0,5 %, bloqueó por tema reservado el 0,3 % y dijo «No encontrado» en el 83,7 %.
- El vocabulario dejó solo tres palabras («clara», «claramente», «claro»), que no sirven como sinónimos, así que no se incorporó ninguno y el asistente responde igual que en la v0.6.

### Pendiente

- Preguntas frecuentes nuevas para los temas más consultados sin pregunta frecuente (informe en la carpeta privada).

## v0.6 — 8 de octubre de 2026

### Cambiado (diseño minimalista, fase 11; aprobado por la persona responsable)

- **Burbujas.**
  - La persona va a la derecha, en gris oscuro con texto blanco y la esquina inferior derecha recortada.
  - El asistente va a la izquierda, en gris claro, sin borde y con la esquina inferior izquierda recortada; en alto contraste lleva borde de 2 px.
  - Contraste del texto, del texto secundario y de los enlaces sobre la burbuja: 4,5:1 o más en las cuatro variantes.
- **Temas.** Burbujas pequeñas de una línea, con icono de 18 px y sin el número de preguntas. El título pasa a «Temas». «Su entidad (opcional)» también va como burbuja.
- **Respuestas.**
  - A la vista quedan la respuesta corta y la fuente.
  - «Ver texto oficial (…)» guarda el texto oficial con la nota de validez, y «Vacantes en la OPEC (n)» guarda el bloque de la OPEC.
  - En los pasajes con frases clave, el texto completo va plegado.
  - «Copiar» incluye lo plegado.
  - «En pocas palabras» ya no tiene recuadro; su encabezado queda para lectores de pantalla.
  - Las acciones y la opinión van en una sola fila.
- **Cabecera** de una fila con «Accesibilidad» y «Más» (que contiene «Perfil» y «Bitácora»). La versión pasa al pie.
- **Saludo** de dos líneas («Elija un tema o escriba su pregunta.»), con el resto tras «Cómo respondo». Ya no lleva «Copiar» ni «Imprimir».
- **Caja de pregunta.** Se llama «Su pregunta», tiene forma de burbuja y crece con el texto hasta 180 px.
- **Fondo plano**, sin los degradados decorativos.
- La aclaración de las preguntas frecuentes dice «… redactada a partir del texto oficial.»
- Pruebas: 41 comprobaciones nuevas en `diseno.mjs` y el estado «menú «Más» abierto» en accesibilidad (56 combinaciones de axe y 28 de reflujo).

### Pendiente

- Revisión del diseño con lectores de pantalla, en celular real y en contraste forzado de Windows.

## v0.5.1 — 8 de octubre de 2026

### Cambiado

- Se quitó la promesa de que un «equipo temático» revisa cada pregunta. En la versión publicada, la bitácora se queda en el navegador de cada persona. Textos aprobados por la persona responsable:
  - «No encontrado» dice: «Puede intentar con otras palabras, elegir uno de los temas o consultar los canales de atención de la CNSC.» (también en la lectura en voz alta);
  - al elegir «No» en «¿Le sirvió esta respuesta?», el aviso es «Gracias por su opinión.», como con «Sí»; la bitácora sigue registrando el motivo;
  - la ayuda del panel de la bitácora dice que las preguntas se guardan solo en ese navegador y no se envían a nadie, y ya no menciona el botón «No me sirvió», que desde la v0.4 se llama «No».
- La nota de `faq.json` dice que las preguntas frecuentes son un borrador para validación de la persona responsable.

## v0.5 — 8 de octubre de 2026

### Nuevo

- **Vacantes en la OPEC.** Las respuestas que muestran el artículo 8 del acuerdo de una entidad traen debajo las vacantes de esa entidad según la OPEC con la que cerró la oferta (corte del 7 de octubre de 2026). Incluyen:
  - una tabla por empleo con las vacantes sin reserva, con reserva para personas con discapacidad y el total;
  - un desplegable con el número de OPEC y las vacantes de cada empleo, los tipos de discapacidad de las vacantes con reserva, los requisitos de estudio y experiencia, las alternativas y las funciones.

  El texto es literal de la OPEC y las cifras se suman desde los datos. La respuesta avisa que las cifras pueden ser distintas de las del proyecto de acuerdo, que es anterior: los proyectos suman 28.001 vacantes y la OPEC 31.164.
- `herramientas/opec.py` lee solo la hoja «Base de datos» del reporte de la OPEC, valida el contenido y genera `herramientas/opec.json`: 31.164 vacantes (2.249 con reserva para personas con discapacidad), 90 entidades y 2.291 números de OPEC. `construir.mjs` vuelve a validar las cifras.
- Prueba `pruebas/opec.mjs` y el estado «respuesta con OPEC» en las pruebas de accesibilidad: 48 combinaciones de axe y 24 de reflujo.

### Cambiado

- El segundo párrafo del saludo dice que el asistente también responde con la OPEC, con la fecha de su corte.
- Al imprimir una respuesta, los empleos de la OPEC que están cerrados se imprimen cerrados, para que la impresión no crezca con las funciones de todos los empleos.
- `CLAUDE.md`: la OPEC es fuente del asistente, autorizada por la persona responsable el 8 de octubre de 2026.

### Pendiente

- Cotejo de la OPEC del asistente con SIMO por el área responsable, y prueba de la tabla y de los desplegables con lectores de pantalla.
- Buscar un empleo o un número de OPEC desde la caja de pregunta.
- Usar la matriz de observaciones de la consulta pública como banco de preguntas para pruebas y sinónimos (pendiente de autorización).

## v0.4.2 — 7 de octubre de 2026

### Nuevo

- **Logo de la CNSC** en la cabecera (el mismo de IncluIA), incrustado en el archivo y con el texto alternativo «Comisión Nacional del Servicio Civil». Arriba a la derecha en escritorio; en celular, en la primera fila, junto al botón de la ONU. Va sobre una placa blanca para que se lea en los contrastes oscuros.

## v0.4.1 — 6 de octubre de 2026

### Nuevo

- **Aviso de voz latinoamericana.** El motor de voz ya ofrecía primero la voz colombiana, luego las demás latinoamericanas y por último las de España. Ahora, si el equipo solo tiene voces de España (como Helena, Laura y Pablo en Windows), junto al botón «Escuchar» aparece cómo agregar una voz latinoamericana. Pruebas con voces simuladas (solo España, México, Colombia y «es» sin país).

### Pendiente

- Una voz colombiana o latinoamericana depende de las voces instaladas en el equipo de cada persona; el asistente no puede instalarlas ni usar voces en línea. En Windows, las voces latinoamericanas locales son las de «Español (México)».

## v0.4 — 6 de octubre de 2026

### Nuevo

- **Una sola columna centrada** (800 px como máximo) en todas las pantallas, con la conversación sin desplazamiento interno y la **caja de pregunta fija abajo**. La caja pasa al final de la columna cuando la ventana mide menos de 500 px de alto o cuando ocupa más de un tercio de la ventana (por ejemplo, con el texto al 200 %).
- **Celular:** el botón de accesibilidad con el símbolo de la ONU va en la cabecera (ya no flota sobre el contenido), con margen lateral de 16 px. El selector de entidad queda plegado («Su entidad (opcional)») debajo de los temas.
- **Iconos de línea** (estilo Lucide) junto al texto de cada tarjeta de tema y texto visible «Dictar» junto al micrófono.
- **Recuadro propio para «En pocas palabras»** en las preguntas frecuentes.
- **Opinión como grupo propio:** «¿Le sirvió esta respuesta?» con «Sí» y «No», separada de Copiar e Imprimir.
- **Saludo nuevo, en cuatro párrafos, lo primero que se ve** (arriba de los temas, fuera de la conversación), con el número de entidades leído de los datos.
- Prueba `pruebas/diseno.mjs` y dos estados nuevos en las pruebas de accesibilidad («aviso y configuración desplegados»).

### Cambiado

- **Se quitó el aviso inicial** («Prototipo con documentos en borrador…» y su texto largo con la versión de los documentos): ya se sabe que es un prototipo. La advertencia «No escriba datos personales.» pasó a ser el texto de ayuda de la caja de pregunta. La etiqueta «Borrador» sigue en la fuente de cada respuesta y la nota de validez cierra cada texto oficial.
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
