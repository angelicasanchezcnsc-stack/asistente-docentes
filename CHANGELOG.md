# Cambios

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
- **Identidad visual del kit EARM** (la de Lexible e IncluIA) con la tipografía Atkinson Hyperlegible Next incrustada.
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
