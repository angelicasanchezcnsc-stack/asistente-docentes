# Informe de pruebas — Asistente Docentes

- **Fecha:** 6 de octubre de 2026
- **Versión:** 0.4.0 (paquete); versión visible en la interfaz: v0.4 · Prototipo
- **Navegador:** Chromium (Playwright), archivo abierto con `file://`, sin servidor y sin internet
- **Reglas de axe:** `wcag2a`, `wcag2aa`, `wcag21aa`, `best-practice`

## 1. Casos funcionales

Fase del plan: 8. Cada caso se ejecuta con la entidad vacía y una página nueva.

| # | Pregunta | Resultado | Tipo | Fuente principal | Entidad |
| --- | --- | --- | --- | --- | --- |
| 1 | ¿cuál es el puntaje mínimo para aprobar? | OK | faq | Artículo 13, Parágrafo segundo | — |
| 2 | cuantos dias tengo para reclamar los resultados de la prueba escrita | OK | faq | Numeral 2.7 | — |
| 3 | ¿cuántas vacantes hay? | OK | depende-entidad | — | — |
| 4 | cuantas vacantes ofrece Antioquia | OK | faq | Artículo 8 | Secretaría de Educación Departamental de Antioquia |
| 5 | me puedo inscribir a dos empleos | OK | faq | Artículo 8, Parágrafo quinto | — |
| 6 | ¿cuál es el horario de atención de la CNSC en Bogotá? | OK | no-encontrado | — | Secretaría de Educación Distrital de Bogotá |
| 7 | qué pasa en la audiencia de escogencia de vacante | OK | pasaje | Numeral 7.3 | — |
| 8 | en qué ciudades se presentan las pruebas | OK | pasaje | Numeral 2.4 | — |
| 9 | cuántas vacantes de docente de preescolar hay en Amazonas | OK | pasaje | Artículo 8 | Secretaría de Educación Departamental de Amazonas |
| 10 | las personas con discapacidad pagan | OK | faq | Artículo 6, Parágrafo primero | — |
| 11 | quién gana el mundial de fútbol | OK | no-encontrado | — | — |
| 12 | cuánto cuesta la inscripción | OK | tema-reservado | — | — |
| 13 | cuál es el valor de los derechos de participación | OK | tema-reservado | — | — |
| 14 | ¿Cómo pago los derechos de participación? | OK | faq | Numeral 1.2.5 | — |
| 15 | ¿qué es la OPEC? | OK | faq | Artículo 8, Parágrafo quinto | — |
| 16 | ¿Qué pruebas se aplican y cuánto vale cada una? | OK | faq | Artículo 13 | — |

## 2. axe por combinación

Cada fila es una variante de contraste con un tamaño de texto y un estado de la pantalla. Se espera cero violaciones.

| Contraste y texto | Estado | Violaciones | Resultado |
| --- | --- | --- | --- |
| normal, 100 % | respuestas en pantalla (frecuente, pasaje con tabla, «No encontrado») (4 tablas visibles) | 0 | OK |
| normal, 100 % | panel de accesibilidad abierto | 0 | OK |
| normal, 100 % | bienvenida abierta | 0 | OK |
| normal, 100 % | configuración desplegada (con una respuesta y su opinión) | 0 | OK |
| normal, 100 % | temas (tema abierto) y buscador de entidad (lista abierta) | 0 | OK |
| normal, 200 % | respuestas en pantalla (frecuente, pasaje con tabla, «No encontrado») (4 tablas visibles) | 0 | OK |
| normal, 200 % | panel de accesibilidad abierto | 0 | OK |
| normal, 200 % | bienvenida abierta | 0 | OK |
| normal, 200 % | configuración desplegada (con una respuesta y su opinión) | 0 | OK |
| normal, 200 % | temas (tema abierto) y buscador de entidad (lista abierta) | 0 | OK |
| oscuro, 100 % | respuestas en pantalla (frecuente, pasaje con tabla, «No encontrado») (4 tablas visibles) | 0 | OK |
| oscuro, 100 % | panel de accesibilidad abierto | 0 | OK |
| oscuro, 100 % | bienvenida abierta | 0 | OK |
| oscuro, 100 % | configuración desplegada (con una respuesta y su opinión) | 0 | OK |
| oscuro, 100 % | temas (tema abierto) y buscador de entidad (lista abierta) | 0 | OK |
| oscuro, 200 % | respuestas en pantalla (frecuente, pasaje con tabla, «No encontrado») (4 tablas visibles) | 0 | OK |
| oscuro, 200 % | panel de accesibilidad abierto | 0 | OK |
| oscuro, 200 % | bienvenida abierta | 0 | OK |
| oscuro, 200 % | configuración desplegada (con una respuesta y su opinión) | 0 | OK |
| oscuro, 200 % | temas (tema abierto) y buscador de entidad (lista abierta) | 0 | OK |
| alto, 100 % | respuestas en pantalla (frecuente, pasaje con tabla, «No encontrado») (4 tablas visibles) | 0 | OK |
| alto, 100 % | panel de accesibilidad abierto | 0 | OK |
| alto, 100 % | bienvenida abierta | 0 | OK |
| alto, 100 % | configuración desplegada (con una respuesta y su opinión) | 0 | OK |
| alto, 100 % | temas (tema abierto) y buscador de entidad (lista abierta) | 0 | OK |
| alto, 200 % | respuestas en pantalla (frecuente, pasaje con tabla, «No encontrado») (4 tablas visibles) | 0 | OK |
| alto, 200 % | panel de accesibilidad abierto | 0 | OK |
| alto, 200 % | bienvenida abierta | 0 | OK |
| alto, 200 % | configuración desplegada (con una respuesta y su opinión) | 0 | OK |
| alto, 200 % | temas (tema abierto) y buscador de entidad (lista abierta) | 0 | OK |
| alto-oscuro, 100 % | respuestas en pantalla (frecuente, pasaje con tabla, «No encontrado») (4 tablas visibles) | 0 | OK |
| alto-oscuro, 100 % | panel de accesibilidad abierto | 0 | OK |
| alto-oscuro, 100 % | bienvenida abierta | 0 | OK |
| alto-oscuro, 100 % | configuración desplegada (con una respuesta y su opinión) | 0 | OK |
| alto-oscuro, 100 % | temas (tema abierto) y buscador de entidad (lista abierta) | 0 | OK |
| alto-oscuro, 200 % | respuestas en pantalla (frecuente, pasaje con tabla, «No encontrado») (4 tablas visibles) | 0 | OK |
| alto-oscuro, 200 % | panel de accesibilidad abierto | 0 | OK |
| alto-oscuro, 200 % | bienvenida abierta | 0 | OK |
| alto-oscuro, 200 % | configuración desplegada (con una respuesta y su opinión) | 0 | OK |
| alto-oscuro, 200 % | temas (tema abierto) y buscador de entidad (lista abierta) | 0 | OK |

