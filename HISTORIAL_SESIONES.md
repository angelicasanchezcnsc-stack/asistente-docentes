# Historial de sesiones de trabajo

Resumen de cada jornada de trabajo para retomar el proyecto desde cualquier computador. El detalle técnico de cada fase está en `BITACORA_IMPLEMENTACION.md`, los cambios por versión en `CHANGELOG.md` y las fases con sus textos aprobados en `PLAN_IMPLEMENTACION.md`.

**Cómo retomar:**
1. `git pull` en la rama `master`.
2. Lea la última sesión de este archivo, en especial «Pendiente» y «Decisiones abiertas».
3. Si trabaja con Claude Code, pídale que lea este archivo y `CLAUDE.md` antes de empezar.

---

## 3 de noviembre de 2026 — Verificador de títulos docentes

**Estado al cierre.**
- Rama `claude/verificador-titulos`, sin fusionar en `master` y **sin publicar**. El asistente (v0.7.2) no cambió.

### Lo que se hizo

- Nuevo **verificador de títulos** (`verificador-titulos.html`, de doble clic, y `npm run verificar-titulos` para lotes). Cruza el título del aspirante con el SNIES, lo compara con el Manual de Funciones y dictamina «Cumple», «No cumple» o «Revisión humana», con la regla y su fuente. También clasifica los títulos para la Valoración de Antecedentes.
- Documentación: `verificador-titulos/LEEME.md`. Detalle y pruebas: `BITACORA_IMPLEMENTACION.md`.
- **Manual de la Resolución MEN 003842 de 2022.** Se transcribieron los requisitos de formación académica de los 23 empleos (`verificador-titulos/fuentes/`). Se usó el OCR de Windows y se cotejó cada hoja con su imagen. `python herramientas/manual_3842.py` genera la tabla que carga el verificador (`verificador-titulos/manual/manual-funciones-3842-2022.csv`, 445 reglas). Todas las reglas están en «revisar» hasta que se validen.
- **Uso del cerebro.**
  - La transcripción coincide en 309 de 312 ítems con el texto de la 3842 del cerebro; las tres diferencias son errores del OCR del cerebro.
  - Se agregó la Resolución MEN 018278 de 2023 (Derecho para ciencias sociales), siempre en «revisar».
  - El verificador puntúa la VA con las tablas del Anexo Técnico docentes 2026 (numerales 5.1.1 a 5.1.5): `verificador-titulos/parametros/parametros-va-docentes-2026.json`.

- **Plan de dos flujos** (`verificador-titulos/PLAN.md`). (A) La consulta ciudadana, «¿Mi título sirve para ser docente?», busca reducir en un 80 % los derechos de petición sobre títulos. (B) La verificación interna sirve para la VRM y la VA. Hay tareas para Santiago (consulta ciudadana), Fabián (datos, motor y flujo interno) y la persona responsable (validación del manual, textos, decisiones D1 a D8 y medición).
- **Cruce con la OPEC.** La consulta ciudadana responderá también en qué OPEC se puede inscribir la persona, con la OPEC 2026 que ya usa el asistente (`opec.json`, corte del 9 de octubre de 2026): 23 empleos, 2.295 OPEC y 31.164 vacantes. El requisito de estudio de la OPEC coincide con el manual transcrito, salvo que agrega Derecho en ciencias sociales y corrige la errata «extrajeras».
- **Datos del SNIES recibidos** (`verificador-titulos/datos/origen/snies-data.ts`): 2.163 denominaciones de pregrado con su título y NBC, sin institución, código, nivel ni estado. Sirven para la consulta ciudadana; para el analista hace falta la consulta completa del SNIES.

### Pendiente

- Seguir `verificador-titulos/PLAN.md`, sección 5.
- Validar el manual transcrito empleo por empleo contra el PDF y anotar cada empleo validado en `verificador-titulos/fuentes/res-3842-2022-validados.txt`.
- Confirmar con la OAJ la ejecutoria de la sentencia del 27 de agosto de 2026 (Derecho para ciencias sociales) y ajustar la regla en `modificaciones-3842.csv`.
- Corregir en el cerebro los tres errores de OCR de la Resolución 3842 (detalle en la bitácora).
- Descargar la consulta de programas del SNIES (activos e inactivos).
- Correr `npm run prueba` en el equipo de la persona responsable: el entorno en la nube no tiene voces en español.

