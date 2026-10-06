# Asistente Docentes v0.1 (prototipo)

Asistente del proceso de selección Docentes y Directivos Docentes. Responde solo con los proyectos de acuerdo (90 entidades) y el proyecto de Anexo Técnico Docentes 2026, en versión borrador, y muestra en cada respuesta el texto oficial y su fuente.

## Cómo abrirlo

Abra `asistente-docentes.html` con doble clic en Chrome o Edge. Funciona sin servidor y sin internet (solo la tipografía se descarga de internet si hay conexión). Para publicarlo basta subir ese único archivo a cualquier servidor web.

## Qué hace

- Busca en la colección del proceso elegido y responde con el fragmento oficial y su fuente: documento, artículo o numeral y versión.
- Si la persona elige su entidad, usa el texto exacto del acuerdo de esa entidad. Sin entidad, usa el texto común a los acuerdos y avisa cuando la información depende de la entidad (por ejemplo, vacantes).
- Preguntas frecuentes en lenguaje claro (`herramientas/faq.json`), cada una atada a su fuente y marcada como borrador para validación.
- Si no encuentra la respuesta, no la inventa: la registra en la bitácora.
- Accesibilidad: lector de pantalla (región de conversación anunciada, etiquetas, teclado), dictado por micrófono (Chrome y Edge), diseño para celular y el panel de herramientas del Instrumento EBAR (el mismo de IncluIA): botón «Accesibilidad» o Alt + A. Ofrece tamaño de texto, cuatro variantes de contraste, espaciado, tipografías legible y para dislexia, lectura facilitada, foco reforzado y más. La lectura en voz alta usa solo voces instaladas en el equipo (nunca voces en línea) y se activa con «Botón «Escuchar» en cada respuesta».
- Bienvenida: en la primera visita un diálogo permite elegir un perfil (Visual, Auditivo, Físico, Intelectual, Psicosocial, Sordoceguera, Múltiple, Adulto mayor o Sin preferencia) que ajusta el panel de accesibilidad, indicar si se usa un lector de pantalla y activar la lectura en voz alta automática. El botón «Perfil» lo vuelve a abrir. Atajos: Alt + A abre el panel y Alt + 1 va a la caja de pregunta.
- Tablas, glosario y temas reservados: las tablas del texto oficial llevan su título y se leen fila por fila; la primera aparición de cada término del glosario es un botón que abre su definición literal con su fuente; las preguntas sobre el valor de los derechos de participación (tema en estudio de la Sala Plena) reciben un aviso en lugar de una respuesta; cada respuesta se puede imprimir sola con el botón «Imprimir».

## Estructura del código

El código fuente está en `src/` (`index.html`, `css/` y `js/` con módulos ES) y se empaqueta en el archivo único `asistente-docentes.html`. Los datos salen de `herramientas/kb.json` y `herramientas/faq.json`.

## Cómo actualizar la base de conocimiento

Requiere Python 3 con `beautifulsoup4` (`pip install beautifulsoup4`) y Node 22 o superior. La primera vez, en la carpeta del prototipo: `npm install` y `npx playwright install chromium`.

1. Reemplace los HTML accesibles de la carpeta `CHATBOT` (acuerdos y anexo) por las versiones nuevas.
2. `python herramientas/extract.py` (lee los HTML y genera `herramientas/raw.json`).
3. `python herramientas/buildkb.py` (genera `herramientas/kb.json`).
4. `npm run construir` (genera `asistente-docentes.html` en la carpeta del prototipo).
5. `npm run prueba` (pruebas funcionales, de perfiles, de tablas y glosario, y de accesibilidad con Playwright y axe-core; genera `pruebas/INFORME_PRUEBAS.md`).

Para agregar una entrada al glosario, copie una de `herramientas/glosario.json` y escriba su regla de extracción literal: `oracion_con` (la oración que contiene el marcador) o `desde` y `hasta` (marcadores de inicio, incluido, y de fin, excluido, dentro del rótulo del anexo). `python herramientas/buildkb.py` la extrae y falla, diciendo cuál marcador no encontró, si la regla no coincide con el texto. No se agregan términos sin fuente.

Para reservar otro tema de Sala Plena, agregue una entrada a `herramientas/temas_reservados.json` con `grupo_a`, `grupo_b` (términos sin tildes, en minúscula; la pregunta se reserva si trae uno de cada grupo como palabra o frase completa), `excluir_pasajes_con` (expresión regular de los pasajes que dejan de buscarse) y el `mensaje`. Hoy el texto del aviso está en `src/js/reservados.js`. Después ejecute `npm run construir` y `npm run prueba`.

Para agregar una pregunta frecuente, copie una entrada de `herramientas/faq.json`, ajuste `pregunta`, `claves` (palabras con que la gente pregunta), `respuesta` y `fuentes` (rótulo exacto, por ejemplo `Artículo 13` o `Numeral 2.7`), y repita los pasos 4 y 5.

## Limitaciones de esta versión

- Las fuentes son borradores; la etiqueta «Borrador» aparece en cada respuesta.
- La bitácora se guarda en el navegador de quien usa el asistente; se descarga en CSV desde el botón Bitácora. En la versión publicada debe guardarse en un servidor.
- Fuera de las preguntas frecuentes, la respuesta es el texto oficial con las frases más relevantes resaltadas, no un resumen redactado. Un resumen automático requiere autorizar un modelo de lenguaje.
- En el selector de proceso, Planeación de municipios de 5.ª y 6.ª categoría (a cargo de Fabian Blanco) aparece como «próximamente»: usará el mismo motor con su propia base de documentos.
