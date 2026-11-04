# Plan del verificador de títulos: consulta ciudadana y verificación interna

Versión 3 del plan, del 3 de noviembre de 2026. Incorpora la revisión completa de los 90 acuerdos
definitivos, del Anexo Técnico definitivo y del cerebro del Despacho, y los datos públicos
descargados ese día (SNIES completo y listados de Escuelas Normales).

Lo ejecutan en paralelo Santiago, Fabián y la persona responsable del Despacho, desde la rama
`claude/verificador-titulos`. Está escrito para que una persona o un modelo (por ejemplo, Claude
Sonnet) pueda ejecutar cada tarea sin tener que investigar de nuevo: cada tarea dice qué archivos
leer, qué hacer paso a paso, qué cifras deben salir y cuándo está terminada.

## 0. Cómo usar este plan

### Antes de empezar cualquier tarea

1. Lea `CLAUDE.md` (reglas del proyecto). Las ocho reglas no se negocian.
2. Lea la última entrada de `HISTORIAL_SESIONES.md`.
3. Lea `verificador-titulos/LEEME.md` (cómo funciona el verificador).
4. Lea completas las secciones 2, 3 y 4 de este plan (datos, reglas y decisiones). Las tareas
   remiten a ellas por su identificador (por ejemplo, «R4» o «D10»).
5. Confirme que está en su rama de trabajo (sección 7) y no en `master`.

### Mientras ejecuta una tarea

- Haga **una tarea a la vez**, en el orden de la sección 7.
- Si la tarea depende de una decisión abierta (sección 4), aplique el **comportamiento
  provisional** que dice esa decisión. No elija otra opción por su cuenta.
- **No redacte textos jurídicos** ni textos que vaya a ver la ciudadanía. Los textos de la
  consulta salen de `verificador-titulos/textos-consulta.md`, aprobados en V4. Si un texto no
  existe todavía, deje un marcador visible `[TEXTO PENDIENTE: <código>]` y siga.
- No cambie archivos de `vendor/`.
- No escriba datos personales en ningún archivo, prueba, bitácora ni mensaje de commit.
- Si algo del plan no se puede cumplir como está escrito, o una cifra de control no cuadra,
  **deténgase**: anótelo en `BITACORA_IMPLEMENTACION.md` y pregunte a la persona responsable.
  No improvise una alternativa.

### Al terminar cada tarea

1. Corra las pruebas que indica la tarea. Si toca el asistente, corra también `npm run prueba`.
2. Agregue una entrada en `BITACORA_IMPLEMENTACION.md` con este formato:

   ```
   ## <Id de la tarea>. <nombre corto> (<fecha AAAA-MM-DD>)
   - Qué cambió: <archivos y en qué>
   - Pruebas: <comando> → <resultado, con cifras>
   - Dudas o pendientes: <o «Ninguna»>
   ```

3. Haga un commit en español, con el Id al inicio. Ejemplo: `S1: catálogo de denominaciones del SNIES`.
4. **No haga `git push` a `master`.** El push a la rama de trabajo lo decide la persona
   responsable.

## 1. Para qué

En el proceso de selección de docentes y directivos docentes, la duda más frecuente es si un
título sirve para un empleo. La respuesta depende del Manual de Funciones del MEN (Resolución
003842 de 2022 y sus modificaciones), que dice qué títulos admite cada empleo, y del SNIES, que
dice qué programa es y cómo está clasificado. En docentes hay un solo manual nacional.

Se construyen dos flujos sobre el mismo motor (`verificador-titulos/nucleo/`):

| | A. Consulta ciudadana | B. Verificación interna |
|---|---|---|
| Meta | Reducir en un 80 % los derechos de petición sobre títulos docentes | VRM y VA más rápidas y parejas entre analistas, con menos reclamaciones por criterios dispares |
| Quién la usa | Aspirantes y ciudadanía | Analistas de la CNSC y del operador |
| Pregunta | «¿Para qué empleos sirve mi título?», «¿En qué OPEC me puedo inscribir?» y «¿Me sirve para este empleo?» | «¿Este aspirante cumple el requisito de formación?» y «¿Cuánto suma en la VA?» |
| Entrada | Elige su programa de una lista | Tabla de títulos por inscripción, SNIES completo, manual y fecha de corte |
| Respuesta | Orientación en lenguaje claro, con la fuente literal del manual. No es la VRM | «Cumple», «No cumple» o «Revisión humana», puntaje de VA proyectado e informe CSV |
| Dónde corre | **Dentro del asistente** (`asistente-docentes.html`), como función principal (D1) | `verificador-titulos.html` en el equipo del analista, sin internet; se llega desde un botón para funcionarios (D9) |
| Datos personales | Ninguno | Solo número de inscripción y OPEC |

**Lo que pregunta la ciudadanía hoy.** Conteo aproximado por palabras clave en las respuestas del
Despacho que guarda el cerebro. Una respuesta puede tocar varios temas.

| Tema | Respuestas |
|---|---|
| Manual de funciones o Resolución 3842 | 151 |
| «¿Mi título sirve o habilita para el empleo?» | 65 |
| Profesional no licenciado | 58 |
| Puntaje de los títulos en la valoración de antecedentes | 53 |
| «¿Qué títulos piden para el empleo?» | 52 |
| Título del exterior o convalidación | 51 |
| Normalista superior | 41 |
| SNIES o registro del programa | 23 |
| Tecnólogo en educación | 16 |

## 2. Datos y fuentes

Rutas relativas a la raíz del repositorio, salvo las del cerebro. El cerebro está fuera del
repositorio, en la carpeta `CEREBRO-EQUIPO-2026-10-27-SKILLS` (corte del 27 de octubre de 2026);
la persona responsable indica dónde está en cada equipo.

### 2.1 En el repositorio