### Decisiones abiertas

- Validar los textos de los motivos del dictamen (ver la bitácora).
- Revisar las «lecturas del verificador» del manual transcrito y decidir tres puntos (detalle en la bitácora):
  - los títulos no listados frente al numeral 3.2 (habilitación por el MEN);
  - los títulos del exterior: el numeral 3.3 exige convalidación y el Criterio Unificado del 4 de junio de 2024 acepta la apostilla en la VRM;
  - el alcance de «y afines».
- Decidir si se fusiona en `master`. Fusionarlo no publica el verificador: Pages solo publica `asistente-docentes.html`.

---

## 14 de octubre de 2026 — v0.7, v0.7.1 y v0.7.2

**Estado al cierre.**
- Publicada la **v0.7.2** en https://angelicasanchezcnsc-stack.github.io/asistente-docentes/. El último flujo «Publicar en GitHub Pages» terminó sin errores.
- Todo está fusionado en `master` y no hay cambios sin publicar.
- La rama de trabajo `claude/zealous-hawking-olfypm` quedó igual a `master`.

### Punto de partida

La persona responsable mostró que al escribir «hola» el asistente respondía «No encontrado». Pidió que el intercambio fuera más fluido y se pareciera a una conversación, aprovechando el material existente y sin IA generativa (regla 2 de `CLAUDE.md`).

### Lo que se hizo