## 3. Reflujo (320 px de ancho y texto al 200 %)

Criterio: `document.documentElement.scrollWidth <= innerWidth + 1`, salvo dentro de las tablas, que se desplazan en su propio contenedor.

| Contraste | Estado | Medida | Resultado |
| --- | --- | --- | --- |
| normal, 320 px, 200 % | respuestas en pantalla | scrollWidth 320 px, ventana 320 px | OK |
| normal, 320 px, 200 % | panel de accesibilidad abierto | borde derecho 302 px de 320; desborde interno 0 px | OK |
| normal, 320 px, 200 % | bienvenida abierta | scrollWidth 320 px, ventana 320 px; diálogo 286/286 px; contenido 286/286 px | OK |
| oscuro, 320 px, 200 % | respuestas en pantalla | scrollWidth 320 px, ventana 320 px | OK |
| oscuro, 320 px, 200 % | panel de accesibilidad abierto | borde derecho 302 px de 320; desborde interno 0 px | OK |
| oscuro, 320 px, 200 % | bienvenida abierta | scrollWidth 320 px, ventana 320 px; diálogo 286/286 px; contenido 286/286 px | OK |
| alto, 320 px, 200 % | respuestas en pantalla | scrollWidth 320 px, ventana 320 px | OK |
| alto, 320 px, 200 % | panel de accesibilidad abierto | borde derecho 302 px de 320; desborde interno 0 px | OK |
| alto, 320 px, 200 % | bienvenida abierta | scrollWidth 320 px, ventana 320 px; diálogo 286/286 px; contenido 286/286 px | OK |
| alto-oscuro, 320 px, 200 % | respuestas en pantalla | scrollWidth 320 px, ventana 320 px | OK |
| alto-oscuro, 320 px, 200 % | panel de accesibilidad abierto | borde derecho 302 px de 320; desborde interno 0 px | OK |
| alto-oscuro, 320 px, 200 % | bienvenida abierta | scrollWidth 320 px, ventana 320 px; diálogo 286/286 px; contenido 286/286 px | OK |
| normal, 320 px, 200 % | configuración desplegada | scrollWidth 320 px, ventana 320 px | OK |
| normal, 320 px, 200 % | temas (tema abierto) y buscador de entidad (lista abierta) | temas: scrollWidth 320 px, ventana 320 px; buscador: scrollWidth 320 px, ventana 320 px | OK |
| oscuro, 320 px, 200 % | configuración desplegada | scrollWidth 320 px, ventana 320 px | OK |
| oscuro, 320 px, 200 % | temas (tema abierto) y buscador de entidad (lista abierta) | temas: scrollWidth 320 px, ventana 320 px; buscador: scrollWidth 320 px, ventana 320 px | OK |
| alto, 320 px, 200 % | configuración desplegada | scrollWidth 320 px, ventana 320 px | OK |
| alto, 320 px, 200 % | temas (tema abierto) y buscador de entidad (lista abierta) | temas: scrollWidth 320 px, ventana 320 px; buscador: scrollWidth 320 px, ventana 320 px | OK |
| alto-oscuro, 320 px, 200 % | configuración desplegada | scrollWidth 320 px, ventana 320 px | OK |
| alto-oscuro, 320 px, 200 % | temas (tema abierto) y buscador de entidad (lista abierta) | temas: scrollWidth 320 px, ventana 320 px; buscador: scrollWidth 320 px, ventana 320 px | OK |