| Id | Dato | Ruta | Estado |
|---|---|---|---|
| F1 | Transcripción literal de los requisitos de formación de la Resolución 3842 | `verificador-titulos/fuentes/res-3842-2022-requisitos.txt` | Sin validar (V1) |
| F2 | Reglas de los ítems que necesitan interpretación (26 notas «Lectura del verificador») | `verificador-titulos/fuentes/res-3842-2022-desglose.csv` | Sin validar (V2) |
| F3 | Modificaciones del manual (hoy: Resolución MEN 018278 de 2023) | `verificador-titulos/fuentes/modificaciones-3842.csv` | Falta Derecho en ciencias económicas (S5) |
| F4 | Empleos validados | `verificador-titulos/fuentes/res-3842-2022-validados.txt` | Vacío |
| F5 | Manual generado (23 empleos, 446 reglas, todas en «revisar») | `verificador-titulos/manual/manual-funciones-3842-2022.csv` | Lo genera `python herramientas/manual_3842.py` |
| F6 | Parámetros de VA 2026 (factores 1 a 3) | `verificador-titulos/parametros/parametros-va-docentes-2026.json` | Coinciden con el Anexo definitivo |
| F7 | OPEC del asistente (corte SIMO del 9 de octubre de 2026): 2.295 OPEC, 31.164 vacantes, 90 entidades | `herramientas/opec.json` | Hay que actualizarla (R13 y G2) |
| F8 | **SNIES completo** (32.124 programas) | `verificador-titulos/datos/origen/snies-programas-2026-11-03/Programas.xlsx` y su `FUENTE.md` | Descargado el 3/11/2026. SHA-256 `df570a40…b0c402` |
| F9 | SNIES parcial anterior (2.163 entradas, sin institución ni estado) | `verificador-titulos/datos/origen/snies-data.ts` | **Reemplazado por F8.** Se conserva como histórico; no usarlo |
| F10 | Escuelas Normales Superiores (137), sin datos personales | `verificador-titulos/datos/origen/men-escuelas-normales/escuelas-normales-superiores-2014.csv` y su `FUENTE.md` | Datos de 2014: autorización de funcionamiento, no acreditación |
| F11 | Base del asistente | `herramientas/kb.json` | **Hecha con el proyecto de Anexo**, no con el definitivo (G1) |

**Cifras de control de F8** (sirven para comprobar que se lee bien el archivo):

| Medida | Valor |
|---|---|
| Filas con datos | 32.124 (más una fila vacía) |
| Programas activos / inactivos | 18.217 / 13.906 |
| Nivel «Universitario» | 9.158 |
| Programas cuyo nombre empieza por «licenciatura» (sin tildes ni mayúsculas) | 1.953 (611 activos, 1.342 inactivos) |
| De esas licenciaturas, con NBC «Educación» | 1.848 |
| Licenciaturas con otro NBC o sin clasificar | 105 (35 de ellas «Sin clasificar») |

Columnas de F8 que importan: `CÓDIGO_INSTITUCIÓN`, `NOMBRE_INSTITUCIÓN`, `CÓDIGO_SNIES_DEL_PROGRAMA`,
`NOMBRE_DEL_PROGRAMA`, `TITULO_OTORGADO`, `ESTADO_PROGRAMA`, `RECONOCIMIENTO_DEL_MINISTERIO`,
`RESOLUCIÓN_DE_APROBACIÓN`, `FECHA_DE_RESOLUCIÓN`, `VIGENCIA_AÑOS`, `ÁREA_DE_CONOCIMIENTO`,
`NÚCLEO_BÁSICO_DEL_CONOCIMIENTO`, `NIVEL_ACADÉMICO`, `NIVEL_DE_FORMACIÓN`, `MODALIDAD`,
`CINE_F_2013_AC_CAMPO_AMPLIO`, `CINE_F_2013_AC_CAMPO_ESPECÍFIC` (así, truncado),
`CINE_F_2013_AC_CAMPO_DETALLADO`, `MUNICIPIO_OFERTA_PROGRAMA`. Ojo: algunos nombres de programa
traen un espacio duro (U+00A0) al final.

### 2.2 En el cerebro (solo lectura)

| Id | Documento | Ruta dentro del cerebro |
|---|---|---|
| C1 | 90 acuerdos definitivos (Acuerdos CNSC 233 a 322 de 2026, del 21 y 22 de octubre) | `45-ACUERDOS-CONVOCATORIA/Directivos Docentes y Docentes 2026/Acuerdo …` |
| C2 | Anexo Técnico definitivo (21/10/2026; publicado en la web de la CNSC el 22/10/2026) | `45-ACUERDOS-CONVOCATORIA/Directivos Docentes y Docentes 2026/Anexo Técnico…` |
| C3 | Texto completo de la Resolución 3842 de 2022 | `20-NORMOGRAMA/Resolución 3842 de 2022 (texto completo).md` |
| C4 | Ficha de la Resolución MEN 018278 de 2023 | `20-NORMOGRAMA/Resolución MEN 018278 de 2023 — inclusión provisional de Derecho en Ciencias Sociales.md` |
| C5 | Sentencia del Consejo de Estado del 27/08/2026 (Derecho y ciencias sociales) | `30-JURISPRUDENCIA/Sentencia CE 27-08-2026 — Derecho y Ciencias Sociales — 2598-2022 (texto completo).md` |
| C6 | Boletín 08 de 2026 (análisis interno de C5) | `75-DOCTRINA-DESPACHO/Boletines jurídicos/Boletín 08 de 2026 — …` |
| C7 | Áreas y NBC del SNIES (documento metodológico del MEN) | `20-NORMOGRAMA/SNIES — Áreas y Núcleos Básicos del Conocimiento (referencia oficial MEN).md` |
| C8 | Directriz interna NBC y SNIES | `10-DOCTRINA/Directrices D3 — VRM y VA/D3 VRM-VA — 07 Formacion Nbc Snies.md` |
| C9 | Fórmulas de respuesta a observaciones 2026 (series F1, F9 y regla 28) | `70-SKILLS/respuestas-observaciones-docentes-2026/SKILL.md` |

El Boletín 08, las directrices D3, las skills y las respuestas del Despacho son **análisis
interno**: sirven para decidir, pero la consulta solo cita el manual, los acuerdos, el Anexo y las
providencias.

### 2.3 Fuentes externas

| Id | Documento | Dónde | Estado |
|---|---|---|---|
| E1 | Auto del Consejo de Estado del 19/05/2026, rad. 11001-03-25-000-2024-00020-00 (0134-2024), Sección Segunda, Subsección A: incluye provisionalmente Derecho en el numeral 2.1.4.18 (ciencias económicas y políticas) | Publicado por Ámbito Jurídico (junio de 2026); el PDF no se pudo leer en línea | Confirmar con la OAJ (V6) |
| E2 | Proyecto de resolución del MEN que agrega «15. Derecho» al numeral 2.1.4.18 en cumplimiento de E1 | Redjurista, compilación de proyectos normativos del 30/06/2026 | **No se encontró la resolución expedida** (V6) |
| E3 | Consulta pública de programas del SNIES | <https://hecaa.mineducacion.gov.co/consultaspublicas/programas> | De aquí salió F8 |
| E4 | Página de Escuelas Normales Superiores del MEN | Portal Adelante Maestros, actualizada el 16/06/2026 | De aquí salió F10 |
| E5 | Página del proceso en la CNSC | <https://www.cnsc.gov.co/convocatorias/en-desarrollo> → «Docentes y Directivos Docentes 2026» | Al 3/11/2026 solo tiene el Anexo; sin avisos, guías ni cronograma |

## 3. Reglas confirmadas

Estas reglas salen de los documentos definitivos. El motor y la consulta deben cumplirlas. Cada
una indica su fuente; cuando haya que mostrarla a la ciudadanía, se cita la fuente oficial, nunca
este plan.