| Versión | Solicitud de cambios | Qué cambió |
| --- | --- | --- |
| v0.7 (fase 13) | [#1](https://github.com/angelicasanchezcnsc-stack/asistente-docentes/pull/1) | **Mensajes sociales:** «hola», «gracias», «chao», «¿quién eres?» y «no entiendo» reciben textos fijos aprobados. El saludo y la ayuda traen los temas como botones. Estos mensajes no van a la bitácora ni llevan opinión. **Seguimiento:** después de una pregunta, «¿y en Antioquia?» o «y para Cali» la responden con esa entidad. **«No encontrado»:** primer párrafo más corto; muestra los temas si no hay preguntas parecidas; «¿Se refiere al …?» reemplaza el desplegable «Texto más cercano». **Frase de enlace** antes del texto oficial de los pasajes («Esto dice el Numeral 7.3 del Proyecto de Anexo Técnico Docentes 2026:»). |
| v0.7.1 (fase 14) | [#2](https://github.com/angelicasanchezcnsc-stack/asistente-docentes/pull/2) | **Temas dentro de la conversación:** al elegir un tema desde una burbuja, la persona «dice» el tema y el asistente responde abajo con sus preguntas. Antes se abría la sección de temas de arriba y la página saltaba. Los botones de la conversación tienen ahora el mismo aspecto que los de la sección de temas. |
| v0.7.2 | [#3](https://github.com/angelicasanchezcnsc-stack/asistente-docentes/pull/3) | **Diez preguntas frecuentes de valoración de antecedentes** (ids `va-…` en `herramientas/faq.json`), validadas por la persona responsable. Nueve van en el tema «Pruebas y puntajes» (que pasó de 4 a 13 preguntas) y la de reclamación, en «Resultados y reclamaciones». Hay cuatro casos funcionales nuevos (17 a 20). |

### Archivos clave nuevos o cambiados

- `src/js/conversacion.js` (nuevo): lista cerrada de frases sociales, `clasificarSocial`, `quitarSaludo` y `resolverSeguimiento`. **Aquí se agregan o quitan frases sociales.**
- `src/js/decision.js`: revisa primero si el mensaje es social y, si no, quita el saludo inicial.
- `src/js/respuestas.js`: respuestas sociales, temas en la respuesta, `responderTema` (fase 14), «¿Se refiere al …?» y frase de enlace.
- `src/js/main.js`: preguntas de seguimiento y tema elegido en el historial (para el cambio de perfil).
- `pruebas/conversacion.mjs` (nuevo): 59 comprobaciones. Corre después de `umbrales.mjs`.
- `herramientas/faq.json` y `herramientas/temas.json`: las 10 preguntas de valoración de antecedentes.
- `PLAN_IMPLEMENTACION.md`: fases 13 y 14, textos de la fase 13 (sección 6), casos C1 a C16 y casos funcionales 17 a 20 (sección 7).

### Decisiones tomadas

- Los textos de las respuestas sociales los aprobó la persona responsable y están en el plan (sección 6, «Fase 13»). No se escriben textos de interfaz nuevos sin aprobación.
- Las respuestas a «¿quién eres?» y «no entiendo» reutilizan párrafos del saludo que ya estaban aprobados.
- Las preguntas de valoración de antecedentes quedaron como se propusieron:
  - en docente de aula se conserva «Licenciatura», tal como dice el anexo;
  - la pregunta de cursos usa como ejemplo la tabla de docente de aula;
  - hay una sola respuesta para los tres cargos directivos.
- No se creó un tema «Valoración de antecedentes»: necesitaría un icono nuevo y cambiaría el diseño de cinco temas que caben en el celular.
- No se cambiaron los umbrales del motor ni los documentos.

### Pruebas al cierre

`npm run prueba` en verde:
- funcional 20/20, umbrales 10, conversación 59, perfiles 108, tablas 63, navegación 94, diseño 187, OPEC 45, consulta pública 2;
- axe 56/56, reflujo 28/28, teclado 8/8, voz 5/5, región viva 5/5.

**Nota de entorno.** Las pruebas de hoy se corrieron en un contenedor en la nube sin voces en español, con una voz simulada fuera del proyecto. En un equipo con Windows y voces instaladas no hace falta nada de eso.

### Pendiente

1. **Regenerar el informe de pruebas en el equipo de la persona responsable.** Corra `npm run prueba` donde está el banco de la consulta pública (carpeta privada). `pruebas/INFORME_PRUEBAS.md` no se regeneró hoy, porque sin el banco se borraría su medición.
2. **Medir el efecto de las preguntas nuevas.** Corra `node herramientas/calibrar_umbrales.mjs` con el banco. La fase 12 identificó la valoración de antecedentes como el tema más consultado; hay que ver cuántas de esas preguntas reales se responden ahora.
3. **Estabilizar dos pruebas intermitentes.** `navegacion.mjs` (cerca de la línea 236) y `perfiles.mjs` (cerca de la línea 188) se cortan a veces por tiempo de espera justo después de cambiar de perfil, y pasan al repetirlas. El problema ya existía antes de la fase 13. Se dejó como tarea sugerida.
4. **Pruebas manuales con lectores de pantalla** (NVDA, JAWS, VoiceOver y TalkBack) de las respuestas sociales, los temas en la conversación y el botón «Ver texto oficial» de «No encontrado». Están en la lista de pruebas manuales del informe.
5. **Revisar la lista de frases sociales** de `src/js/conversacion.js`. Por ejemplo, «ok», «listo» y «perfecto» cuentan como «gracias».

### Decisiones abiertas

- ¿Crear más adelante un tema propio «Valoración de antecedentes» (icono, título y ajuste del diseño en celular)?
- ¿Quién hará las pruebas con lectores de pantalla y en qué fecha?
- «¿y en Boyacá?» no funciona como seguimiento, porque el detector de entidad de la v0.1 no reconoce «Boyacá» sola. Se dejó como estaba.

### Mensaje de entrega

Quedó redactado (con la revisión de voz IA, riesgo bajo) el mensaje de entrega de la v0.7.2, con el asunto «Asistente Docentes v0.7.2 publicado». Resume los cinco cambios, lo que se mantiene (fuentes, estado de borrador, sin datos personales), las pruebas y lo pendiente. Faltan dos decisiones antes de enviarlo:
- si se mencionan las dos pruebas intermitentes;
- quién hará las pruebas con lectores de pantalla y cuándo.