## 4. Teclado

| Prueba | Medida | Resultado |
| --- | --- | --- |
| Desde la carga, la primera parada de Tab es «Saltar a escribir la pregunta» | Saltar a escribir la pregunta | OK |
| Enter sobre ese enlace lleva el foco a la caja de pregunta | pregunta | OK |
| Alt + 1 lleva a la caja de pregunta | pregunta | OK |
| Enter en la caja de pregunta envía la pregunta y aparece la respuesta | una respuesta en pantalla y la caja vacía | OK |
| Alt + A abre el panel de accesibilidad | panel visible | OK |
| Escape cierra el panel y devuelve el foco a donde estaba | panel oculto, foco en #pregunta | OK |
| Tab alcanza los botones de la cabecera, el botón de los temas, el selector de entidad plegado y la caja de pregunta | 13 controles distintos | OK |
| Sin errores de consola durante la prueba de teclado | ninguno | OK |

## 5. Voz sin voz local

| Prueba | Medida | Resultado |
| --- | --- | --- |
| Con solo una voz en línea, «Escuchar» está visible pero deshabilitado | visible true, deshabilitado true | OK |
| Debajo aparece el aviso «Sin voz local» de la sección 6 | Este equipo no tiene instalada una voz en español. En Windows puede ag… | OK |
| El panel también deshabilita la lectura y su interruptor | interruptor y «Reproducir» deshabilitados | OK |
| No se usa la voz en línea: la síntesis no empieza | sin lectura | OK |
| Con una voz local que no es en español, «Escuchar» también queda deshabilitado | deshabilitado true | OK |

## 6. Región viva

| Prueba | Medida | Resultado |
| --- | --- | --- |
| La conversación tiene role="log" | role="log" | OK |
| Es una región viva cortés que anuncia solo lo que se agrega | aria-live="polite", aria-relevant="additions" | OK |
| Tiene nombre accesible | Conversación con el asistente | OK |
| Cada respuesta nueva queda dentro de la región (el saludo va arriba de los temas, fuera de ella) | 3 de 4 mensajes del asistente y 3 de 3 preguntas dentro del #log | OK |
| El estado «Respuesta lista.» está en una región role="status" aparte | role="status" | OK |

## 7. Bienvenida y perfiles (`pruebas/perfiles.mjs`)

108 de 108 comprobaciones en verde.


## 8. Tablas, glosario, temas reservados e impresión (`pruebas/tablas_glosario.mjs`)

63 de 63 comprobaciones en verde.


## 9. Navegación guiada y estructura de respuesta (`pruebas/navegacion.mjs`)

94 de 94 comprobaciones en verde.


## 10. Diseño y presentación (`pruebas/diseno.mjs`)

112 de 112 comprobaciones en verde.


## 11. Pruebas manuales pendientes

Las deben hacer personas; ninguna se puede dar por hecha con pruebas automáticas.

- [ ] NVDA con Firefox y JAWS con Chrome en Windows: bienvenida, pregunta, respuesta con tabla, glosario y panel.
- [ ] VoiceOver en iPhone (Safari) y TalkBack en Android (Chrome).
- [ ] Lectura en voz alta con una voz local instalada (en Windows, Microsoft Sabina o Raúl).
- [ ] Zoom del navegador al 400 % en computador.
- [ ] Validación de los textos de los perfiles y de las preguntas frecuentes con personas con discapacidad.
- [ ] Buscador de entidad con NVDA, JAWS, VoiceOver y TalkBack: que anuncien el número de resultados y la opción activa.
- [ ] Celular real (iPhone con Safari y Android con Chrome): que el botón de accesibilidad en la cabecera no tape nada, que la caja de pregunta fija se comporte bien con el teclado en pantalla y en horizontal, y que las tarjetas con iconos se vean completas.
- [ ] Modo de contraste forzado de Windows: que los iconos y los recuadros se vean.
- [ ] Pruebas de uso con 4 o 5 personas por grupo (baja visión o ceguera, sordera, discapacidad física, discapacidad intelectual y adultos mayores): «encuentre cuántos días tiene para reclamar los resultados» y «encuentre las vacantes de su entidad».

## Resumen

- axe: 40 de 40 combinaciones sin violaciones.
- Reflujo: 20 de 20.
- Teclado: 8 de 8.
- Voz: 5 de 5.
- Región viva: 5 de 5.
- Casos funcionales con diferencias: 0.