| Id | Regla | Fuente | A quién afecta |
|---|---|---|---|
| R1 | Si la OPEC y el manual difieren, **prevalece el manual** y la OPEC se corrige. La consulta se basa en el manual; la OPEC se usa para vacantes y como texto de apoyo | Acuerdos, art. 8, par. 1 (C1; en el Acuerdo 233, l. 815-818) | A y B |
| R2 | Fecha de corte: títulos, formación y experiencia deben haberse causado a más tardar el **último día del término de inscripciones**. La etapa posterior de cargue solo permite aportar soportes de lo ya obtenido | Acuerdos, art. 7, par. 6; Anexo, numerales 1.2.6, 3 y 4.2 | B |
| R3 | **Inscripción única** en todo el proceso 2026, cualquiera sea la modalidad. Inscribirse en más de un empleo identificado con número OPEC es causal de exclusión | Acuerdos, art. 7, causal 14 y par. 8; Anexo, numeral 1.2.3 | A (aviso obligatorio en la pantalla de OPEC) |
| R4 | Títulos de educación superior del exterior: deben estar **convalidados** ante el MEN para participar. La apostilla sola no basta. La experiencia del exterior sí va con apostilla y traducción, sin convalidación | Manual, numeral 3.3 (C3); Anexo, numerales 4.1.1 i), 4.1.2.1 a) y 4.3 | A y B |
| R5 | La VRM se hace contra el manual y contra los conceptos de habilitación del MEN del numeral 3.2. «La sola afinidad disciplinar» de un título no enunciado en el manual no habilita | Anexo, numeral 4 | A y B |
| R6 | Docente de inglés: además del título, exige **nivel B2** acreditado con los exámenes de la Resolución MEN 018035 de 2021, vigente a la fecha de corte | Anexo, numerales 4 y 5.1.12 | A (mostrar junto al empleo) y B (alerta) |
| R7 | Directivos docentes: exigen experiencia. El verificador solo revisa formación; su resultado se llama «cumple el requisito de formación» | Anexo, numeral 4.1.1 b); OPEC (campo de experiencia) | A (mostrar la experiencia de la OPEC) y B |
| R8 | La tarjeta profesional reemplaza los demás documentos de estudio | Anexo, numeral 4.1.2.1 | B |
| R9 | Certificado de terminación de materias: el numeral 4.3 lo admite para estudios y el 4.1.2.1 no. Mientras se aclare, va a «Revisión humana» | Anexo, numerales 4.1.2.1 y 4.3 | B |
| R10 | VA: el factor 1 valora solo el título usado en la VRM. El factor 2 es «en ciencias de la educación afín al cargo»; en el orientador, «ciencias de la educación, psicología, trabajo social o áreas afines al cargo». En directivos, los posgrados en gestión, administración o planeación educativa van al factor 2 | Anexo, numerales 5, 5.1.1 a 5.1.5 y 5.1.11 | B |
| R11 | Nombres de las modalidades: «Abierto con reserva para personas con discapacidad» y «Abierto sin reserva». Primero se inscribe la modalidad con reserva; luego, la sin reserva | Anexo, numeral 1.1; acuerdos, art. 3 | A |
| R12 | Las vacantes con reserva que queden desiertas pasan a la modalidad sin reserva, a veces con número OPEC nuevo, y se publica una matriz de correspondencia | Anexo, numeral 1.3; acuerdos, art. 8, par. 6 | A (actualizar F7) |
| R13 | Grupos territoriales: Bolívar (Acuerdo 262: grupos A, B y C) y Cauca (Acuerdo 281: grupos A y B). La persona solo se inscribe en un grupo | Acuerdos 262 y 281, art. 8, par. 9 | A |
| R14 | Profesional no licenciado: el posgrado en educación o el programa de pedagogía se acredita **al terminar el período de prueba**, no al inscribirse, y lo verifica la entidad territorial | Decreto Ley 1278 de 2002, art. 12, par. 1; manual, numeral 3.8 | A (ficha) |
| R15 | Normalista superior: título de una Escuela Normal Superior; no figura en el SNIES | Manual, numerales 2.1.4.1 y 2.1.4.2 (C3); Anexo, numeral 4.1.1 | A y B |
| R16 | En la taxonomía del SNIES, el área «Ciencias de la Educación» tiene un solo NBC: «Educación» (código 313). «Deportes, educación física y recreación» (558) es de otra área | C7 | Insumo para D10 |
| R17 | Las respuestas del Despacho verifican el título «por su denominación» y tratan el SNIES como «constatación»; el NBC no extiende la habilitación | Respuestas del cerebro (no vinculantes) | Insumo para D10 |

## 4. Decisiones

Estado al 3 de noviembre de 2026. Cuando una decisión se tome, la persona responsable cambia su
estado aquí, con la fecha.

| Id | Decisión | Estado | Comportamiento provisional mientras esté abierta | Bloquea |
|---|---|---|---|---|
| D1 | Dónde vive la consulta ciudadana | **Resuelta (3/11/2026):** dentro del asistente, como tarjeta principal «¿Mi título sirve para ser docente?», encima de los demás temas | No aplica | No aplica |
| D2 | Fuente y fecha del SNIES | **Resuelta (3/11/2026):** F8, consulta pública del MEN descargada el 3/11/2026 | No aplica | No aplica |
| D3 | Textos de la consulta y de las fichas | Abierta. Santiago los redacta a partir de las respuestas firmadas del Despacho y de las fórmulas de C9; la persona responsable los aprueba (V4) | Marcador `[TEXTO PENDIENTE: <código>]` | A3 |
| D4 | Títulos que el manual no lista | Recomendación: «No sirve» con la ficha del numeral 3.2 (consulta) y «No cumple» con nota (analista), salvo que exista un concepto del MEN en el registro de B5 | Aplicar la recomendación | A3, B3 |
| D5 | Títulos del exterior | **Resuelta por el Anexo:** se exige convalidación (R4). La regla 28 de C9, que acepta la apostilla en la VRM, debe armonizarse | Aplicar R4 | B3 |
| D6 | Afinidad de títulos adicionales en la VA | Abierta. La define un documento de «criterios objetivos» que la CNSC publicará antes de la VA (Anexo, 5.1.11); no existe todavía | Factor 2 solo para títulos de ciencias de la educación; en directivos, también gestión, administración o planeación educativa; en el orientador, psicología y trabajo social; todo lo demás al factor 3, con el motivo «relación por establecer» | B3 |
| D7 | Derecho para ciencias sociales | Abierta. La sentencia del 27/08/2026 revocó la cautelar desde su ejecutoria, que no está acreditada. Los acuerdos (21-22/10) llaman «vigente» a la 3842 y no citan la 018278; la OPEC sí incluye Derecho | «Requiere análisis», con la ficha `DERECHO_SOCIALES` | A3 |
| D8 | Qué se publica mientras haya reglas en «revisar» | Abierta. Recomendación: publicar cuando estén validados los empleos de V1 (prioridad 1) | Los empleos sin validar responden «requiere análisis», nunca «sirve» | A6 |
| D9 | Botón para funcionarios | Abierta. Recomendación: el botón va al pie del asistente y lleva a la ubicación institucional del verificador, protegida con la cuenta de la CNSC; no abre el verificador dentro de la página pública | No crear el botón hasta tener la ubicación | A6 |
| D10 | Regla de «licenciado» (numeral 3.1) frente al NBC | Abierta. Opción 1: basta la denominación «licenciatura» y el NBC solo confirma (como responde el Despacho, R17). Opción 2: exigir el NBC «Educación» (lectura actual del verificador, coherente con R16). Con la opción 2, 105 licenciaturas de F8 no servirían para primaria ni preescolar; 35 están «Sin clasificar», varias activas. Recomendación: opción 1, con «requiere análisis» para las que no están en el NBC «Educación» | Licenciatura con NBC «Educación» → regla normal; licenciatura con otro NBC o sin clasificar → «requiere análisis» con motivo `LICENCIATURA_NBC` | S2, A3, B3 |
| D11 | Derecho para ciencias económicas y políticas | Abierta. Existe el auto E1 y el proyecto E2; no se encontró la resolución expedida; la OPEC no lo incluye | «Requiere análisis», con la ficha `DERECHO_ECONOMICAS` | S5, A3 |
| D12 | ¿El SNIES completo (8,4 MB) entra al repositorio? | Abierta. Recomendación: sí, en la rama, para que cualquiera reproduzca los resultados con el mismo archivo | Si no está en la rama, pedir el archivo a la persona responsable y comprobar el SHA-256 de su `FUENTE.md` | S1, B1 |
| D13 | Base del asistente con documentos definitivos | Abierta. `kb.json` se hizo con el proyecto de Anexo. Hay que regenerarla con los 90 acuerdos y el Anexo definitivos | El asistente sigue con la base actual; la consulta de títulos no depende de ella | G1 |

## 5. Lo que ya está hecho

En la rama `claude/verificador-titulos`, sin fusionar en `master` y sin publicar:

- **Motor determinista** (`verificador-titulos/nucleo/`): ubica el título en el SNIES, lo compara
  con las reglas del manual, dictamina con motivo y fuente, y clasifica y puntúa la VA. Archivos:
  `texto.ts`, `zip.ts`, `tabla.ts`, `snies.ts`, `manual.ts`, `motor.ts`, `va.ts`, `lote.ts`.
- **Herramienta interna** `verificador-titulos.html` (un aspirante y lote), con informe CSV.
- **Manual transcrito** (F1 a F5): 23 empleos y 446 reglas, todas en «revisar». Coincide en 309
  de 312 ítems con el texto del cerebro; las tres diferencias son errores del OCR del cerebro.
- **Parámetros de VA 2026** (F6).
- **Pruebas:** `npm run prueba:verificador`, 104 comprobaciones en verde.
- **Datos descargados el 3/11/2026:** F8 y F10.

## 6. Tareas

Cada tarea dice: objetivo, dependencias, archivos, pasos, cifras de control y cuándo está
terminada. Los dueños de cada carpeta están en la sección 7.

### 6.1 Persona responsable

#### V1. Validar el manual transcrito

- **Objetivo:** que las reglas pasen de «revisar» a «vigente», empleo por empleo.
- **Archivos:** F1, F2, el PDF de la Resolución 3842 y F4.
- **Pasos por empleo:**
  1. Abra en F1 el bloque `@ <numeral> | <empleo_id> | …` del empleo.
  2. Compare cada ítem con la hoja indicada del PDF: texto, mayúsculas y puntuación.
  3. Abra en F2 las filas cuya clave empieza por ese numeral y confirme que cada regla dice lo
     mismo que el ítem.
  4. Si todo coincide, agregue una línea a F4: `<empleo_id>   # validado por <iniciales>, <AAAA-MM-DD>`.
  5. Corra `python herramientas/manual_3842.py` y confirme que el empleo sale en «vigente».
- **Orden** (de más a menos vacantes; los seis primeros suman el 62 % de las vacantes con solo 35 reglas):

| Prioridad | empleo_id | Vacantes | Reglas |
|---|---|---|---|
| 1 | DOC-PRIMARIA | 8.953 | 3 |
| 1 | DOC-PREESCOLAR | 4.069 | 10 |
| 1 | DOC-MATEMATICAS | 2.201 | 9 |
| 1 | DOC-ORIENTADOR | 2.149 | 9 |
| 1 | DIR-COORDINADOR | 1.279 | 2 |
| 1 | DIR-RECTOR | 676 | 2 |
| 2 | DOC-INGLES | 1.967 | 32 |
| 2 | DOC-CIENCIAS-SOCIALES | 1.676 | 30 |
| 2 | DOC-HUMANIDADES-CASTELLANA | 1.527 | 39 |
| 2 | DOC-CIENCIAS-NATURALES | 1.360 | 59 |
| 2 | DOC-TECNOLOGIA | 1.182 | 35 |
| 3 | DOC-EDUCACION-FISICA | 899 | 18 |
| 3 | DOC-QUIMICA | 868 | 18 |
| 3 | DOC-ARTISTICA-MUSICA | 512 | 20 |
| 3 | DOC-ARTISTICA-PLASTICAS | 387 | 20 |
| 3 | DOC-ARTISTICA-DANZAS | 375 | 19 |
| 3 | DOC-FISICA | 361 | 24 |
| 3 | DOC-RELIGIOSA | 194 | 20 |
| 3 | DOC-FILOSOFIA | 172 | 7 |
| 3 | DOC-ETICA | 147 | 15 |
| 3 | DOC-ARTISTICA-ESCENICAS | 89 | 23 |
| 3 | DOC-ECONOMICAS-POLITICAS | 80 | 28 |
| 3 | DIR-DIRECTOR-RURAL | 41 | 4 |

- **Terminada cuando:** `python herramientas/manual_3842.py` informa 23 de 23. Para publicar (D8)
  basta la prioridad 1.

#### V2. Revisar las 26 «Lecturas del verificador»

- **Archivos:** F2 (columna `nota`, filas que contienen «Lectura del verificador»).
- **Distribución:** humanidades y lengua castellana 8, ciencias naturales 4, inglés 3, educación
  física 3, tecnología 2, artes plásticas 2, artes escénicas 2, música 2.
- **Terminada cuando:** cada nota queda confirmada o corregida en F2, y `manual_3842.py` corre sin errores.

#### V3. Resolver las decisiones abiertas

- Actualice el estado de cada decisión de la sección 4 con la fecha. Prioridad: D10, D7, D11, D8 y D9.

#### V4. Aprobar los textos de la consulta

- Santiago entrega `verificador-titulos/textos-consulta.md` con un texto por código (lista en S3).
- **Terminada cuando:** cada código tiene texto aprobado y marcado «Aprobado <fecha>».

#### V5. Línea base de derechos de petición

- Con Fabián, cuente los derechos de petición sobre títulos docentes que llegan hoy y defina cómo
  se contarán después de publicar. Solo cifras agregadas.

#### V6. Consultas a la Oficina Asesora Jurídica

Una sola solicitud con tres preguntas:
1. Constancia de ejecutoria de la sentencia del 27/08/2026, rad. 11001-03-25-000-2022-00318-00
   (2598-2022), sobre Derecho en ciencias sociales (D7).
2. Si el MEN expidió la resolución que agrega Derecho al numeral 2.1.4.18 en cumplimiento del auto
   del 19/05/2026, rad. 11001-03-25-000-2024-00020-00 (0134-2024), y su número y fecha (D11).
3. Cómo se aplican al proceso 2026 los dos puntos anteriores, dado R1.
- **Terminada cuando:** las respuestas quedan anotadas en D7 y D11, con fecha.

#### V7. Solicitud al MEN (Dirección de Calidad para la Educación Preescolar, Básica y Media)

1. Listado vigente de Escuelas Normales Superiores acreditadas (F10 es de 2014 y habla de
   autorización de funcionamiento).
2. Conceptos de habilitación de títulos emitidos por la vía del numeral 3.2 de la Resolución 3842.
- **Terminada cuando:** lo recibido se guarda en `verificador-titulos/fuentes/` con su `FUENTE.md`
  (B5 lo carga).

#### V8. Ajustar la regla 1 de `CLAUDE.md`

- Hoy la regla 1 dice que las fuentes del asistente salen solo de `kb.json` y `opec.json`. Para que
  la consulta cite el manual, la persona responsable agrega el manual transcrito
  (`verificador-titulos/manual/manual-funciones-3842-2022.csv`) como tercera fuente literal.
- **Lo hace la persona responsable.** Nadie más edita `CLAUDE.md`. Bloquea A3.

#### V9. Entregar los documentos definitivos para la base del asistente

- Ponga los 90 acuerdos y el Anexo definitivos en la carpeta que lee `python herramientas/extract.py`
  (la misma de siempre, fuera del repositorio), con el mismo formato que los proyectos. Bloquea G1.

#### V10. Avisar a la dirección del proceso

Tres hallazgos de los documentos definitivos:
1. **Colegio de Boyacá:** el Acuerdo 241 certifica 53 vacantes (oficio 2026RE290631 del
   14/10/2026) y F7 trae 54. Las otras 89 entidades coinciden exactamente.
2. **Remisiones erradas en el Anexo:** el 5.1.8 remite el cómputo al 5.1.12 (que trata Saber Pro)
   y el 5.1.10 cita una conversión de jornadas en el 5.1.8 y el 5.1.9 que no está ahí.
3. **Contradicción del Anexo** sobre el certificado de terminación de materias (R9).

### 6.2 Fabián: datos, motor y flujo interno

Fabián es dueño de `verificador-titulos/nucleo/`, `verificador-titulos/datos/`, `verificador-titulos/fuentes/`
y de `herramientas/` salvo la parte de la consulta en `herramientas/construir.mjs` (sección 7).

#### S1. Catálogo de denominaciones desde el SNIES completo

- **Objetivo:** el catálogo que usa el buscador de la consulta.
- **Depende de:** D12 (que F8 esté en la rama).
- **Crea:** `herramientas/snies_catalogo.py` y `verificador-titulos/datos/snies-denominaciones.json`.
- **Pasos:**
  1. Lea F8 con `openpyxl` (ya lo usa `herramientas/opec.py`). Busque el encabezado por nombre de
     columna, no por posición. Descarte filas vacías.
  2. Normalice el nombre del programa para agrupar: quite el espacio duro (U+00A0) y los espacios
     repetidos; para la clave, pase a minúsculas y quite tildes. Conserve el nombre original más
     frecuente para mostrar.
  3. Agrupe por clave normalizada. Para cada denominación guarde: `nombre`, `clave`, `titulos`
     (títulos otorgados distintos), `niveles` (`NIVEL_DE_FORMACIÓN` distintos), `nbc` (distintos),
     `areas` (distintas), `programas_activos`, `programas_inactivos`.
  4. Incluya todos los niveles de formación: la consulta debe poder decir que un posgrado no
     reemplaza el pregrado o que un técnico no está admitido.
  5. Escriba el JSON con esta cabecera: `{"fuente": {"archivo": "...", "sha256": "...", "url": "...",
     "fecha_descarga": "2026-11-03"}, "totales": {...}, "denominaciones": [...]}`. La fuente se copia
     del `FUENTE.md` de F8.
  6. El script imprime un informe: filas leídas, activos, inactivos, denominaciones, denominaciones
     con más de un NBC, licenciaturas con NBC «Educación» y con otro NBC o «Sin clasificar».
- **Cifras de control:** las de la sección 2.1. Si alguna no cuadra, deténgase.
- **Pruebas:** `pruebas/verificador/snies_catalogo.prueba.mjs` (o dentro de `nucleo.prueba.ts`)
  comprueba los totales y tres denominaciones conocidas: «Licenciatura en Matemáticas» (más de un
  NBC), «Licenciatura en Educación Básica Primaria» (incluye «Sin clasificar») y «Derecho».
- **Terminada cuando:** el JSON se genera, las cifras cuadran, las pruebas pasan y `snies-data.ts`
  ya no se usa en ningún código nuevo.

#### S2. Consulta por denominación

- **Objetivo:** dar, para una denominación, la respuesta de los 23 empleos.
- **Depende de:** S1.
- **Crea:** `verificador-titulos/nucleo/consulta.ts`.
- **Firma:**

  ```ts
  export type RespuestaEmpleo = 'SIRVE' | 'NO_SIRVE' | 'REQUIERE_ANALISIS';
  export interface ResultadoConsulta {
    empleoId: string;            // p. ej. 'DOC-PRIMARIA'
    respuesta: RespuestaEmpleo;
    motivos: string[];           // códigos de la lista de S3, nunca texto libre
    regla: { modo: string; valor: string; numeral: string; hoja: string; textoLiteral: string } | null;
  }
  export function consultarTitulo(denominacion: string, manual: Manual, catalogo: Catalogo): ResultadoConsulta[];
  ```

- **Pasos:**
  1. Busque la denominación en el catálogo de S1 por su clave normalizada. Si no está, evalúe
     solo por el nombre (sin NBC) y agregue el motivo `NO_EN_CATALOGO`.
  2. Para cada empleo del manual, reutilice la evaluación del motor (`evaluarTitulo` de
     `motor.ts`). Si hace falta, cree un `TituloDeclarado` mínimo con el nombre, sin institución
     ni fechas.
  3. Si la denominación tiene varios NBC, evalúe con cada uno. Si las respuestas difieren, el
     resultado es `REQUIERE_ANALISIS` con el motivo `VARIOS_NBC`.
  4. Traduzca: `CUMPLE` → `SIRVE`, `NO_CUMPLE` → `NO_SIRVE`, `REVISION` → `REQUIERE_ANALISIS`.
  5. Regla en «revisar» (empleo sin validar en V1): nunca `SIRVE`; da `REQUIERE_ANALISIS` con el
     motivo `REGLA_SIN_VALIDAR`.
  6. Aplique el comportamiento provisional de D10 (`LICENCIATURA_NBC`), D7 (`DERECHO_SOCIALES`) y
     D11 (`DERECHO_ECONOMICAS`).
  7. `textoLiteral` sale de F1 (el ítem del manual), sin cambiar una letra.
- **Pruebas:** en `pruebas/verificador/`. Como mínimo:
  - «Licenciatura en Matemáticas»: `DOC-MATEMATICAS` no es `NO_SIRVE`.
  - «Derecho»: `DOC-CIENCIAS-SOCIALES` y `DOC-ECONOMICAS-POLITICAS` dan `REQUIERE_ANALISIS`.
  - «Especialización en Pedagogía»: ningún empleo da `SIRVE` (un posgrado no reemplaza el pregrado).
  - Un nombre inventado («Licenciatura en Astrología Marina»): motivo `NO_EN_CATALOGO`.
  - Mientras F4 esté vacío, ningún empleo da `SIRVE`.
- **Terminada cuando:** la función está exportada, las pruebas pasan y hay un ejemplo de uso en
  `verificador-titulos/LEEME.md` para Santiago.

#### S3. Motivos y fichas

- **Objetivo:** que `consultarTitulo` diga qué ficha mostrar. Los textos los escribe Santiago (D3).
- **Lista cerrada de códigos** (no agregue otros sin anotarlo en la bitácora):

| Código | Cuándo | Fuente para el texto |
|---|---|---|
| `REGLA_SIN_VALIDAR` | El empleo no está validado en V1 | No requiere fuente: es un estado interno |
| `VARIOS_NBC` | La denominación tiene varios NBC y el resultado cambia | C8 |
| `LICENCIATURA_NBC` | Licenciatura con NBC distinto de «Educación» o sin clasificar (D10) | Manual, numeral 3.1 |
| `NO_EN_CATALOGO` | El nombre no está en el catálogo | C8, regla R04 |
| `NO_LISTADO_3_2` | El título no figura en el manual para ese empleo | Manual, numeral 3.2; Anexo, numeral 4 (R5) |
| `POSGRADO_NO_SUPLE` | El título es un posgrado | Regla del verificador (LEEME). **Sin texto literal en el Anexo: el texto debe salir del manual o de una respuesta firmada** |
| `TECNOLOGO_3_1` | Tecnólogo en educación | Manual, numeral 3.1 |
| `NORMALISTA` | Normalista superior | Manual y Anexo (R15) |
| `NO_LICENCIADO_3_8` | Profesional no licenciado que sirve | Manual, numeral 3.8 (R14) |
| `EXTERIOR_CONVALIDACION` | Siempre visible en la consulta, como aviso general | Manual, numeral 3.3; Anexo (R4) |
| `DERECHO_SOCIALES` | Derecho y ciencias sociales | D7, C5 y fórmula F9 de C9 |
| `DERECHO_ECONOMICAS` | Derecho y ciencias económicas y políticas | D11, E1 |
| `INGLES_B2` | Docente de inglés | Anexo, numeral 4 (R6) |
| `DIRECTIVO_EXPERIENCIA` | Rector, coordinador y director rural | R7; texto de experiencia de la OPEC |

- **Terminada cuando:** hay al menos un caso de prueba por código.

#### S4. Cruce con la OPEC

- **Depende de:** S2.
- **Crea:** `verificador-titulos/datos/empleos-opec.json` y la función `opecParaTitulo(denominacion)`
  en `consulta.ts`.
- **Pasos:**
  1. Escriba la tabla fija de correspondencia (no la deduzca por parecido):

| Denominación en la OPEC | empleo_id |
|---|---|
| DOCENTE DE PRIMARIA | DOC-PRIMARIA |
| DOCENTE DE PREESCOLAR | DOC-PREESCOLAR |
| DOCENTE DE AULA MATEMÁTICAS | DOC-MATEMATICAS |
| DOCENTE ORIENTADOR | DOC-ORIENTADOR |
| DOCENTE DE AULA IDIOMA EXTRANJERO INGLES | DOC-INGLES |
| DOCENTE DE AULA CIENCIAS SOCIALES, HISTORIA, GEOGRAFÍA, CONSTITUCIÓN POLÍTICA Y DEMOCRACIA | DOC-CIENCIAS-SOCIALES |
| DOCENTE DE AULA HUMANIDADES Y LENGUA CASTELLANA | DOC-HUMANIDADES-CASTELLANA |
| DOCENTE DE AULA CIENCIAS NATURALES Y EDUCACIÓN AMBIENTAL | DOC-CIENCIAS-NATURALES |
| COORDINADOR | DIR-COORDINADOR |
| DOCENTE DE AULA TECNOLOGÍA E INFORMÁTICA | DOC-TECNOLOGIA |
| DOCENTE DE AULA EDUCACIÓN FÍSICA, RECREACIÓN Y DEPORTE | DOC-EDUCACION-FISICA |
| DOCENTE DE AULA CIENCIAS NATURALES QUÍMICA | DOC-QUIMICA |
| RECTOR | DIR-RECTOR |
| DOCENTE DE AULA EDUCACIÓN ARTÍSTICA - MÚSICA | DOC-ARTISTICA-MUSICA |
| DOCENTE DE AULA EDUCACIÓN ARTÍSTICA - ARTES PLÁSTICAS | DOC-ARTISTICA-PLASTICAS |
| DOCENTE DE AULA EDUCACIÓN ARTÍSTICA - DANZAS | DOC-ARTISTICA-DANZAS |
| DOCENTE DE AULA CIENCIAS NATURALES FÍSICA | DOC-FISICA |
| DOCENTE DE AULA EDUCACIÓN RELIGIOSA | DOC-RELIGIOSA |
| DOCENTE DE AULA FILOSOFÍA | DOC-FILOSOFIA |
| DOCENTE DE AULA EDUCACIÓN ÉTICA Y VALORES HUMANOS | DOC-ETICA |
| DOCENTE DE AULA EDUCACIÓN ARTÍSTICA - ARTES ESCÉNICAS | DOC-ARTISTICA-ESCENICAS |
| DOCENTE DE ÁREA CIENCIAS ECONÓMICAS Y POLÍTICAS | DOC-ECONOMICAS-POLITICAS |
| DIRECTOR RURAL | DIR-DIRECTOR-RURAL |

  2. `opecParaTitulo` devuelve, por empleo, las OPEC de F7 con entidad, número, vacantes y
     modalidad (con los nombres de R11), y los totales por empleo.
  3. Grupos (R13): para las OPEC de Bolívar y Cauca, agregue el campo `grupo`. Primero busque si
     el reporte de SIMO trae el grupo o los municipios. Si no lo trae, use las tablas del art. 8
     de los Acuerdos 262 y 281 (C1). Asigne un grupo solo si el empleo, la modalidad y las vacantes
     lo determinan sin ambigüedad; si no, deje `grupo: null` y anótelo en la bitácora.
  4. Agregue a `herramientas/manual_3842.py` (o a un script aparte) una comprobación que compare
     el requisito de estudio de cada OPEC (campos `estudio` y `alternativas` de F7) con la
     transcripción, e informe las diferencias.
- **Cifras de control:** 23 denominaciones mapeadas; primaria 8.953 vacantes; la comprobación
  informa solo «Derecho» en ciencias sociales y la errata «extrajeras» corregida en la OPEC.
- **Terminada cuando:** la función y la comprobación funcionan con pruebas.

#### S5. Derecho en ciencias económicas y políticas

- **Archivo:** F3.
- **Pasos:** agregue una fila para `DOC-ECONOMICAS-POLITICAS`, modo `EXACTA`, valor «Derecho», estado
  `revisar`, fuente «Auto del Consejo de Estado del 19/05/2026, rad. 11001-03-25-000-2024-00020-00
  (0134-2024), numeral 2.1.4.18», y una nota que diga que no consta la resolución del MEN que lo
  ejecute. Corra `python herramientas/manual_3842.py`.
- **Terminada cuando:** «Derecho» sale en «Revisión humana» para ese empleo y la prueba de S2 pasa.

#### B1. Cargar el SNIES completo en el verificador interno

- **Depende de:** D12.
- **Archivos:** `verificador-titulos/nucleo/snies.ts` y sus pruebas.
- **Pasos:**
  1. Cargue F8 en `verificador-titulos.html` y en `npm run verificar-titulos`.
  2. Revise los alias de `ALIAS_SNIES`. `CINE_F_2013_AC_CAMPO_ESPECÍFIC` viene truncado: agregue
     ese alias.
  3. Agregue a `ProgramaSnies` los campos `resolucionAprobacion`, `fechaResolucion`, `vigenciaAnos`
     y `reconocimiento` (el Anexo, numeral 4.1.2.1, pide programas con registro calificado), y muéstrelos en el informe del analista
     como dato, sin cambiar el dictamen.
- **Terminada cuando:** F8 carga sin columnas faltantes y las pruebas pasan.

#### B2. Prueba piloto

- **Depende de:** B1 y la prioridad 1 de V1.
- Lote real de una OPEC, solo con inscripción, OPEC y títulos (sin nombres ni documentos),
  comparado con una VRM ya hecha. Informe en la bitácora con cifras agregadas: coincidencias,
  diferencias y causas.

#### B3. Aplicar las reglas y decisiones en el motor

- **Depende de:** V3 para D4, D6 y D10. R4, R7, R8 y R9 ya se pueden aplicar.
- **Pasos:**
  1. **R4:** en `motor.ts` (líneas cercanas a la 296-303), el título de educación superior del
     exterior sin convalidación deja de pasar la VRM. El motivo cita el numeral 3.3 del manual y
     el 4.1.2.1 a) del Anexo. Quite la cita al Criterio Unificado del 4/06/2024 para la VRM; en la
     VA (`va.ts`, línea cercana a la 142) se conserva que solo puntúa lo convalidado.
  2. **R7:** para `DIR-*`, el dictamen visible dice «Cumple el requisito de formación» y agrega la
     alerta de experiencia.
  3. **R8:** agregue el tipo de documento «tarjeta profesional» a la tabla de aspirantes.
  4. **R9:** el certificado de terminación de materias va a «Revisión humana» con motivo.
  5. **R10 y D6:** factor 2 en directivos para posgrados en gestión, administración o planeación
     educativa; pruebe que hoy lo cubre la raíz «educativ» de `va.ts` o agréguelo.
  6. **R6:** para `DOC-INGLES`, alerta «Requiere nivel B2 (Anexo, numeral 4)».
  7. **D4 y D10:** según lo decidido en V3.
  8. Actualice `verificador-titulos/LEEME.md`, sección «Reglas que aplica».
- **Terminada cuando:** cada punto tiene una prueba y `npm run prueba:verificador` pasa.

#### B4. Deducir el empleo desde el número de OPEC

- **Depende de:** S4. Un lote solo con números de OPEC da los mismos dictámenes que con `empleo_id`.

#### B5. Registro de conceptos de habilitación del MEN

- **Depende de:** V7 (si no llega nada, la tabla queda vacía y la tarea igual se hace).
- **Crea:** `verificador-titulos/fuentes/habilitaciones-men.csv` con las columnas `empleo_id`,
  `titulo`, `numero_concepto`, `fecha`, `fuente`. El motor la consulta antes de dictaminar «No
  cumple» y cita el concepto.
- **Terminada cuando:** un título de prueba habilitado por concepto sale con ese concepto como fuente.

#### B6. Escuelas Normales

- **Archivo:** F10.
- **Pasos:** si el aspirante declara una institución como normalista, el verificador busca el
  nombre en F10 (normalizado) y, si no la encuentra, agrega una alerta, sin rechazar. El motivo
  aclara que el listado es de 2014.

#### G1. Base del asistente con los documentos definitivos

- **Depende de:** V9.
- **Pasos:** corra `python herramientas/extract.py` y `python herramientas/buildkb.py` con los
  documentos definitivos; compruebe que las 90 entidades de F7 existen en la nueva `kb.json`
  (`herramientas/construir.mjs` ya lo valida); corra `npm run construir` y `npm run prueba`.
- **Terminada cuando:** `kb.json` ya no contiene «Proyecto de Anexo» y todas las pruebas pasan.

#### G2. OPEC actualizada

- **Depende de:** un reporte de SIMO posterior al 22/10/2026 (lo entrega la persona responsable).
- **Pasos:** `python herramientas/opec.py "<ruta>" --corte AAAA-MM-DD`. Compare los totales por
  entidad con las tablas del art. 8 de los acuerdos (31.163 vacantes: 2.255 con reserva y 28.908
  sin reserva). Repetir después del acto de vacantes desiertas (R12).

### 6.3 Santiago: consulta ciudadana dentro del asistente

Santiago es dueño de `src/js/consulta-titulos.js`, `src/css/consulta-titulos.css`,
`verificador-titulos/textos-consulta.md`, `pruebas/consulta_titulos.mjs` y de los cambios de la
consulta en `herramientas/construir.mjs` y `herramientas/temas.json` (sección 7). Usa el núcleo
sin modificarlo; si necesita un cambio, se lo pide a Fabián.

#### A1. Estructura dentro del asistente

- **Objetivo:** que la consulta se construya dentro de `asistente-docentes.html` (D1).
- **Pasos:**
  1. Cree `src/js/consulta-titulos.js`. Importe la consulta del núcleo
     (`../../verificador-titulos/nucleo/consulta.ts`; esbuild compila TypeScript).
  2. Cree `src/css/consulta-titulos.css` y agréguelo a la lista de hojas de `herramientas/construir.mjs`.
  3. En `herramientas/construir.mjs`, incruste el catálogo (S1), el manual (F5) y la correspondencia
     (S4) junto a los datos actuales (`kb`, `faq`, `temas`, `opec`). No dependa de internet.
  4. Agregue la tarjeta principal «¿Mi título sirve para ser docente?» encima de las tarjetas de
     temas (`src/js/temas.js` y `herramientas/temas.json`). El texto de la tarjeta sale de V4.
  5. Mida el tamaño de `asistente-docentes.html` antes (2.405.187 bytes) y después, y anótelo.
     Si crece más de 3 MB, pregunte antes de seguir.
- **Mientras S1 no esté:** use los datos de prueba de `pruebas/verificador/`.
- **Terminada cuando:** `npm run construir` genera el archivo y `npm run prueba` sigue en verde.

#### A2. Buscador del título

- Combobox accesible (patrón ARIA «combobox» con lista desplegable) sobre las denominaciones de S1.
- Tolera tildes, mayúsculas, espacios dobles y la abreviatura «Lic.».
- Funciona con teclado (flechas, Enter, Escape), lector de pantalla y celular.
- Si no hay coincidencia, muestra el texto de `NO_EN_CATALOGO` y permite seguir con el nombre
  escrito. Nunca concluye «no sirve» solo porque no está en el catálogo.
- **Terminada cuando:** se elige un programa solo con teclado y en 320 px de ancho.

#### A3. Respuesta

- **Depende de:** S2, S3, S4, V4 y V8.
- **La pantalla tiene, en este orden:**
  1. Resumen: cuántos empleos sirven, cuántos requieren análisis y cuántas vacantes suman.
  2. Aviso de inscripción única (R3), con el texto literal del Anexo, numeral 1.2.3.
  3. Aviso de que es una orientación y no la VRM.
  4. Lista de empleos agrupada en docente de aula (por área), docente orientador y directivos
     docentes, con la respuesta de cada uno.
  5. En cada empleo, un «¿Por qué?» desplegable con el `textoLiteral` del manual y su numeral y
     hoja (R1: la fuente es el manual).
  6. Para inglés, el requisito B2 (R6). Para directivos, la experiencia de la OPEC (R7).
  7. Debajo de cada empleo, sus OPEC (S4): entidad, número, vacantes y modalidad con los nombres
     de R11; en Bolívar y Cauca, el grupo (R13). Filtro por entidad territorial.
  8. Las fichas que correspondan, según los códigos de S3.
- **Terminada cuando:** los casos de prueba de S2 dan lo mismo en la página.

#### A4. Aspecto

- Panel EBAR por configuración y CSS propio, sin tocar `vendor/`. Debe verse como el resto del asistente.

#### A5. Pruebas automáticas

- Cree `pruebas/consulta_titulos.mjs` con `pruebas/verificador_titulos.mjs` y `pruebas/opec.mjs`
  como modelos, y agréguelo al script `prueba` de `package.json`.
- Debe cubrir: axe sin errores en tema claro, oscuro y con texto al 200 %; reflujo a 320 px;
  uso solo con teclado; anuncio de resultados en una región viva; y los casos de S2.
- **Terminada cuando:** `npm run prueba` está en verde.

#### A6. Publicación y botón para funcionarios

- **Depende de:** D8, D9, la prioridad 1 de V1 y A5.
- El asistente ya se publica con `.github/workflows/publicar.yml`; no hace falta otro flujo.
- El botón para funcionarios (D9) va al pie y enlaza a la ubicación que defina la persona
  responsable. No abre `verificador-titulos.html` dentro de la página pública.
- **Sin `git push` a `master`.** Se abre una solicitud de cambios hacia `claude/verificador-titulos`.

#### A7. Prueba con personas

- Cinco personas que quieran participar en el proceso de selección, con títulos distintos y desde
  el celular; pruebas con NVDA y TalkBack. Se anota cuánto tardan y dónde se confunden. Meta:
  respuesta en menos de un minuto sin ayuda.

## 7. Orden, ramas y dueños

```
Persona responsable: V6 ── V7 ── V10 ── V1 (prioridad 1) ── V3 (D10, D8, D9) ── V8 ── V2 ── V4 ── V9 ── V5
Fabián:              S1 ── S5 ── S2 ── S3 ── S4 ── B1 ── B3 ── B4 ── B5 ── B6 ── B2 ── G1 ── G2
Santiago:            A1 ── A2 ── (textos para V4) ── A3 ── A4 ── A5 ── A7 ── A6
```

- **Arranque:** V6, V7, S1 y A1 empiezan a la vez. Santiago redacta los textos sin esperar a nadie.
- **Punto de encuentro:** A3 necesita S2, S3, S4, V4 y V8.
- **Ramas:** cada persona crea la suya desde `claude/verificador-titulos`
  (`santiago/consulta-ciudadana` y `fabian/datos-y-analista`) y la integra con una solicitud de
  cambios hacia `claude/verificador-titulos`, nunca directo a `master`.
- **Archivos compartidos:**
  - `herramientas/construir.mjs` y `herramientas/temas.json`: Santiago solo agrega lo de la consulta;
    Fabián no los toca salvo en G1.
  - `package.json`: cada uno agrega su script.
  - `BITACORA_IMPLEMENTACION.md` y `HISTORIAL_SESIONES.md`: cada uno agrega entradas sin
    reescribir las de otros.
  - `CLAUDE.md`: solo la persona responsable (V8).

## 8. Reglas que no cambian

- Sin IA generativa en tiempo de ejecución: el motor es determinista.
- Lo que se muestra como fuente sale literal del manual, de los actos que lo modifican, de los
  acuerdos o del Anexo. Ningún flujo redacta conclusiones jurídicas propias.
- Ningún dato personal se pide, guarda ni envía.
- WCAG 2.1 AA y «personas con discapacidad» en todo texto. «Proceso de selección», «empleo» y
  «vacante».
- Sin `git push` a `master` sin la decisión de la persona responsable.

## 9. Comandos

```
python herramientas/manual_3842.py        # regenera el manual desde la transcripción
npm run construir                         # genera asistente-docentes.html
npm run prueba                            # pruebas del asistente (incluye la consulta desde A5)
npm run construir:verificador             # genera verificador-titulos.html (flujo interno)
npm run prueba:verificador                # pruebas del motor y del flujo interno (104 hoy)
```

Por crear: `python herramientas/snies_catalogo.py` (S1) y `pruebas/consulta_titulos.mjs` (A5).
